import React, { useCallback, useMemo, useState } from 'react';
import { IonModal, IonHeader, IonToolbar, IonButtons, IonButton, IonContent, IonIcon, IonLoading } from '@ionic/react';
import { closeOutline, downloadOutline, printOutline, sendOutline, shareOutline } from 'ionicons/icons';
import { formatters } from '../../../../utils/utils';
import styles from './InvoiceModal.module.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { useCompanyStore } from '../../../../Store/companyStore';
import { api } from '../../../../Store/api';
import { useToken } from '../../../../Store/loginStore';
import { useToast } from '../../../Toast';

interface SellerData {
  name?: string;
  address?: string;
  inn?: string;
  kpp?: string;
  ogrn?: string;
  account?: string;
  bank?: string;
  bankInn?: string;
  bik?: string;
  korAccount?: string;
  bankAddress?: string;
}

interface InvoiceItem {
  item_name: string;
  qty: number;
  unit: string;
  price: number;
  total: number;
}

interface CustomerData {
  name?: string;
  address?: string | number;
  inn?: string;
}

export interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  inv: InvoiceData;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  customer: CustomerData;
  items: InvoiceItem[];
  total: number;
  vat: number;
  paymentPurpose: string;
  paymentDue: string;
  seller: SellerData;
  signer: string;
}

const ONES = [
  '',
  'один',
  'два',
  'три',
  'четыре',
  'пять',
  'шесть',
  'семь',
  'восемь',
  'девять',
];
const ONES_FEM = [
  '',
  'одна',
  'две',
  'три',
  'четыре',
  'пять',
  'шесть',
  'семь',
  'восемь',
  'девять',
];
const TEENS = [
  'десять',
  'одиннадцать',
  'двенадцать',
  'тринадцать',
  'четырнадцать',
  'пятнадцать',
  'шестнадцать',
  'семнадцать',
  'восемнадцать',
  'девятнадцать',
];
const TENS = [
  '',
  '',
  'двадцать',
  'тридцать',
  'сорок',
  'пятьдесят',
  'шестьдесят',
  'семьдесят',
  'восемьдесят',
  'девяносто',
];
const HUNDREDS = [
  '',
  'сто',
  'двести',
  'триста',
  'четыреста',
  'пятьсот',
  'шестьсот',
  'семьсот',
  'восемьсот',
  'девятьсот',
];

function triadToWords(n: number, female = false): string {
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const o = n % 10;
  const parts: string[] = [];
  if (h) parts.push(HUNDREDS[h]);
  if (t > 1) {
    parts.push(TENS[t]);
    if (o) parts.push(female ? ONES_FEM[o] : ONES[o]);
  } else if (t === 1) {
    parts.push(TEENS[o]);
  } else if (o) {
    parts.push(female ? ONES_FEM[o] : ONES[o]);
  }
  return parts.join(' ');
}

function pluralForm(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function amountInWords(value: number): string {
  const amount = Math.max(0, Math.round(Number(value) || 0));
  if (amount === 0) return 'Ноль рублей 00 копеек';

  const rub = Math.floor(amount);
  const kop = Math.round((Number(value) - rub) * 100) || 0;
  const millions = Math.floor(rub / 1_000_000);
  const thousands = Math.floor((rub % 1_000_000) / 1000);
  const rest = rub % 1000;
  const parts: string[] = [];

  if (millions) {
    parts.push(
      `${triadToWords(millions)} ${pluralForm(millions, 'миллион', 'миллиона', 'миллионов')}`
    );
  }
  if (thousands) {
    parts.push(
      `${triadToWords(thousands, true)} ${pluralForm(thousands, 'тысяча', 'тысячи', 'тысяч')}`
    );
  }
  if (rest || (!millions && !thousands)) {
    parts.push(triadToWords(rest));
  }

  const rubWord = pluralForm(rub, 'рубль', 'рубля', 'рублей');
  const kopWord = pluralForm(kop, 'копейка', 'копейки', 'копеек');
  const text = `${parts.join(' ').replace(/\s+/g, ' ').trim()} ${rubWord} ${String(kop).padStart(2, '0')} ${kopWord}`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function dash(value?: string | number | null): string {
  const text = value == null ? '' : String(value).trim();
  return text || '—';
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, inv }) => {
  const [load, setLoad] = useState(false);
  const seller = inv.seller || {};
  const customer = inv.customer || {};
  const items = inv.items?.length
    ? inv.items
    : [{ item_name: '', qty: 0, unit: '', price: 0, total: 0 }];
  const email = useCompanyStore((state) => state.data?.email);
  const token = useToken();
  const toast = useToast();

  const totalWords = useMemo(() => amountInWords(inv.total || 0), [inv.total]);
  const itemsCount = inv.items?.length || 0;

  const handlePrint = () => {
    window.print();
  };

  const send_email = async (data: any) => {
    setLoad(true);
    const res = await api('api/sendEmail', data);
    if (res.success) toast.success('Счет отправлен на почту ');
    else toast.error('Ошибка отправки почты');
    setLoad(false);
  };

  const buildInvoicePdf = useCallback(async (): Promise<{
    base64: string;
    blob: Blob;
    fileName: string;
  } | null> => {
    const invoiceEl = document.querySelector(`.${styles.sheet}`) as HTMLElement;
    if (!invoiceEl) return null;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const canvas = await html2canvas(invoiceEl, {
      useCORS: true,
      backgroundColor: '#ffffff',
      scale: 2,
      width: invoiceEl.scrollWidth,
      height: invoiceEl.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 8;
    const usableWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * usableWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(imgData, 'PNG', margin, position, usableWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;

    while (heightLeft > 0) {
      position = margin - (imgHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, usableWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;
    }

    const dataUri = pdf.output('datauristring');
    const base64 = dataUri.split(',')[1];
    const blob = await fetch(dataUri).then((r) => r.blob());
    const fileName = `invoice_${inv.invoiceNumber || 'document'}.pdf`;

    return { base64, blob, fileName };
  }, [inv.invoiceNumber]);

  const handleEmail = async () => {
    try {
      const built = await buildInvoicePdf();
      if (!built) {
        toast.error('Не удалось подготовить PDF');
        return;
      }
      send_email({ token, email, pdf: built.base64 });
    } catch (err) {
      console.error('Ошибка при сохранении PDF:', err);
      toast.error('Ошибка при подготовке счёта');
    }
  };

  const handleDownload = async () => {
    try {
      const built = await buildInvoicePdf();
      if (!built) {
        toast.error('Не удалось подготовить PDF');
        return;
      }

      if (!Capacitor.isNativePlatform()) {
        const url = URL.createObjectURL(built.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = built.fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success(`Счёт сохранён: ${built.fileName}`);
        return;
      }

      await Filesystem.writeFile({
        path: built.fileName,
        data: built.base64,
        directory: Directory.Library,
      });
      toast.success(`Счёт сохранён как ${built.fileName}`);
    } catch (err) {
      console.error('Ошибка при сохранении PDF:', err);
      toast.error('Не удалось сохранить счёт');
    }
  };

  const shareSummaryText = `Счёт №${inv.invoiceNumber} от ${inv.invoiceDate}. Сумма: ${formatters.currency(inv.total)}`;

  const handleShare = async () => {
    setLoad(true);
    try {
      const built = await buildInvoicePdf();
      if (!built) {
        toast.error('Не удалось подготовить PDF');
        return;
      }

      const { base64, blob, fileName } = built;
      const title = `Счёт на оплату №${inv.invoiceNumber}`;

      if (Capacitor.isNativePlatform()) {
        const { value: shareSupported } = await Share.canShare();
        if (shareSupported) {
          try {
            const { uri } = await Filesystem.writeFile({
              path: fileName,
              data: base64,
              directory: Directory.Cache,
            });

            await Share.share({
              title,
              text: shareSummaryText,
              files: [uri],
              dialogTitle: 'Поделиться',
            });
            return;
          } catch (shareErr) {
            console.warn('Share with file failed, fallback to text', shareErr);
          }
        }

        await Share.share({
          title,
          text: shareSummaryText,
          dialogTitle: 'Поделиться',
        });
        return;
      }

      if (typeof navigator !== 'undefined' && navigator.share) {
        const file = new File([blob], fileName, { type: 'application/pdf' });
        const withFiles: ShareData = { title, text: shareSummaryText, files: [file] };

        if (typeof navigator.canShare === 'function' && navigator.canShare(withFiles)) {
          await navigator.share(withFiles);
          return;
        }

        await navigator.share({ title, text: shareSummaryText });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${title}\n${shareSummaryText}`);
        toast.success('Текст скопирован — вставьте в мессенджер');
        return;
      }

      toast.info('Сохраните счёт через кнопку загрузки и отправьте файл');
    } catch (e: unknown) {
      const err = e as { name?: string };
      if (err?.name === 'AbortError') return;
      console.error(e);
      toast.error('Не удалось открыть «Поделиться»');
    } finally {
      setLoad(false);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className={styles.modal}>
      <IonHeader>
        <IonToolbar className={styles.toolbar}>
          <IonButtons slot="start">
            <IonButton onClick={handleDownload} size="small" title="Сохранить">
              <IonIcon icon={downloadOutline} slot="start" />
              Сохранить
            </IonButton>
            <IonButton onClick={handleEmail} size="small" title="На почту">
              <IonIcon icon={sendOutline} slot="start" />
              На почту
            </IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton onClick={handleShare} size="small" title="Поделиться">
              <IonIcon icon={shareOutline} slot="icon-only" />
            </IonButton>
            <IonButton onClick={handlePrint} size="small" title="Печать">
              <IonIcon icon={printOutline} slot="icon-only" />
            </IonButton>
            <IonButton onClick={onClose} size="small" title="Закрыть">
              <IonIcon icon={closeOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonLoading isOpen={load} message={'Подождите...'} />
      <IonContent className={styles.content}>
        <div className={styles.page}>
          <article className={styles.sheet}>
            <table className={styles.bankTable}>
              <tbody>
                <tr>
                  <td className={styles.bankCell} colSpan={2} rowSpan={2}>
                    <div className={styles.bankLabel}>Банк получателя</div>
                    <div className={styles.bankValue}>{dash(seller.bank)}</div>
                  </td>
                  <td className={styles.bankCellNarrow}>
                    <div className={styles.bankLabel}>БИК</div>
                  </td>
                  <td className={styles.bankCell}>
                    <div className={styles.bankValue}>{dash(seller.bik)}</div>
                  </td>
                </tr>
                <tr>
                  <td className={styles.bankCellNarrow}>
                    <div className={styles.bankLabel}>Сч. №</div>
                  </td>
                  <td className={styles.bankCell}>
                    <div className={styles.bankValue}>{dash(seller.korAccount)}</div>
                  </td>
                </tr>
                <tr>
                  <td className={styles.bankCell}>
                    <div className={styles.bankLabel}>ИНН</div>
                    <div className={styles.bankValue}>{dash(seller.inn)}</div>
                  </td>
                  <td className={styles.bankCell}>
                    <div className={styles.bankLabel}>КПП</div>
                    <div className={styles.bankValue}>{dash(seller.kpp)}</div>
                  </td>
                  <td className={styles.bankCellNarrow} rowSpan={2}>
                    <div className={styles.bankLabel}>Сч. №</div>
                  </td>
                  <td className={styles.bankCell} rowSpan={2}>
                    <div className={styles.bankValue}>{dash(seller.account)}</div>
                  </td>
                </tr>
                <tr>
                  <td className={styles.bankCell} colSpan={2}>
                    <div className={styles.bankLabel}>Получатель</div>
                    <div className={styles.bankValue}>{dash(seller.name)}</div>
                  </td>
                </tr>
              </tbody>
            </table>

            <h1 className={styles.title}>
              Счёт на оплату № {dash(inv.invoiceNumber)} от {dash(inv.invoiceDate)}
            </h1>

            <div className={styles.parties}>
              <div className={styles.partyRow}>
                <span className={styles.partyLabel}>Поставщик:</span>
                <span className={styles.partyValue}>
                  {dash(seller.name)}
                  {seller.inn ? `, ИНН ${seller.inn}` : ''}
                  {seller.kpp ? `, КПП ${seller.kpp}` : ''}
                  {seller.address ? `, ${seller.address}` : ''}
                </span>
              </div>
              <div className={styles.partyRow}>
                <span className={styles.partyLabel}>Покупатель:</span>
                <span className={styles.partyValue}>
                  {dash(customer.name)}
                  {customer.inn ? `, ИНН ${customer.inn}` : ''}
                  {customer.address ? `, ${customer.address}` : ''}
                </span>
              </div>
              {(inv.paymentPurpose || inv.paymentDue) && (
                <div className={styles.partyRow}>
                  <span className={styles.partyLabel}>Основание:</span>
                  <span className={styles.partyValue}>
                    {inv.paymentPurpose || `Оплата по счёту №${inv.invoiceNumber}`}
                    {inv.paymentDue ? `. Срок оплаты: ${inv.paymentDue}` : ''}
                  </span>
                </div>
              )}
            </div>

            <table className={styles.itemsTable}>
              <thead>
                <tr>
                  <th className={styles.colNum}>№</th>
                  <th className={styles.colName}>Товары (работы, услуги)</th>
                  <th className={styles.colQty}>Кол-во</th>
                  <th className={styles.colUnit}>Ед.</th>
                  <th className={styles.colPrice}>Цена</th>
                  <th className={styles.colSum}>Сумма</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className={styles.colNum}>{idx + 1}</td>
                    <td className={styles.colName}>{dash(item.item_name)}</td>
                    <td className={styles.colQty}>{item.qty || '—'}</td>
                    <td className={styles.colUnit}>{dash(item.unit)}</td>
                    <td className={styles.colPrice}>
                      {item.price ? formatters.currency(item.price) : '—'}
                    </td>
                    <td className={styles.colSum}>
                      {item.total ? formatters.currency(item.total) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>Итого:</span>
                <strong>{formatters.currency(inv.total || 0)}</strong>
              </div>
              <div className={styles.totalRow}>
                <span>В том числе НДС:</span>
                <strong>
                  {inv.vat > 0 ? formatters.currency(inv.vat) : 'Без НДС'}
                </strong>
              </div>
              <div className={styles.totalRow}>
                <span>Всего к оплате:</span>
                <strong>{formatters.currency(inv.total || 0)}</strong>
              </div>
            </div>

            <p className={styles.summary}>
              Всего наименований {itemsCount}, на сумму {formatters.currency(inv.total || 0)}
            </p>
            <p className={styles.words}>
              <strong>{totalWords}</strong>
            </p>

            <div className={styles.signs}>
              <div className={styles.signBlock}>
                <span className={styles.signRole}>Руководитель</span>
                <span className={styles.signLine} />
                <span className={styles.signName}>{dash(inv.signer)}</span>
              </div>
              <div className={styles.signBlock}>
                <span className={styles.signRole}>Бухгалтер</span>
                <span className={styles.signLine} />
                <span className={styles.signName} />
              </div>
            </div>
          </article>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default InvoiceModal;
