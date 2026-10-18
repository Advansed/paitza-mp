import React, { useState } from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { 
  menuOutline, 
  refreshOutline, 
  warningOutline, 
  personOutline, 
  attachOutline,
  checkmarkCircleOutline,
  downloadOutline
} from 'ionicons/icons';
import styles from './Agreement.module.css';
import { SignField } from '../DataEditor/fields/SignField';
import { i } from 'vite/dist/node/types.d-aGj9QkWt';

// Интерфейс для данных из get_contract
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
  data: ContractData | null | undefined;
  onMenu?: () => void;
  onRefresh?: () => void;
  onCancel?: () => void;
  onSign?: (signature: string) => void;
 // onDownload?: () => void;
}

export const Agreement: React.FC<AgreementProps> = ({
  data,
  onMenu,
  onRefresh,
  onCancel,
  onSign,
  //onDownload,
}) => {
  const [customerSignature, setCustomerSignature] = useState<string>('');

  if (!data) {
    return (
      <div className={styles.agreementContainer}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          Загрузка данных договора...
        </div>
      </div>
    );
  }

  const contractData = data;
  
  const formatPrice = (price: string): string => {
    if (!price) return '0 ₽';
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return price + ' ₽';
    return numPrice.toLocaleString('ru-RU').replace(/,/g, ' ') + ' ₽';
  };

  // Парсим детали отправителя (sender_details)
  const parseSenderDetails = () => {
    try {
      const details = contractData.specification?.sender_details;
      if (details && typeof details === 'string' && details.trim()) {
        return JSON.parse(details);
      }
    } catch {
      // Игнорируем ошибки парсинга
    }
    return {
      company_name: contractData.customer?.name || '',
      inn: '',
      ogrn: '',
      representative: contractData.customer?.representative || '',
      basis: contractData.customer?.basis || ''
    };
  };

  // Парсим детали перевозчика (carrier_details)
  const parseCarrierDetails = () => {
    try {
      const details = contractData.specification?.carrier_details;
      if (details && typeof details === 'string' && details.trim()) {
        return JSON.parse(details);
      }
    } catch {
      // Игнорируем ошибки парсинга
    }
    return {
      company_name: contractData.carrier?.name || '',
      inn: '',
      ogrn: '',
      representative: contractData.carrier?.representative || '',
      basis: contractData.carrier?.basis || ''
    };
  };

  // Парсим детали получателя
  const parseRecipientDetails = () => {
    try {
      const details = contractData.specification?.recipient_details;
      if (details && typeof details === 'string' && details.trim()) {
        return JSON.parse(details);
      }
    } catch {
      // Игнорируем ошибки парсинга
    }
    return {
      company_name: 'Получатель',
      inn: '',
      ogrn: '',
      representative: 'Представитель',
      basis: 'Устава'
    };
  };

  const senderDetails = parseSenderDetails();
  const carrierDetails = parseCarrierDetails();
  const recipientDetails = parseRecipientDetails();

  // Парсим количество груза
  const parseCargoQuantity = () => {
    const quantity = contractData.specification?.cargo_quantity || '';
    // Пример: "40.000 кг, 0.000 м?"
    const parts = quantity.split(', ');
    const weightPart = parts[0] || '0 кг';
    const volumePart = parts[1] || '0 м³';
    
    return {
      weight: weightPart,
      volume: volumePart
    };
  };

  const cargoQuantity = parseCargoQuantity();

  // Расчет платежей (примерно 30% предоплата)
  const calculatePayments = () => {
    const total = parseFloat(contractData.payment?.amount || '0');
    const prepaymentPercent = 30;
    const prepayment = total * (prepaymentPercent / 100);
    const remaining = total - prepayment;
    
    return {
      total,
      prepayment,
      prepaymentPercent,
      remaining
    };
  };

  const payments = calculatePayments();

  // Форматирование даты договора
  const formatContractDate = () => {
    return contractData.contract_date || ''; // Уже в формате "17 февраля 2026"
  };

  const handleSign = () => {
        if( onSign ) onSign( customerSignature )
  }

  return (
    <div className={styles.agreementContainer}>
      {/* Header */}
      <div className={styles.header}>
        <button 
          className={styles.menuButton}
          onClick={onMenu}
        >
          <IonIcon icon={menuOutline} />
        </button>
        
        <div className={styles.headerContent}>
          <h2 className={styles.headerTitle}>Оформление договора</h2>
          <div className={styles.headerInfo}>
            <span>Заказ №: {contractData.document_info?.order_number?.slice(0, 8) || contractData.document_info?.order_number || ''}</span>
            <span>Согласованная цена: {formatPrice(contractData.payment?.amount || '0')}</span>
          </div>
        </div>

        <button 
          className={styles.refreshButton}
          onClick={onRefresh}
        >
          <IonIcon icon={refreshOutline} />
        </button>
      </div>

      {/* Warning Section */}
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

      {/* Contract ID and Date */}
      <div className={styles.contractInfo}>
        Договор № {contractData.document_info?.order_number || ''} от {formatContractDate()}
      </div>

      {/* Parties Section */}
      <div className={styles.partiesSection}>
        {/* Исполнитель (Перевозчик) */}
        <div className={styles.partyBox}>
          <div className={`${styles.partyHeader} ${styles.performerHeader}`}>
            <IonIcon icon={personOutline} />
            <span>ИСПОЛНИТЕЛЬ (Перевозчик)</span>
          </div>
          <div className={styles.partyContent}>
            <div className={styles.partyField}>
              <span className={styles.placeholder}>
                {carrierDetails.company_name || contractData.carrier?.name || ''}
              </span>
            </div>
            <div className={styles.partyField}>
              <span className={styles.placeholder}>
                в лице {carrierDetails.representative || contractData.carrier?.representative || ''}
              </span>
            </div>
            <div className={styles.partyField}>
              <span className={styles.placeholder}>
                ИНН: {carrierDetails.inn || '__________'}
              </span>
            </div>
            <div className={styles.partyField}>
              <span className={styles.placeholder}>
                ОГРН: {carrierDetails.ogrn || '__________'}
              </span>
            </div>
            <div className={styles.partyField}>
              <span className={styles.placeholder}>
                действующий на основании: {carrierDetails.basis || contractData.carrier?.basis || ''}
              </span>
            </div>
          </div>
        </div>

        {/* Заказчик (Отправитель) */}
        <div className={styles.partyBox}>
          <div className={`${styles.partyHeader} ${styles.customerHeader}`}>
            <IonIcon icon={personOutline} />
            <span>ЗАКАЗЧИК (Отправитель)</span>
          </div>
          <div className={styles.partyContent}>
            <div className={styles.partyField}>
              <span className={styles.placeholder}>
                {senderDetails.company_name || contractData.customer?.name || ''}
              </span>
            </div>
            <div className={styles.partyField}>
              <span className={styles.placeholder}>
                в лице {senderDetails.representative || contractData.customer?.representative || ''}
              </span>
            </div>
            <div className={styles.partyField}>
              <span className={styles.placeholder}>
                ИНН: {senderDetails.inn || '__________'}
              </span>
            </div>
            <div className={styles.partyField}>
              <span className={styles.placeholder}>
                ОГРН: {senderDetails.ogrn || '__________'}
              </span>
            </div>
            <div className={styles.partyField}>
              <span className={styles.placeholder}>
                действующий на основании: {senderDetails.basis || contractData.customer?.basis || ''}
              </span>
            </div>
          </div>
        </div>

        {/* Получатель (если нужен третий блок) */}
        <div className={styles.partyBox}>
          <div className={`${styles.partyHeader} ${styles.customerHeader}`}>
            <IonIcon icon={personOutline} />
            <span>ГРУЗОПОЛУЧАТЕЛЬ</span>
          </div>
          <div className={styles.partyContent}>
            <div className={styles.partyField}>
              <span className={styles.placeholder}>
                {recipientDetails.company_name}
              </span>
            </div>
            <div className={styles.partyField}>
              <span className={styles.placeholder}>
                в лице {recipientDetails.representative}
              </span>
            </div>
            <div className={styles.partyField}>
              <span className={styles.placeholder}>
                ИНН: {recipientDetails.inn || '__________'}
              </span>
            </div>
            <div className={styles.partyField}>
              <span className={styles.placeholder}>
                ОГРН: {recipientDetails.ogrn || '__________'}
              </span>
            </div>
            <div className={styles.partyField}>
              <span className={styles.placeholder}>
                действующий на основании: {recipientDetails.basis}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Subject of Agreement */}
      <div className={styles.section}>
        <div className={`${styles.sectionHeader} ${styles.sectionGreen}`}>
          <IonIcon icon={attachOutline} />
          <span>1. ПРЕДМЕТ ДОГОВОРА</span>
        </div>
        <div className={styles.sectionGrid}>
          <div className={styles.infoBox}>
            <div className={styles.infoLabel}>Наименование груза</div>
            <div className={styles.infoValue}>
              {contractData.specification?.cargo_name || 'Не указано'}
            </div>
          </div>
          <div className={styles.infoBox}>
            <div className={styles.infoLabel}>Характеристики груза</div>
            <div className={styles.infoValue}>
              Вес: {cargoQuantity.weight}<br />
              Объем: {cargoQuantity.volume}
            </div>
          </div>
          <div className={styles.infoBox}>
            <div className={styles.infoLabel}>Маршрут</div>
            <div className={styles.infoValue}>
              {contractData.document_info?.city || 'Не указан'} (уточняется)
            </div>
          </div>
          <div className={styles.infoBox}>
            <div className={styles.infoLabel}>Дата договора</div>
            <div className={styles.infoValue}>
              {formatContractDate()}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Cost and Payment Procedure */}
      <div className={styles.section}>
        <div className={`${styles.sectionHeader} ${styles.sectionOrange}`}>
          <IonIcon icon={attachOutline} />
          <span>2. СТОИМОСТЬ И ПОРЯДОК ОПЛАТЫ</span>
        </div>
        <div className={styles.paymentSection}>
          <div className={styles.totalCostBox}>
            <div className={styles.totalCostLabel}>Общая стоимость услуг</div>
            <div className={styles.totalCostValue}>
              {formatPrice(contractData.payment?.amount || '0')}
            </div>
          </div>
          <div className={styles.paymentGrid}>
            <div className={styles.paymentBox}>
              <div className={styles.paymentLabel}>
                Предоплата ({payments.prepaymentPercent}%)
              </div>
              <div className={styles.paymentValue}>
                {formatPrice(payments.prepayment.toString())}
              </div>
              <div className={styles.paymentNote}>До начала перевозки</div>
            </div>
            <div className={styles.paymentBox}>
              <div className={styles.paymentLabel}>Остаток</div>
              <div className={styles.paymentValue}>
                {formatPrice(payments.remaining.toString())}
              </div>
              <div className={styles.paymentNote}>После доставки груза</div>
            </div>
          </div>
          <div className={styles.securePaymentBox}>
            <IonIcon icon={checkmarkCircleOutline} className={styles.checkIcon} />
            <div className={styles.securePaymentContent}>
              <div className={styles.securePaymentTitle}>
                Безопасная оплата через платформу
              </div>
              <div className={styles.securePaymentText}>
                Все платежи проходят через специальный счет приложения. 
                Комиссия платформы 5% обеспечивает защиту обеих сторон и гарантию выполнения сделки.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Rights and Obligations */}
      <div className={styles.section}>
        <div className={`${styles.sectionHeader} ${styles.sectionBlue}`}>
          <IonIcon icon={attachOutline} />
          <span>3. ПРАВА И ОБЯЗАННОСТИ СТОРОН</span>
        </div>
        <div className={styles.obligationsContent}>
          <div className={styles.obligationsSection}>
            <div className={styles.obligationsTitle}>Исполнитель обязан:</div>
            <ul className={styles.obligationsList}>
              <li>Обеспечить сохранность груза</li>
              <li>Предоставить необходимые документы</li>
              <li>Соблюдать сроки доставки</li>
            </ul>
          </div>
          <div className={styles.obligationsSection}>
            <div className={styles.obligationsTitle}>Заказчик обязан:</div>
            <ul className={styles.obligationsList}>
              <li>Обеспечить доступ для погрузки/разгрузки</li>
              <li>Предоставить необходимые документы</li>
              <li>Оплатить услуги в установленные сроки</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div className={styles.signatureSection}>
        <div className={styles.signatureBox}>
          <div className={`${styles.signatureHeader} ${styles.performerHeader}`}>
            Исполнитель
          </div>
          <div className={styles.signaturePlace}>
            <IonIcon icon={attachOutline} />
            <div className={styles.signatureLabel}>Место для подписи</div>
            <div className={styles.signatureName}>
              {carrierDetails.representative || contractData.carrier?.representative || ''}
            </div>
          </div>
        </div>

        <div className={styles.signatureBox}>
          <div className={`${styles.signatureHeader} ${styles.customerHeader}`}>
            Заказчик
          </div>
          <div className={styles.signaturePlace}>
            <SignField
              label="Подпись заказчика"
              value={customerSignature}
              onChange={(value) => {
                // SignField возвращает массив [{dataUrl: string, format: "png"}] или пустую строку
                if (Array.isArray(value) && value.length > 0 && value[0]?.dataUrl) {
                  const signatureDataUrl = value[0].dataUrl;
                  setCustomerSignature(signatureDataUrl);
                } else if (value === '' || value === null || value === undefined) {
                  setCustomerSignature('');
                }
              }}
              placeholder="Подпись и печать"
            />
            <div className={styles.signatureName}>
              {senderDetails.representative || contractData.customer?.representative || ''}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className={styles.buttonsSection}>
        <IonButton 
          className={styles.cancelButton}
          onClick={onCancel}
          expand="block"
        >
          Отменить
        </IonButton>
        {/* <IonButton 
          className={styles.downloadButton}
          onClick={onDownload}
          expand="block"
          fill="outline"
        >
          <IonIcon icon={downloadOutline} slot="start" />
          скачать образец полного договора
        </IonButton> */}
        <IonButton 
          className = { styles.signButton }
          onClick   = { handleSign }
          expand    = "block"
        >
          Подписать
        </IonButton>
      </div>
    </div>
  );
};

// Пример использования с вашими данными:
// import { Agreement } from './Agreement';
// 
// <Agreement
//   data={responseFromGetContract}
//   onMenu={() => console.log('Menu clicked')}
//   onRefresh={() => console.log('Refresh clicked')}
//   onCancel={() => console.log('Cancel clicked')}
//   onDownload={() => console.log('Download clicked')}
//   onSign={() => console.log('Sign clicked')}
// />