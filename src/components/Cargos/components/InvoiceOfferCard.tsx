import React from 'react';
import { useTranslation } from 'react-i18next';
import { Star, Truck, User, Package } from 'lucide-react';
import { DriverInfo } from '../../../Store/cargoStore';
import { cargoStatusLabel } from '../cargoStatusFlow';
import { formatters } from '../../../utils/utils';
import styles from './InvoiceOfferCard.module.css';

type InvoiceOfferCardProps = {
  invoice: DriverInfo;
};

export const InvoiceOfferCard: React.FC<InvoiceOfferCardProps> = ({ invoice }) => {
  const { t } = useTranslation('cargos');
  return (
    <section className={styles.card} aria-label={t('driverBid')}>
      <div className={styles.head}>
        <div>
          <div className={styles.kicker}>{t('driverBid')}</div>
          <h2 className={styles.title}>{invoice.client || t('driverFallback')}</h2>
        </div>
        <div className={styles.status}>{cargoStatusLabel(invoice.status)}</div>
      </div>

      <div className={styles.price}>{formatters.currency(invoice.price)}</div>

      <div className={styles.grid}>
        <div className={styles.row}>
          <span className={styles.icon}>
            <User size={16} strokeWidth={1.75} />
          </span>
          <div>
            <div className={styles.label}>{t('labelDriver')}</div>
            <div className={styles.value}>{invoice.client || '—'}</div>
          </div>
        </div>

        <div className={styles.row}>
          <span className={styles.icon}>
            <Star size={16} strokeWidth={1.75} />
          </span>
          <div>
            <div className={styles.label}>{t('labelRating')}</div>
            <div className={styles.value}>{invoice.rating || '—'}</div>
          </div>
        </div>

        <div className={styles.row}>
          <span className={styles.icon}>
            <Truck size={16} strokeWidth={1.75} />
          </span>
          <div>
            <div className={styles.label}>{t('tripTransport', { defaultValue: 'Транспорт' })}</div>
            <div className={styles.value}>
              {invoice.transport || '—'}
              {invoice.capacity ? ` · ${invoice.capacity}` : ''}
            </div>
          </div>
        </div>

        <div className={styles.row}>
          <span className={styles.icon}>
            <Package size={16} strokeWidth={1.75} />
          </span>
          <div>
            <div className={styles.label}>{t('labelWeightVolume')}</div>
            <div className={styles.value}>
              {invoice.weight} т · {invoice.volume} м³
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
