import React, { useState } from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import {
  warningOutline,
  personOutline,
  attachOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';
import styles from './Agreement.module.css';
import { SignField } from '../../../DataEditor/fields/SignField';
import { WorkInfo, OfferInfo, WorkStatus } from '../../types';
import { getWorkCustomerName } from '../../utils';
import { WizardHeader } from '../../../Header/WizardHeader';
import { companyGetters } from '../../../../Store/companyStore';
import { transportGetters } from '../../../../Store/transportStore';
import { passportGetters } from '../../../../Store/passportStore';

export interface ContractData {
  document_info?: {
    order_number?: string;
    city?: string;
    day?: string;
    month?: string;
    year?: string;
  };
  customer?: {
    name?: string;
    gender_suffix?: string;
    representative?: string;
    representative_gender_suffix?: string;
    basis?: string;
  };
  carrier?: {
    name?: string;
    gender_suffix?: string;
    representative?: string;
    representative_gender_suffix?: string;
    basis?: string;
  };
  payment?: {
    amount?: string;
  };
  contract_date?: string;
  specification?: {
    sender_details?: string;
    carrier_details?: string;
    recipient_details?: string;
    cargo_name?: string;
    cargo_quantity?: string;
  };
}

interface AgreementProps {
  work: WorkInfo;
  contractData?: ContractData | null;
  onBack: () => void;
  onSign: (signature: string, offer: OfferInfo) => Promise<boolean>;
}

export const Agreement: React.FC<AgreementProps> = ({
  work,
  contractData,
  onBack,
  onSign,
}) => {
  const [signature, setSignature] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  if (!work) return null;

  const company = companyGetters.getData();
  const transport = transportGetters.getData();
  const passport = passportGetters.getData();

  const buildContractData = (): ContractData => {
    if (contractData) return contractData;

    const now = new Date();
    const day = now.getDate().toString();
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const month = months[now.getMonth()];
    const year = now.getFullYear().toString();
    const contractDate = `${day} ${month} ${year}`;
    const cargoQuantity = `${(work.weight ?? 0).toFixed(3)} т, ${(work.volume ?? 0).toFixed(3)} м³`;
    const cityFrom = typeof work.address?.city === 'object' ? work.address?.city?.city : work.address?.city;

    return {
      document_info: {
        order_number: work.guid?.slice(0, 8) || work.cargo?.slice(0, 8) || '',
        city: cityFrom || '',
        day,
        month,
        year
      },
      customer: {
        name: getWorkCustomerName(work) || 'Заказчик',
        representative: work.face || 'Представитель заказчика',
        basis: 'Договор'
      },
      carrier: {
        name: company?.name || 'Перевозчик',
        representative: passport ? `${(passport as any)?.surname || ''} ${(passport as any)?.name || ''} ${(passport as any)?.patronymic || ''}`.trim() || 'Представитель перевозчика' : 'Представитель перевозчика',
        basis: company?.ogrn ? 'ОГРН' : 'Устав'
      },
      payment: {
        amount: (work.price ?? 0).toString()
      },
      contract_date: contractDate,
      specification: {
        cargo_name: work.name || work.description || 'Груз',
        cargo_quantity: cargoQuantity,
        sender_details: JSON.stringify({
          company_name: getWorkCustomerName(work) || '',
          representative: work.face || '',
          inn: '',
          ogrn: '',
          basis: 'Договор'
        }),
        carrier_details: JSON.stringify({
          company_name: company?.name || '',
          inn: company?.inn || '',
          ogrn: company?.ogrn || '',
          representative: passport ? `${(passport as any)?.surname || ''} ${(passport as any)?.name || ''} ${(passport as any)?.patronymic || ''}`.trim() : '',
          basis: company?.ogrn ? 'ОГРН' : 'Устав'
        }),
        recipient_details: JSON.stringify({
          company_name: 'Получатель',
          representative: 'Представитель',
          inn: '',
          ogrn: '',
          basis: 'Устав'
        })
      }
    };
  };

  const data = buildContractData();

  const formatPrice = (price: string | number): string => {
    if (!price) return '0 ₽';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return String(price) + ' ₽';
    return numPrice.toLocaleString('ru-RU').replace(/,/g, ' ') + ' ₽';
  };

  const parseSenderDetails = () => {
    try {
      const details = data.specification?.sender_details;
      if (details && typeof details === 'string' && details.trim()) return JSON.parse(details);
    } catch {}
    return { company_name: data.customer?.name || '', inn: '', ogrn: '', representative: data.customer?.representative || '', basis: data.customer?.basis || '' };
  };

  const parseCarrierDetails = () => {
    try {
      const details = data.specification?.carrier_details;
      if (details && typeof details === 'string' && details.trim()) return JSON.parse(details);
    } catch {}
    return { company_name: data.carrier?.name || '', inn: company?.inn || '', ogrn: company?.ogrn || '', representative: data.carrier?.representative || '', basis: data.carrier?.basis || '' };
  };

  const parseRecipientDetails = () => {
    try {
      const details = data.specification?.recipient_details;
      if (details && typeof details === 'string' && details.trim()) return JSON.parse(details);
    } catch {}
    return { company_name: 'Получатель', inn: '', ogrn: '', representative: 'Представитель', basis: 'Устава' };
  };

  const senderDetails = parseSenderDetails();
  const carrierDetails = parseCarrierDetails();
  const recipientDetails = parseRecipientDetails();

  const parseCargoQuantity = () => {
    const quantity = data.specification?.cargo_quantity || '';
    const parts = quantity.split(', ');
    const weightPart = parts[0] || `${(work.weight ?? 0).toFixed(3)} т`;
    const volumePart = parts[1] || `${(work.volume ?? 0).toFixed(3)} м³`;
    return { weight: weightPart, volume: volumePart };
  };

  const cargoQuantity = parseCargoQuantity();

  const calculatePayments = () => {
    const total = parseFloat(data.payment?.amount || (work.price ?? 0).toString());
    const prepaymentPercent = 30;
    const prepayment = total * (prepaymentPercent / 100);
    const remaining = total - prepayment;
    return { total, prepayment, prepaymentPercent, remaining };
  };

  const payments = calculatePayments();
  const formatContractDate = () => data.contract_date || '';

  const handleSign = async () => {
    if (!signature) {
      setError('Необходимо поставить подпись');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const offerData: OfferInfo = {
        guid: work.cargo,
        recipient: work.recipient,
        price: work.price ?? 0,
        weight: work.weight ?? 0,
        volume: work.volume ?? 0,
        transport: transport?.guid || '',
        comment: '',
        status: nextStatus(work.status)
      };
      const success = await onSign(signature, offerData);
      if (success) onBack();
      else setError('Ошибка при подписании договора');
    } catch (err) {
      console.error('Error signing contract:', err);
      setError('Ошибка при подписании договора');
    } finally {
      setLoading(false);
    }
  };

  function nextStatus(status: WorkStatus): number {
    switch (status) {
      case WorkStatus.NEW: return 11;
      case WorkStatus.TO_LOAD: return 13;
      case WorkStatus.LOADING: return 15;
      case WorkStatus.IN_WORK: return 17;
      case WorkStatus.UNLOADING: return 19;
      case WorkStatus.REJECTED: return 11;
      default: return 22;
    }
  }

  return (
    <div className={styles.agreementContainer}>
      <WizardHeader title="Оформление договора" onBack={onBack} />
      <div className="ml-2 cl-prim fs-09 a-center">{work.name}</div>

      <div className={styles.warningBox}>
        <IonIcon icon={warningOutline} className={styles.warningIcon} />
        <div className={styles.warningContent}>
          <div className={styles.warningTitle}>Внимание! Ознакомьтесь с полным договором</div>
          <div className={styles.warningText}>
            Перед подписанием обязательно скачайте и внимательно прочитайте полный текст договора.
            Подписывая договор, вы принимаете все условия и обязательства.
          </div>
        </div>
      </div>

      <div className={styles.contractInfo}>
        Договор № {data.document_info?.order_number || ''} от {formatContractDate()}
      </div>

      <div className={styles.partiesSection}>
        <div className={styles.partyBox}>
          <div className={`${styles.partyHeader} ${styles.performerHeader}`}>
            <IonIcon icon={personOutline} />
            <span>ИСПОЛНИТЕЛЬ (Перевозчик)</span>
          </div>
          <div className={styles.partyContent}>
            <div className={styles.partyField}><span className={styles.placeholder}>{carrierDetails.company_name || data.carrier?.name || ''}</span></div>
            <div className={styles.partyField}><span className={styles.placeholder}>в лице {carrierDetails.representative || data.carrier?.representative || ''}</span></div>
            <div className={styles.partyField}><span className={styles.placeholder}>ИНН: {carrierDetails.inn || '__________'}</span></div>
            <div className={styles.partyField}><span className={styles.placeholder}>ОГРН: {carrierDetails.ogrn || '__________'}</span></div>
            <div className={styles.partyField}><span className={styles.placeholder}>действующий на основании: {carrierDetails.basis || data.carrier?.basis || ''}</span></div>
          </div>
        </div>

        <div className={styles.partyBox}>
          <div className={`${styles.partyHeader} ${styles.customerHeader}`}>
            <IonIcon icon={personOutline} />
            <span>ЗАКАЗЧИК (Отправитель)</span>
          </div>
          <div className={styles.partyContent}>
            <div className={styles.partyField}><span className={styles.placeholder}>{senderDetails.company_name || data.customer?.name || ''}</span></div>
            <div className={styles.partyField}><span className={styles.placeholder}>в лице {senderDetails.representative || data.customer?.representative || ''}</span></div>
            <div className={styles.partyField}><span className={styles.placeholder}>ИНН: {senderDetails.inn || '__________'}</span></div>
            <div className={styles.partyField}><span className={styles.placeholder}>ОГРН: {senderDetails.ogrn || '__________'}</span></div>
            <div className={styles.partyField}><span className={styles.placeholder}>действующий на основании: {senderDetails.basis || data.customer?.basis || ''}</span></div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={`${styles.sectionHeader} ${styles.sectionGreen}`}>
          <IonIcon icon={attachOutline} />
          <span>1. ПРЕДМЕТ ДОГОВОРА</span>
        </div>
        <div className={styles.sectionGrid}>
          <div className={styles.infoBox}><div className={styles.infoLabel}>Наименование груза</div><div className={styles.infoValue}>{data.specification?.cargo_name || work.name || 'Не указано'}</div></div>
          <div className={styles.infoBox}><div className={styles.infoLabel}>Характеристики груза</div><div className={styles.infoValue}>Вес: {cargoQuantity.weight}<br />Объем: {cargoQuantity.volume}</div></div>
          <div className={styles.infoBox}><div className={styles.infoLabel}>Маршрут</div><div className={styles.infoValue}>{(typeof work.address?.city === 'object' ? work.address?.city?.city : work.address?.city) || ''} → {(typeof work.destiny?.city === 'object' ? work.destiny?.city?.city : work.destiny?.city) || ''}</div></div>
          <div className={styles.infoBox}><div className={styles.infoLabel}>Дата договора</div><div className={styles.infoValue}>{formatContractDate()}</div></div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={`${styles.sectionHeader} ${styles.sectionOrange}`}>
          <IonIcon icon={attachOutline} />
          <span>2. СТОИМОСТЬ И ПОРЯДОК ОПЛАТЫ</span>
        </div>
        <div className={styles.paymentSection}>
          <div className={styles.totalCostBox}><div className={styles.totalCostLabel}>Общая стоимость услуг</div><div className={styles.totalCostValue}>{formatPrice(data.payment?.amount || (work.price ?? 0))}</div></div>
          <div className={styles.paymentGrid}>
            <div className={styles.paymentBox}><div className={styles.paymentLabel}>Предоплата ({payments.prepaymentPercent}%)</div><div className={styles.paymentValue}>{formatPrice(payments.prepayment)}</div><div className={styles.paymentNote}>До начала перевозки</div></div>
            <div className={styles.paymentBox}><div className={styles.paymentLabel}>Остаток</div><div className={styles.paymentValue}>{formatPrice(payments.remaining)}</div><div className={styles.paymentNote}>После доставки груза</div></div>
          </div>
          <div className={styles.securePaymentBox}>
            <IonIcon icon={checkmarkCircleOutline} className={styles.checkIcon} />
            <div className={styles.securePaymentContent}>
              <div className={styles.securePaymentTitle}>Безопасная оплата через платформу</div>
              <div className={styles.securePaymentText}>Все платежи проходят через специальный счет приложения. Комиссия платформы 5% обеспечивает защиту обеих сторон и гарантию выполнения сделки.</div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.signatureSection}>
        <div className={styles.signatureBox}>
          <div className={`${styles.signatureHeader} ${styles.performerHeader}`}>Исполнитель</div>
          <div className={styles.signaturePlace}>
            <IonIcon icon={attachOutline} />
            <div className={styles.signatureLabel}>Место для подписи</div>
            <div className={styles.signatureName}>{carrierDetails.representative || data.carrier?.representative || ''}</div>
          </div>
        </div>

        <div className={styles.signatureBox}>
          <div className={`${styles.signatureHeader} ${styles.customerHeader}`}>Перевозчик</div>
          <div className={styles.signaturePlace}>
            <SignField
              label="Подпись перевозчика"
              value={signature}
              onChange={(value) => {
                if (Array.isArray(value) && value.length > 0 && value[0]?.dataUrl) setSignature(value[0].dataUrl);
                else if (value === '' || value === null || value === undefined) setSignature('');
              }}
              placeholder="Подпись и печать"
            />
            <div className={styles.signatureName}>{carrierDetails.representative || data.carrier?.representative || ''}</div>
          </div>
        </div>
      </div>

      {error && <div className="error-msg" style={{ margin: '1em 0.5em', color: 'red' }}>{error}</div>}

      <div className={styles.buttonsSection}>
        <IonButton className={styles.cancelButton} onClick={onBack} expand="block" disabled={loading}>
          Отменить
        </IonButton>
        <IonButton className={styles.signButton} onClick={handleSign} expand="block" disabled={loading || !signature}>
          Подписать и отправить предложение
        </IonButton>
      </div>
    </div>
  );
};

