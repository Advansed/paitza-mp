import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ShieldCheck } from 'lucide-react';
import { WorkInfo, WorkStatus } from '../../types';
import { useTransportStore, transportDisplayName } from '../../../../Store/transportStore';
import { offerTaxAmount, useLoginStore } from '../../../../Store/loginStore';
import { useAccountData } from '../../../../Store/accountStore';
import { formatters } from '../../../../utils/utils';
import { intlLocale } from '../../../../i18n';
import styles from './CounterOffer.module.css';

function formatGroupedPrice(price: number | undefined): string {
  if (!price) return '';
  return new Intl.NumberFormat(intlLocale(), {
    maximumFractionDigits: 0,
  }).format(Math.trunc(price));
}

function digitsBefore(value: string, caret: number): number {
  return value.slice(0, Math.max(0, caret)).replace(/\D/g, '').length;
}

function caretAfterDigits(formatted: string, digits: number): number {
  if (digits <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i += 1) {
    if (/\d/.test(formatted[i])) {
      seen += 1;
      if (seen === digits) return i + 1;
    }
  }
  return formatted.length;
}

interface CounterOfferCardProps {
  work: WorkInfo;
  onSubmit: (data: Partial<WorkInfo>, volume: number) => Promise<void>;
  onCancel?: () => void;
}

export const CounterOfferCard: React.FC<CounterOfferCardProps> = ({ work, onSubmit }) => {
  const { t } = useTranslation('works');
  const [formData, setFormData] = useState<Partial<WorkInfo>>({
    price: work.price,
    weight: work.weight,
  });
  const [volume, setVolume] = useState<number>(work.volume);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const priceRef = useRef<HTMLInputElement>(null);
  const priceCaretDigits = useRef<number | null>(null);

  const transport = useTransportStore((state) => state.data);
  const isOffered = work.status === WorkStatus.OFFERED;
  const tax = useLoginStore((state) => state.tax);
  const accountData = useAccountData();
  const required = offerTaxAmount(Number(formData.price) || 0, tax);
  const balance = accountData?.balance;

  useEffect(() => {
    if (transport?.guid) {
      setFormData((prev) => ({ ...prev, transport: transport.guid }));
    }
  }, [transport?.guid]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const caret = e.target.selectionStart ?? raw.length;
    priceCaretDigits.current = digitsBefore(raw, caret);
    const numValue = parseInt(raw.replace(/\D/g, ''), 10) || 0;
    setFormData({ ...formData, price: numValue });
  };

  useLayoutEffect(() => {
    const input = priceRef.current;
    const digits = priceCaretDigits.current;
    if (!input || digits == null) return;
    const next = caretAfterDigits(formatGroupedPrice(formData.price), digits);
    input.setSelectionRange(next, next);
    priceCaretDigits.current = null;
  }, [formData.price]);

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const weight = parseFloat(e.target.value) || 0;
    const baseWeight = Number(work.weight) || 0;
    const basePrice = Number(work.price) || 0;
    const price =
      baseWeight > 0 && weight > 0 ? Math.round((basePrice / baseWeight) * weight) : 0;
    setFormData({ ...formData, weight, price });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value) || 0);
  };

  const transportLabel = transport
    ? [transportDisplayName(transport) || t('transportFallback'), transport.license_plate ? `(${transport.license_plate})` : '']
        .filter(Boolean)
        .join(' ')
    : t('addTransport');

  const handleSubmit = async () => {
    setError('');

    if (!formData.price || formData.price <= 0) {
      setError(t('badPrice'));
      return;
    }
    if (!formData.weight || formData.weight <= 0) {
      setError(t('badWeight'));
      return;
    }
    if (!transport?.guid) {
      setError(t('addTransport'));
      return;
    }
    if (!isOffered && required > 0 && balance != null && balance < required) {
      setError(
        t('holdShort', { required: formatters.currency(required), tax, balance: formatters.currency(balance) })
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(
        {
          ...work,
          ...formData,
          transport: transport.guid,
          volume,
        },
        volume
      );
    } catch {
      setError(isOffered ? t('offerCancelError') : t('offerSendError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.root}>
      <section className={styles.formCard}>
        <h3 className={styles.formTitle}>
          {isOffered ? t('offerMade') : t('counterOffer')}
        </h3>
        <p className={styles.formHint}>
          {isOffered
            ? t('offerSent')
            : t('offerHint')}
        </p>

        <div className={styles.fields}>
          <label className={styles.field}>
            <span>{t('priceRub')}</span>
            <input
              ref={priceRef}
              className={styles.priceInput}
              type="text"
              inputMode="numeric"
              value={formatGroupedPrice(formData.price)}
              onChange={handlePriceChange}
              placeholder="22 500"
              disabled={isOffered}
            />
          </label>
          <label className={styles.field}>
            <span>{t('weightT')}</span>
            <input
              type="number"
              value={formData.weight || ''}
              onChange={handleWeightChange}
              placeholder="8"
              step="0.1"
              min="0"
              disabled={isOffered}
            />
          </label>
          <label className={styles.field}>
            <span>{t('volumeM')}</span>
            <input
              type="number"
              value={volume || ''}
              onChange={handleVolumeChange}
              placeholder="40"
              step="0.1"
              min="0"
              disabled={isOffered}
            />
          </label>
        </div>

        <label className={styles.field}>
          <span>{t('transport')}</span>
          <div className={`${styles.select} ${transport ? '' : styles.selectEmpty}`}>
            <span className={styles.selectValue}>{transportLabel}</span>
            <ChevronDown size={18} strokeWidth={2} aria-hidden />
          </div>
        </label>
      </section>

      <aside className={styles.secure}>
        <ShieldCheck size={22} strokeWidth={2} className={styles.secureIcon} />
        <div>
          <h4 className={styles.secureTitle}>{t('secureTitle')}</h4>
          <p className={styles.secureText}>
            {t('secureText')}
            {tax > 0
              ? ` ${t('secureTax', { tax })}`
              : ` ${t('secureNoTax')}`}
          </p>
          {!isOffered && required > 0 && (
            <p className={balance != null && balance < required ? styles.holdWarn : styles.holdNote}>
              {t('holdLine', { required: formatters.currency(required), tax })}
              {balance != null ? ` ${t('holdNow', { balance: formatters.currency(balance) })}` : ''}
            </p>
          )}
        </div>
      </aside>

      {error && <div className={styles.error}>{error}</div>}

      <button
        type="button"
        className={isOffered ? styles.cancelBtn : styles.submitBtn}
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting
          ? t('sending')
          : isOffered
            ? t('withdrawOffer')
            : t('sendOffer')}
      </button>
    </div>
  );
};
