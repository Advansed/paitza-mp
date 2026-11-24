import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { moneySign } from '../../../../utils/utils';
import { intlLocale } from '../../../../i18n';

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
  const { t } = useTranslation('works');
  const [signature, setSignature] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  if (!work) return null;

  const company = companyGetters.getData();
  const transport = transportGetters.getData();
  const passport = passportGetters.getData();

  const formatContractDate = (raw?: string) => {
    if (raw) {
      const parsed = new Date(raw);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString(intlLocale(), {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
      return raw;
    }
    return new Date().toLocaleDateString(intlLocale(), {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const buildContractData = (): ContractData => {
    if (contractData) return contractData;

    const now = new Date();
    const contractDate = formatContractDate();
    const cargoQuantity = t('contractCargoQty', {
      weight: (work.weight ?? 0).toFixed(3),
      volume: (work.volume ?? 0).toFixed(3),
    });
    const cityFrom = typeof work.address?.city === 'object' ? work.address?.city?.city : work.address?.city;
    const carrierRep = passport
      ? `${(passport as any)?.surname || ''} ${(passport as any)?.name || ''} ${(passport as any)?.patronymic || ''}`.trim() ||
        t('contractFallbackCarrierRep')
      : t('contractFallbackCarrierRep');

    return {
      document_info: {
        order_number: work.guid?.slice(0, 8) || work.cargo?.slice(0, 8) || '',
        city: cityFrom || '',
        day: now.getDate().toString(),
        month: now.toLocaleDateString(intlLocale(), { month: 'long' }),
        year: now.getFullYear().toString(),
      },
      customer: {
        name: getWorkCustomerName(work) || t('contractFallbackCustomer'),
        representative: work.face || t('contractFallbackCustomerRep'),
        basis: t('contractFallbackBasis'),
      },
      carrier: {
        name: company?.name || t('contractFallbackCarrier'),
        representative: carrierRep,
        basis: company?.ogrn ? t('contractFallbackOgrn') : t('contractFallbackCharter'),
      },
      payment: {
        amount: (work.price ?? 0).toString(),
      },
      contract_date: contractDate,
      specification: {
        cargo_name: work.name || work.description || t('contractFallbackCargo'),
        cargo_quantity: cargoQuantity,
        sender_details: JSON.stringify({
          company_name: getWorkCustomerName(work) || '',
          representative: work.face || '',
          inn: '',
          ogrn: '',
          basis: t('contractFallbackBasis'),
        }),
        carrier_details: JSON.stringify({
          company_name: company?.name || '',
          inn: company?.inn || '',
          ogrn: company?.ogrn || '',
          representative: passport
            ? `${(passport as any)?.surname || ''} ${(passport as any)?.name || ''} ${(passport as any)?.patronymic || ''}`.trim()
            : '',
          basis: company?.ogrn ? t('contractFallbackOgrn') : t('contractFallbackCharter'),
        }),
        recipient_details: JSON.stringify({
          company_name: t('contractFallbackRecipient'),
          representative: t('contractFallbackRep'),
          inn: '',
          ogrn: '',
          basis: t('contractFallbackCharter'),
        }),
      },
    };
  };

  const data = buildContractData();

  const payCurrency =
    data.payment?.currency || work.cargo_currency || work.currency || 'RUB';
  const formatPrice = (price: string | number): string => {
    const sign = moneySign(payCurrency);
    if (!price) return `0 ${sign}`;
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return `${String(price)} ${sign}`;
    return `${numPrice.toLocaleString(intlLocale()).replace(/,/g, ' ')} ${sign}`;
  };

  const parseSenderDetails = () => {
    try {
      const details = data.specification?.sender_details;
      if (details && typeof details === 'string' && details.trim()) return JSON.parse(details);
    } catch {}
    return {
      company_name: data.customer?.name || '',
      inn: '',
      ogrn: '',
      representative: data.customer?.representative || '',
      basis: data.customer?.basis || '',
    };
  };

  const parseCarrierDetails = () => {
    try {
      const details = data.specification?.carrier_details;
      if (details && typeof details === 'string' && details.trim()) return JSON.parse(details);
    } catch {}
    return {
      company_name: data.carrier?.name || '',
      inn: company?.inn || '',
      ogrn: company?.ogrn || '',
      representative: data.carrier?.representative || '',
      basis: data.carrier?.basis || '',
    };
  };

  const parseRecipientDetails = () => {
    try {
      const details = data.specification?.recipient_details;
      if (details && typeof details === 'string' && details.trim()) return JSON.parse(details);
    } catch {}
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
  parseRecipientDetails();

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
  const contractDateLabel = formatContractDate(data.contract_date);

  const handleSign = async () => {
    if (!signature) {
      setError(t('contractSignRequired'));
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
      else setError(t('contractSignError'));
    } catch (err) {
      console.error('Error signing contract:', err);
      setError(t('contractSignError'));
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
      <WizardHeader title={t('contractTitle')} onBack={onBack} />
      <div className="ml-2 cl-prim fs-09 a-center">{work.name}</div>

      <div className={styles.warningBox}>
        <IonIcon icon={warningOutline} className={styles.warningIcon} />
        <div className={styles.warningContent}>
          <div className={styles.warningTitle}>{t('contractWarningTitle')}</div>
          <div className={styles.warningText}>{t('contractWarningText')}</div>
        </div>
      </div>

      <div className={styles.contractInfo}>
        {t('contractNumberFrom', {
          number: data.document_info?.order_number || '',
          date: contractDateLabel,
        })}
      </div>

      <div className={styles.partiesSection}>
        <div className={styles.partyBox}>
          <div className={`${styles.partyHeader} ${styles.performerHeader}`}>
            <IonIcon icon={personOutline} />
            <span>{t('contractPartyPerformer')}</span>
          </div>
          <div className={styles.partyContent}>
            <div className={styles.partyField}><span className={styles.placeholder}>{carrierDetails.company_name || data.carrier?.name || ''}</span></div>
            <div className={styles.partyField}><span className={styles.placeholder}>{t('contractInPerson', { name: carrierDetails.representative || data.carrier?.representative || '' })}</span></div>
            <div className={styles.partyField}><span className={styles.placeholder}>{t('contractInn', { value: carrierDetails.inn || '__________' })}</span></div>
            <div className={styles.partyField}><span className={styles.placeholder}>{t('contractOgrn', { value: carrierDetails.ogrn || '__________' })}</span></div>
            <div className={styles.partyField}><span className={styles.placeholder}>{t('contractOnBasis', { value: carrierDetails.basis || data.carrier?.basis || '' })}</span></div>
          </div>
        </div>

        <div className={styles.partyBox}>
          <div className={`${styles.partyHeader} ${styles.customerHeader}`}>
            <IonIcon icon={personOutline} />
            <span>{t('contractPartyCustomer')}</span>
          </div>
          <div className={styles.partyContent}>
            <div className={styles.partyField}><span className={styles.placeholder}>{senderDetails.company_name || data.customer?.name || ''}</span></div>
            <div className={styles.partyField}><span className={styles.placeholder}>{t('contractInPerson', { name: senderDetails.representative || data.customer?.representative || '' })}</span></div>
            <div className={styles.partyField}><span className={styles.placeholder}>{t('contractInn', { value: senderDetails.inn || '__________' })}</span></div>
            <div className={styles.partyField}><span className={styles.placeholder}>{t('contractOgrn', { value: senderDetails.ogrn || '__________' })}</span></div>
            <div className={styles.partyField}><span className={styles.placeholder}>{t('contractOnBasis', { value: senderDetails.basis || data.customer?.basis || '' })}</span></div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={`${styles.sectionHeader} ${styles.sectionGreen}`}>
          <IonIcon icon={attachOutline} />
          <span>{t('contractSectionSubject')}</span>
        </div>
        <div className={styles.sectionGrid}>
          <div className={styles.infoBox}><div className={styles.infoLabel}>{t('contractCargoName')}</div><div className={styles.infoValue}>{data.specification?.cargo_name || work.name || t('contractNotSpecified')}</div></div>
          <div className={styles.infoBox}><div className={styles.infoLabel}>{t('contractCargoSpecs')}</div><div className={styles.infoValue}>{t('contractWeight', { value: cargoQuantity.weight })}<br />{t('contractVolume', { value: cargoQuantity.volume })}</div></div>
          <div className={styles.infoBox}><div className={styles.infoLabel}>{t('contractRoute')}</div><div className={styles.infoValue}>{(typeof work.address?.city === 'object' ? work.address?.city?.city : work.address?.city) || ''} → {(typeof work.destiny?.city === 'object' ? work.destiny?.city?.city : work.destiny?.city) || ''}</div></div>
          <div className={styles.infoBox}><div className={styles.infoLabel}>{t('contractDateLabel')}</div><div className={styles.infoValue}>{contractDateLabel}</div></div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={`${styles.sectionHeader} ${styles.sectionOrange}`}>
          <IonIcon icon={attachOutline} />
          <span>{t('contractSectionPayment')}</span>
        </div>
        <div className={styles.paymentSection}>
          <div className={styles.totalCostBox}><div className={styles.totalCostLabel}>{t('contractTotalCost')}</div><div className={styles.totalCostValue}>{formatPrice(data.payment?.amount || (work.price ?? 0))}</div></div>
          <div className={styles.paymentGrid}>
            <div className={styles.paymentBox}><div className={styles.paymentLabel}>{t('contractPrepayment', { percent: payments.prepaymentPercent })}</div><div className={styles.paymentValue}>{formatPrice(payments.prepayment)}</div><div className={styles.paymentNote}>{t('contractPrepaymentNote')}</div></div>
            <div className={styles.paymentBox}><div className={styles.paymentLabel}>{t('contractRemaining')}</div><div className={styles.paymentValue}>{formatPrice(payments.remaining)}</div><div className={styles.paymentNote}>{t('contractRemainingNote')}</div></div>
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

      <div className={styles.signatureSection}>
        <div className={styles.signatureBox}>
          <div className={`${styles.signatureHeader} ${styles.performerHeader}`}>{t('contractSignerPerformer')}</div>
          <div className={styles.signaturePlace}>
            <IonIcon icon={attachOutline} />
            <div className={styles.signatureLabel}>{t('contractSignPlace')}</div>
            <div className={styles.signatureName}>{carrierDetails.representative || data.carrier?.representative || ''}</div>
          </div>
        </div>

        <div className={styles.signatureBox}>
          <div className={`${styles.signatureHeader} ${styles.customerHeader}`}>{t('contractSignerCarrier')}</div>
          <div className={styles.signaturePlace}>
            <SignField
              label={t('contractSignCarrier')}
              value={signature}
              onChange={(value) => {
                if (Array.isArray(value) && value.length > 0 && value[0]?.dataUrl) setSignature(value[0].dataUrl);
                else if (value === '' || value === null || value === undefined) setSignature('');
              }}
              placeholder={t('contractSignPlaceholder')}
            />
            <div className={styles.signatureName}>{carrierDetails.representative || data.carrier?.representative || ''}</div>
          </div>
        </div>
      </div>

      {error && <div className="error-msg" style={{ margin: '1em 0.5em', color: 'red' }}>{error}</div>}

      <div className={styles.buttonsSection}>
        <IonButton className={styles.cancelButton} onClick={onBack} expand="block" disabled={loading}>
          {t('contractCancel')}
        </IonButton>
        <IonButton className={styles.signButton} onClick={handleSign} expand="block" disabled={loading || !signature}>
          {t('contractSignAndSend')}
        </IonButton>
      </div>
    </div>
  );
};
