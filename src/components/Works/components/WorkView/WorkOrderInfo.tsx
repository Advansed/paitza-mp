import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Building2,
  FileText,
  Lock,
  Map,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  Star,
  Truck,
  User,
} from 'lucide-react';
import { WorkInfo, WorkStatus } from '../../types';
import { getWorkCustomerName, workFormatters } from '../../utils';
import { normalizeWorkStatus } from '../../statusFlow';
import {
  fleetSlots,
  formatPhonePretty,
  formatQty,
  getPaymentLevel,
  offersLabel,
  phoneHref,
  publishedDateTime,
  resolveBodyType,
  resolvePublishedAt,
  routeDistanceKm,
  shortDate,
  type PaymentLevel,
} from '../../feedFormat';
import styles from './WorkOrderInfo.module.css';

type WorkOrderInfoProps = {
  work: WorkInfo;
  onMapClick?: (work: WorkInfo) => void;
};

const PAYMENT_TITLE_KEY: Record<PaymentLevel, string> = {
  full: 'paySafeFull',
  partial: 'paySafePartial',
  none: 'paySafeNone',
};

const PAYMENT_TEXT_KEY: Record<PaymentLevel, string> = {
  full: 'paySafeFullText',
  partial: 'paySafePartialText',
  none: 'paySafeNoneText',
};

export const WorkOrderInfo: React.FC<WorkOrderInfoProps> = ({ work, onMapClick }) => {
  const { t } = useTranslation('works');
  const price = work.currentOffer?.price ?? work.price;
  const weight = work.currentOffer?.weight ?? work.weight;
  const volume = work.currentOffer?.volume ?? work.volume;
  const fromCity = work.address?.city?.city || t('notSpecified');
  const toCity = work.destiny?.city?.city || t('notSpecified');
  const customerName = getWorkCustomerName(work);
  const contactName = work.face?.trim() || '';
  const payment = getPaymentLevel(work);
  const reserved = Number(work.advance) || 0;
  const slots = fleetSlots(work);
  const offers = work.offers?.length ?? 0;
  const distance = routeDistanceKm(work);
  const bodyType = resolveBodyType(work);
  const pickup = shortDate(work.pickup_date);
  const delivery = shortDate(work.delivery_date);
  const publishedAt = resolvePublishedAt(work);
  const publishedLabel = publishedAt ? publishedDateTime(publishedAt) : '';
  const tel = work.phone ? phoneHref(work.phone) : null;
  const verified = work.company?.verified ?? Boolean(work.company);
  const status = normalizeWorkStatus(work.status);
  const phoneUnlocked =
    work.signed ||
    (status !== WorkStatus.NEW &&
      status !== WorkStatus.OFFERED &&
      status !== WorkStatus.REJECTED);
  const documents = Array.isArray(work.documents)
    ? work.documents.map((item) => String(item).trim()).filter(Boolean)
    : [];

  return (
    <div className={styles.stack}>
      <section className={`${styles.card} ${styles.payCard} ${styles[`pay_${payment}`]}`}>
        <div className={styles.payHead}>
          <div className={`${styles.payLight} ${styles[`light_${payment}`]}`} aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <div className={styles.payCopy}>
            <h3 className={styles.payTitle}>
              <Lock size={14} strokeWidth={2} className={styles.payLock} />
              {t(PAYMENT_TITLE_KEY[payment])}
            </h3>
            <p className={styles.payText}>{t(PAYMENT_TEXT_KEY[payment])}</p>
          </div>
        </div>
        {payment !== 'none' && (
          <div className={styles.payReserve}>
            <span>{t('reserved')}</span>
            <strong>
              {workFormatters.currency(reserved)}
              <span>
                {' '}
                {t('ofAmount', { amount: workFormatters.currency(work.price) })}
              </span>
            </strong>
          </div>
        )}
      </section>

      {slots && (
        <section className={styles.card}>
          <div className={styles.fleetHead}>
            <div className={styles.fleetTitle}>
              <Truck size={16} strokeWidth={1.75} />
              {t('trucksNeeded', { count: slots.total })}
            </div>
            <span className={`${styles.fleetBadge} ${slots.free > 0 ? styles.fleetOpen : styles.fleetFull}`}>
              {slots.free > 0 ? t('slotsFree', { count: slots.free }) : t('slotsClosed')}
            </span>
          </div>
          <div className={styles.fleetBar} aria-hidden>
            {Array.from({ length: slots.total }, (_, i) => (
              <span key={i} className={i < slots.busy ? styles.fleetSegOn : styles.fleetSegOff} />
            ))}
          </div>
          <p className={styles.fleetHint}>
            {t('fleetProgress', { busy: slots.busy, total: slots.total })}
            {slots.free > 0
              ? ` ${t('fleetMore', { count: slots.free })}`
              : ` ${t('fleetFull')}`}
          </p>
          <div className={styles.fleetSlots}>
            {Array.from({ length: slots.total }, (_, i) =>
              i < slots.busy ? (
                <div key={i} className={styles.slotFilled}>
                  <span className={styles.slotIcon}>
                    <User size={16} strokeWidth={1.75} />
                  </span>
                  <div className={styles.slotBody}>
                    <p>{t('truckWorking')}</p>
                    <span>{t('slotTaken')}</span>
                  </div>
                  <span className={styles.slotPill}>{t('inProgress')}</span>
                </div>
              ) : (
                <div key={i} className={styles.slotOpen}>
                  <span className={styles.slotIconMuted}>
                    <Plus size={16} strokeWidth={1.75} />
                  </span>
                  <p>{t('slotOpen')}</p>
                </div>
              )
            )}
          </div>
        </section>
      )}

      {customerName && (
        <section className={styles.card}>
          <div className={styles.kicker}>{t('sender')}</div>
          <div className={styles.partyRow}>
            <span className={styles.partyIconBrand}>
              <Building2 size={18} strokeWidth={1.75} />
            </span>
            <div className={styles.partyBody}>
              <div className={styles.partyName}>
                {customerName}
                {verified && <ShieldCheck size={16} strokeWidth={2} className={styles.verified} />}
              </div>
              <div className={styles.partyRole}>{t('customerRole')}</div>
            </div>
          </div>
          {(work.company?.rating || work.company?.deals || verified) && (
            <div className={styles.partyFooter}>
              <div className={styles.partyMeta}>
                {work.company?.rating != null && (
                  <span>
                    <Star size={14} strokeWidth={2} className={styles.star} />
                    {work.company.rating.toFixed(1)}
                  </span>
                )}
                {work.company?.deals != null && (
                  <span>
                    {t('deals', { count: work.company.deals })}
                  </span>
                )}
              </div>
              {verified && <span className={styles.verifiedPill}>{t('verified')}</span>}
            </div>
          )}
        </section>
      )}

      {(contactName || work.phone) && (
        <section className={styles.card}>
          <div className={styles.kicker}>{t('contactPerson')}</div>
          <div className={styles.partyRow}>
            <span className={styles.partyIcon}>
              <User size={16} strokeWidth={1.75} />
            </span>
            <div className={styles.partyBody}>
              <div className={styles.partyName}>{contactName || t('representative')}</div>
              <div className={styles.partyRole}>{t('representative')}</div>
            </div>
          </div>
          {phoneUnlocked && work.phone ? (
            <a
              className={styles.phoneBtn}
              href={tel || undefined}
              onClick={(e) => {
                if (!tel) e.preventDefault();
              }}
            >
              <Phone size={16} strokeWidth={2} />
              <span>{formatPhonePretty(work.phone)}</span>
              {work.signed && <span className={styles.signedPill}>{t('contractSigned')}</span>}
            </a>
          ) : (
            <div className={styles.phoneLocked}>
              <Lock size={16} strokeWidth={2} />
              <span>+7 900 •••-••-••</span>
              <em>{t('phoneAfter')}</em>
            </div>
          )}
        </section>
      )}

      {documents.length > 0 && (
        <section className={styles.card}>
          <div className={styles.kicker}>
            <FileText size={13} strokeWidth={2} />
            {t('orderDocs')}
          </div>
          {phoneUnlocked ? (
            <ul className={styles.docList}>
              {documents.map((name) => (
                <li key={name} className={styles.docItem}>
                  <FileText size={16} strokeWidth={1.75} />
                  <span>{name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.phoneLocked}>
              <Lock size={16} strokeWidth={2} />
              <span>
                {documents.length}{' '}
                {t('docs', { count: documents.length })}
              </span>
              <em>{t('docsAfter')}</em>
            </div>
          )}
        </section>
      )}

      <section className={`${styles.card} ${styles.specCard}`}>
        <div className={styles.specHead}>
          <span className={styles.specKicker}>{t('cost')}</span>
          <span className={styles.offers}>{offersLabel(offers)}</span>
        </div>
        <div className={styles.specPrice}>{workFormatters.currency(price)}</div>
        <div className={styles.specRoute}>
          <MapPin size={16} strokeWidth={1.75} />
          <span>{fromCity}</span>
          <ArrowRight size={14} strokeWidth={2} className={styles.specArrow} />
          <span>{toCity}</span>
          {distance != null && <span className={styles.specKm}>· {t('km', { count: distance })}</span>}
        </div>
        {onMapClick && (
          <button type="button" className={styles.mapBtn} onClick={() => onMapClick(work)}>
            <Map size={16} strokeWidth={1.75} />
            {t('openMap')}
          </button>
        )}
        <dl className={styles.specTable}>
          <SpecRow label={t('published')} value={publishedLabel} />
          <SpecRow label={t('pickupDate')} value={pickup} />
          <SpecRow label={t('deliveryDate')} value={delivery} />
          <SpecRow label={t('bodyType')} value={bodyType} />
          <SpecRow label={t('loadingType')} value={work.loading_type} />
          <SpecRow
            label={t('weightVolume')}
            value={t('weightVolumeValue', {
              weight: formatQty(Number(weight) || 0),
              volume: formatQty(Number(volume) || 0),
            })}
          />
          <SpecRow label={t('payment')} value={t('cashless')} />
        </dl>
        {work.description && work.description.trim() !== work.name && (
          <p className={styles.desc}>{work.description}</p>
        )}
      </section>
    </div>
  );
};

function SpecRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className={styles.specRow}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
