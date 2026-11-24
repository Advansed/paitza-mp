import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IonButton, IonIcon } from '@ionic/react';
import {
  menuOutline,
  refreshOutline,
  warningOutline,
  personOutline,
  attachOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';
import styles from './Agreement.module.css';
import { SignField } from '../DataEditor/fields/SignField';
import { moneySign } from '../../utils/utils';
import { intlLocale } from '../../i18n';

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
    currency?: string;
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
}

export const Agreement: React.FC<AgreementProps> = ({
  data,
  onMenu,
  onRefresh,
  onCancel,
  onSign,
}) => {
  const { t } = useTranslation('works');
  const [customerSignature, setCustomerSignature] = useState<string>('');

  if (!data) {
    return (
      <div className={styles.agreementContainer}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          {t('contractLoading')}
        </div>
      </div>
    );
  }

  const contractData = data;

  const payCurrency = contractData.payment?.currency || 'RUB';
  const formatPrice = (price: string): string => {
    const sign = moneySign(payCurrency);
    if (!price) return `0 ${sign}`;
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return `${price} ${sign}`;
    return `${numPrice.toLocaleString(intlLocale()).replace(/,/g, ' ')} ${sign}`;
  };

  const parseSenderDetails = () => {
    try {
      const details = contractData.specification?.sender_details;
      if (details && typeof details === 'string' && details.trim()) {
        return JSON.parse(details);
      }
    } catch {
      /* ignore */
    }
    return {
      company_name: contractData.customer?.name || '',
      inn: '',
      ogrn: '',
      representative: contractData.customer?.representative || '',
      basis: contractData.customer?.basis || '',
    };
  };

  const parseCarrierDetails = () => {
    try {
      const details = contractData.specification?.carrier_details;
      if (details && typeof details === 'string' && details.trim()) {
        return JSON.parse(details);
      }
    } catch {
      /* ignore */
    }
    return {
      company_name: contractData.carrier?.name || '',
      inn: '',
      ogrn: '',
      representative: contractData.carrier?.representative || '',
      basis: contractData.carrier?.basis || '',
    };
  };

  const parseRecipientDetails = () => {
    try {
      const details = contractData.specification?.recipient_details;
      if (details && typeof details === 'string' && details.trim()) {
        return JSON.parse(details);
      }
    } catch {
      /* ignore */
    }
    return {
      company_name: t('contractFallbackRecipient'),
      inn: '',
      ogrn: '',
      representative: t('contractFallbackRep'),
      basis: t('contractFallbackCharter'),
    };
  };

  const senderDetails = parseSenderDetails();
  const carrierDetails = parseCarrierDetails();
  const recipientDetails = parseRecipientDetails();

  const parseCargoQuantity = () => {
    const quantity = contractData.specification?.cargo_quantity || '';
    const parts = quantity.split(', ');
    return {
      weight: parts[0] || '0 кг',
      volume: parts[1] || '0 м³',
    };
  };

  const cargoQuantity = parseCargoQuantity();

  const calculatePayments = () => {
    const total = parseFloat(contractData.payment?.amount || '0');
    const prepaymentPercent = 30;
    const prepayment = total * (prepaymentPercent / 100);
    const remaining = total - prepayment;
    return { total, prepayment, prepaymentPercent, remaining };
  };

  const payments = calculatePayments();

  const formatContractDate = () => {
    const raw = contractData.contract_date || '';
    if (!raw) return '';
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString(intlLocale(), {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    return raw;
  };

  const handleSign = () => {
    if (onSign) onSign(customerSignature);
  };

  const orderNumber = contractData.document_info?.order_number || '';
  const contractDateLabel = formatContractDate();

  return (
    <div className={styles.agreementContainer}>
      <div className={styles.header}>
        <button className={styles.menuButton} onClick={onMenu}>
          <IonIcon icon={menuOutline} />
        </button>

        <div className={styles.headerContent}>
          <h2 className={styles.headerTitle}>{t('contractTitle')}</h2>
          <div className={styles.headerInfo}>
            <span>{t('contractOrderNo', { number: orderNumber.slice(0, 8) || orderNumber })}</span>
            <span>{t('contractAgreedPrice', { price: formatPrice(contractData.payment?.amount || '0') })}</span>
          </div>
        </div>

        <button className={styles.refreshButton} onClick={onRefresh}>
          <IonIcon icon={refreshOutline} />
        </button>
      </div>

      <div className={styles.warningBox}>
        <IonIcon icon={warningOutline} className={styles.warningIcon} />
        <div className={styles.warningContent}>
          <div className={styles.warningTitle}>{t('contractWarningTitle')}</div>
          <div className={styles.warningText}>{t('contractWarningText')}</div>
        </div>
      </div>

      <div className={styles.contractInfo}>
        {t('contractNumberFrom', { number: orderNumber, date: contractDateLabel })}
      </div>

      <div className={styles.partiesSection}>
        <div className={styles.partyBox}>
          <div className={`${styles.partyHeader} ${styles.performerHeader}`}>
            <IonIcon icon={personOutline} />
            <span>{t('contractPartyPerformer')}</span>
          </div>
          <div className={styles.partyContent}>
            <div className={styles.partyField}>
              <span className={styles.placeholder}>
                {carrierDetails.company_name || contractData.carrier?.name || ''}
              </span>
            </div>
            <div className={styles.partyField}>
              <span className={styles.placeholder}>
                {t('contractInPerson', {
                  name: carrierDetails.representative || contractData.carrier?.representative || '',
                })}
              </span>
            </div>
            <div className={styles.partyField}>
              <span className={styles.placeholder}>
                {t('contractInn', { value: carrierDetails.inn || '__________' })}
              </span>
            </div>
            <div className={styles.partyField}>
              <span className={styles.placeholder}>
                {t('contractOgrn', { value: carrierDetails.ogrn || '__________' })}
              </span>
            </div>
            <div className={styles.partyField}>
              <span className={styles.placeholder}>
                {t('contractOnBasis', {
                  value: carrierDetails.basis || contractData.carrier?.basis || '',
                })}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.partyBox}>
          <div className={`${styles.partyHeader} ${styles.customerHeader}`}>
            <IonIcon icon={personOutline} />
            <span>{t('contractPartyCustomer')}</span>
          </div>
          <div className={styles.partyContent}>
            <div className={styles.partyField}>
              <span className={styles.placeholder}>
                {senderDetails.company_name || contractData.customer?.name || ''}
              </span>
            </div>
            <div className={styles.partyField}>
              <span className={styles.placeholder}>
                {t('contractInPerson', {
                  name: senderDetails.representative || contractData.customer?.representative || '',
                })}
              </span>
            </div>
            <div className={styles.partyField}>
              <span className={styles.placeholder}>
                {t('contractInn', { value: senderDetails.inn || '__________' })}
              </span>
            </div>
            <div className={styles.partyField}>
              <span className={styles.placeholder}>
                {t('contractOgrn', { value: senderDetails.ogrn || '__________' })}
              </span>
            </div>
            <div className={styles.partyField}>
              <span className={styles.placeholder}>
                {t('contractOnBasis', {
                  value: senderDetails.basis || contractData.customer?.basis || '',
                })}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.partyBox}>
          <div className={`${styles.partyHeader} ${styles.customerHeader}`}>
            <IonIcon icon={personOutline} />
            <span>{t('contractPartyRecipient')}</span>
          </div>
          <div className={styles.partyContent}>
            <div className={styles.partyField}>
              <span className={styles.placeholder}>{recipientDetails.company_name}</span>
            </div>
            <div className={styles.partyField}>
              <span className={styles.placeholder}>
                {t('contractInPerson', { name: recipientDetails.representative })}
              </span>
            </div>
            <div className={styles.partyField}>
              <span className={styles.placeholder}>
                {t('contractInn', { value: recipientDetails.inn || '__________' })}
              </span>
            </div>
            <div className={styles.partyField}>
              <span className={styles.placeholder}>
                {t('contractOgrn', { value: recipientDetails.ogrn || '__________' })}
              </span>
            </div>
            <div className={styles.partyField}>
              <span className={styles.placeholder}>
                {t('contractOnBasis', { value: recipientDetails.basis })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={`${styles.sectionHeader} ${styles.sectionGreen}`}>
          <IonIcon icon={attachOutline} />
          <span>{t('contractSectionSubject')}</span>
        </div>
        <div className={styles.sectionGrid}>
          <div className={styles.infoBox}>
            <div className={styles.infoLabel}>{t('contractCargoName')}</div>
            <div className={styles.infoValue}>
              {contractData.specification?.cargo_name || t('contractNotSpecified')}
            </div>
          </div>
          <div className={styles.infoBox}>
            <div className={styles.infoLabel}>{t('contractCargoSpecs')}</div>
            <div className={styles.infoValue}>
              {t('contractWeight', { value: cargoQuantity.weight })}
              <br />
              {t('contractVolume', { value: cargoQuantity.volume })}
            </div>
          </div>
          <div className={styles.infoBox}>
            <div className={styles.infoLabel}>{t('contractRoute')}</div>
            <div className={styles.infoValue}>
              {contractData.document_info?.city
                ? t('contractRouteTbd', { city: contractData.document_info.city })
                : t('contractRouteNotSpecified')}
            </div>
          </div>
          <div className={styles.infoBox}>
            <div className={styles.infoLabel}>{t('contractDateLabel')}</div>
            <div className={styles.infoValue}>{contractDateLabel}</div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={`${styles.sectionHeader} ${styles.sectionOrange}`}>
          <IonIcon icon={attachOutline} />
          <span>{t('contractSectionPayment')}</span>
        </div>
        <div className={styles.paymentSection}>
          <div className={styles.totalCostBox}>
            <div className={styles.totalCostLabel}>{t('contractTotalCost')}</div>
            <div className={styles.totalCostValue}>
              {formatPrice(contractData.payment?.amount || '0')}
            </div>
          </div>
          <div className={styles.paymentGrid}>
            <div className={styles.paymentBox}>
              <div className={styles.paymentLabel}>
                {t('contractPrepayment', { percent: payments.prepaymentPercent })}
              </div>
              <div className={styles.paymentValue}>
                {formatPrice(payments.prepayment.toString())}
              </div>
              <div className={styles.paymentNote}>{t('contractPrepaymentNote')}</div>
            </div>
            <div className={styles.paymentBox}>
              <div className={styles.paymentLabel}>{t('contractRemaining')}</div>
              <div className={styles.paymentValue}>
                {formatPrice(payments.remaining.toString())}
              </div>
              <div className={styles.paymentNote}>{t('contractRemainingNote')}</div>
            </div>
          </div>
          <div className={styles.securePaymentBox}>
            <IonIcon icon={checkmarkCircleOutline} className={styles.checkIcon} />
            <div className={styles.securePaymentContent}>
              <div className={styles.securePaymentTitle}>{t('contractSecureTitle')}</div>
              <div className={styles.securePaymentText}>{t('contractSecureText')}</div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={`${styles.sectionHeader} ${styles.sectionBlue}`}>
          <IonIcon icon={attachOutline} />
          <span>{t('contractSectionObligations')}</span>
        </div>
        <div className={styles.obligationsContent}>
          <div className={styles.obligationsSection}>
            <div className={styles.obligationsTitle}>{t('contractPerformerMust')}</div>
            <ul className={styles.obligationsList}>
              <li>{t('contractPerformerDuty1')}</li>
              <li>{t('contractPerformerDuty2')}</li>
              <li>{t('contractPerformerDuty3')}</li>
            </ul>
          </div>
          <div className={styles.obligationsSection}>
            <div className={styles.obligationsTitle}>{t('contractCustomerMust')}</div>
            <ul className={styles.obligationsList}>
              <li>{t('contractCustomerDuty1')}</li>
              <li>{t('contractCustomerDuty2')}</li>
              <li>{t('contractCustomerDuty3')}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className={styles.signatureSection}>
        <div className={styles.signatureBox}>
          <div className={`${styles.signatureHeader} ${styles.performerHeader}`}>
            {t('contractSignerPerformer')}
          </div>
          <div className={styles.signaturePlace}>
            <IonIcon icon={attachOutline} />
            <div className={styles.signatureLabel}>{t('contractSignPlace')}</div>
            <div className={styles.signatureName}>
              {carrierDetails.representative || contractData.carrier?.representative || ''}
            </div>
          </div>
        </div>

        <div className={styles.signatureBox}>
          <div className={`${styles.signatureHeader} ${styles.customerHeader}`}>
            {t('contractSignerCustomer')}
          </div>
          <div className={styles.signaturePlace}>
            <SignField
              label={t('contractSignCustomer')}
              value={customerSignature}
              onChange={(value) => {
                if (Array.isArray(value) && value.length > 0 && value[0]?.dataUrl) {
                  setCustomerSignature(value[0].dataUrl);
                } else if (value === '' || value === null || value === undefined) {
                  setCustomerSignature('');
                }
              }}
              placeholder={t('contractSignPlaceholder')}
            />
            <div className={styles.signatureName}>
              {senderDetails.representative || contractData.customer?.representative || ''}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.buttonsSection}>
        <IonButton className={styles.cancelButton} onClick={onCancel} expand="block">
          {t('contractCancel')}
        </IonButton>
        <IonButton className={styles.signButton} onClick={handleSign} expand="block">
          {t('contractSign')}
        </IonButton>
      </div>
    </div>
  );
};
