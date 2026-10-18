import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Calendar,
  CalendarCheck,
  Clock,
  Lock,
  Map,
  MapPin,
  Users,
} from 'lucide-react';
import { CargoInfo } from '../../../Store/cargoStore';
import { formatters } from '../../../utils/utils';
import {
  getPaymentLevel,
  PAYMENT_LABEL,
  publishedDateTime,
  resolvePublishedAt,
  shortDate,
} from '../../Works/feedFormat';
import {
  cargoFeedKind,
  cargoFeedLabel,
  resolveCargoProgressStatus,
} from '../cargoStatusFlow';
import styles from './CargoOrderInfo.module.css';

type CargoOrderInfoProps = {
  cargo: CargoInfo;
  onMapClick?: (cargo: CargoInfo) => void;
};

export const CargoOrderInfo: React.FC<CargoOrderInfoProps> = ({ cargo, onMapClick }) => {
  const { t } = useTranslation('cargos');
  const fromCity = cargo.address?.city?.city || t('notSpecified');
  const toCity = cargo.destiny?.city?.city || t('notSpecified');
  const payment = getPaymentLevel(cargo);
  const reserved = Number(cargo.advance) || 0;
  const offers = cargo.invoices?.length ?? 0;
  const pickup = shortDate(cargo.pickup_date) || '—';
  const delivery = shortDate(cargo.delivery_date) || '—';
  const publishedAt = resolvePublishedAt(cargo);
  const publishedLabel = publishedAt ? publishedDateTime(publishedAt) : '';
  const progressStatus = resolveCargoProgressStatus(cargo);
  const statusKind = cargoFeedKind(progressStatus);
  const badgeClass =
    statusKind === 'new' || statusKind === 'waiting'
      ? styles.badge_new
      : statusKind === 'bids'
        ? styles.badge_bids
        : statusKind === 'done'
          ? styles.badge_done
          : statusKind === 'alert'
            ? styles.badge_alert
            : styles.badge_work;

  return (
    <section className={styles.card}>
      <div className={styles.top}>
        <div className={styles.topLeft}>
          <div className={styles.meta}>
            <span className={`${styles.badge} ${badgeClass}`}>
              {cargoFeedLabel(progressStatus)}
            </span>
            <span className={styles.id}>ЗК-{formatters.shortId(cargo.guid)}</span>
          </div>
          <h2 className={styles.title}>{cargo.name || t('untitled')}</h2>
          <div className={styles.route}>
            <MapPin size={16} strokeWidth={1.75} />
            <span>{fromCity}</span>
            <ArrowRight size={14} strokeWidth={2} className={styles.routeArrow} />
            <span>{toCity}</span>
          </div>
          {onMapClick && (
            <button type="button" className={styles.mapBtn} onClick={() => onMapClick(cargo)}>
              <Map size={16} strokeWidth={1.75} />
              {t('openMap')}
            </button>
          )}
        </div>

        <div className={styles.topRight}>
          <p className={styles.price}>{formatters.currency(cargo.price)}</p>
          <span className={`${styles.escrowBadge} ${styles[`escrow_${payment}`]}`}>
            <span className={styles.escrowDot} />
            {PAYMENT_LABEL[payment]}
          </span>
        </div>
      </div>

      <div className={styles.chips}>
        {publishedLabel && (
          <span className={styles.chip}>
            <Clock size={14} strokeWidth={1.75} className={styles.chipPrimary} />
            {t('published', { date: publishedLabel })}
          </span>
        )}
        <span className={styles.chip}>
          <Calendar size={14} strokeWidth={1.75} className={styles.chipPrimary} />
          {t('departure', { date: pickup })}
        </span>
        <span className={styles.chip}>
          <CalendarCheck size={14} strokeWidth={1.75} className={styles.chipSuccess} />
          {t('delivery', { date: delivery })}
        </span>
        <span className={styles.chip}>
          <Users size={14} strokeWidth={1.75} className={styles.chipPrimary} />
          {t('offers', { count: offers })}
        </span>
      </div>

      <div className={styles.escrowRow}>
        <div className={styles.escrowLabel}>
          <Lock size={16} strokeWidth={2} />
          <span>{t('inEscrow')}</span>
        </div>
        <strong>{formatters.currency(reserved)}</strong>
      </div>

      {cargo.description && cargo.description.trim() !== cargo.name && (
        <p className={styles.desc}>{cargo.description}</p>
      )}
    </section>
  );
};
