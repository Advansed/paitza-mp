import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BadgeCheck,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Truck,
  Users,
} from 'lucide-react';
import { WorkInfo } from '../types';
import { getWorkCustomerName, workFormatters } from '../utils';
import { normalizeWorkStatus } from '../statusFlow';
import {
  PAYMENT_LABEL,
  feedStatusKind,
  feedStatusLabel,
  fleetHint,
  formatQty,
  getPaymentLevel,
  offersLabel,
  publishedDateTime,
  resolveBodyType,
  resolvePublishedAt,
  routeDistanceKm,
  shortDate,
  type PaymentLevel,
} from '../feedFormat';
import styles from './WorkCard.module.css';

interface WorkCardProps {
  work: WorkInfo;
  mode?: 'list' | 'view';
  selected?: boolean;
  onClick?: () => void;
}

export { getPaymentLevel, PAYMENT_LABEL };
export type { PaymentLevel };

const LIGHT_CLASS: Record<PaymentLevel, string> = {
  full: styles.light_full,
  partial: styles.light_partial,
  none: styles.light_none,
};

const PAY_CLASS: Record<PaymentLevel, string> = {
  full: styles.pay_full,
  partial: styles.pay_partial,
  none: styles.pay_none,
};

const BADGE_CLASS: Record<ReturnType<typeof feedStatusKind>, string> = {
  new: styles.badgeNew,
  bids: styles.badgeBids,
  work: styles.badgeWork,
  done: styles.badgeDone,
  alert: styles.badgeAlert,
};

export const WorkCard: React.FC<WorkCardProps> = ({ work, selected, onClick }) => {
  const { t } = useTranslation('works');
  const status = normalizeWorkStatus(work.status);
  const kind = feedStatusKind(status);
  const fromCity = work.address?.city?.city || 'Не указано';
  const toCity = work.destiny?.city?.city || 'Не указано';
  const distance = routeDistanceKm(work);
  const offers = work.offers?.length ?? 0;
  const payment = getPaymentLevel(work);
  const bodyType = resolveBodyType(work);
  const customerName = getWorkCustomerName(work);
  const publishedAt = resolvePublishedAt(work);
  const publishedLabel = publishedAt ? publishedDateTime(publishedAt) : '';
  const pickup = shortDate(work.pickup_date);
  const delivery = shortDate(work.delivery_date);
  const fleet = fleetHint(work);

  return (
    <button
      type="button"
      className={`${styles.feedCard} ${selected ? styles.feedCardSelected : ''}`}
      onClick={onClick}
    >
      <div className={`${styles.light} ${LIGHT_CLASS[payment]}`} aria-hidden>
        <span className={styles.lamp} />
        <span className={styles.lamp} />
        <span className={styles.lamp} />
      </div>

      <div className={styles.feedBody}>
        <div className={styles.feedTop}>
          <span className={`${styles.feedBadge} ${BADGE_CLASS[kind]}`}>
            {feedStatusLabel(status)}
          </span>
          <span className={styles.feedId}>ЗК-{workFormatters.shortId(work.guid || work.cargo)}</span>
          <div className={styles.feedPriceCol}>
            <span className={styles.feedPrice}>{workFormatters.currency(work.price)}</span>
            <span className={`${styles.payBadge} ${PAY_CLASS[payment]}`}>
              <span className={styles.payDot} />
              {PAYMENT_LABEL[payment]}
            </span>
          </div>
        </div>

        <h3 className={styles.feedTitle}>{work.name || 'Без названия'}</h3>

        {customerName && (
          <div className={styles.feedCompany}>
            <Building2 size={15} strokeWidth={1.75} aria-hidden />
            <span className={styles.feedCompanyName}>{customerName}</span>
            {(work.company?.verified ?? Boolean(work.company)) && (
              <BadgeCheck size={15} strokeWidth={2} className={styles.verified} aria-label="Проверено" />
            )}
          </div>
        )}

        <div className={styles.feedRoute}>
          <MapPin size={15} strokeWidth={1.75} aria-hidden />
          <span>
            {fromCity} → {toCity}
          </span>
          {distance != null && <span className={styles.feedKm}>· {distance} км</span>}
        </div>

        {(publishedLabel || pickup || delivery) && (
          <div className={styles.feedDates}>
            {publishedLabel && (
              <span>
                <Clock size={14} strokeWidth={1.75} aria-hidden />
                {t('publishedLine', { date: publishedLabel })}
              </span>
            )}
            {pickup && (
              <span>
                <Calendar size={14} strokeWidth={1.75} aria-hidden />
                {t('departure', { date: pickup })}
              </span>
            )}
            {delivery && (
              <span>
                <Calendar size={14} strokeWidth={1.75} aria-hidden />
                {t('delivery', { date: delivery })}
              </span>
            )}
          </div>
        )}

        {fleet && (
          <div className={styles.fleet}>
            <Truck size={14} strokeWidth={1.75} aria-hidden />
            {fleet}
          </div>
        )}

        <div className={styles.feedMeta}>
          {bodyType && (
            <span>
              <Truck size={14} strokeWidth={1.75} aria-hidden />
              {bodyType}
            </span>
          )}
          <span>
            {formatQty(work.weight)} т · {formatQty(work.volume)} м³
          </span>
          {offers > 0 && (
            <span className={styles.feedOffers}>
              <Users size={14} strokeWidth={1.75} aria-hidden />
              {offersLabel(offers)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
