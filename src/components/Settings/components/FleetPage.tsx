import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n';
import {
  AlertTriangle,
  BadgeCheck,
  Box,
  Calendar,
  Gauge,
  Plus,
  Truck,
  User,
} from 'lucide-react';
import { TransportData, asTransportType, transportDisplayName, transportDriverName } from '../../../Store/transportStore';
import { useResolvedImageSrc } from '../../../utils/fileUpload';
import { useWorkStore } from '../../Works/workStore';
import { MY_WORK_STATUSES, normalizeWorkStatus } from '../../Works/statusFlow';
import { formatPhonePretty } from '../../Works/feedFormat';
import styles from './FleetPage.module.css';

export type FleetStatus = 'free' | 'trip' | 'service';

type FleetPageProps = {
  vehicles: TransportData[];
  onAdd: () => void;
  onOpen: (vehicle: TransportData) => void;
};

const STATUS_KEY: Record<FleetStatus, string> = {
  free: 'free',
  trip: 'onTrip',
  service: 'service',
};

function fleetStatusLabel(status: FleetStatus): string {
  return i18n.t(STATUS_KEY[status], { ns: 'fleet' });
}

export const FleetPage: React.FC<FleetPageProps> = ({ vehicles, onAdd, onOpen }) => {
  const { t } = useTranslation('fleet');
  const works = useWorkStore((s) => s.works);

  const rows = useMemo(
    () => vehicles.map((vehicle) => ({ vehicle, status: resolveStatus(vehicle, works) })),
    [vehicles, works]
  );

  const total = rows.length;
  const free = rows.filter((row) => row.status === 'free').length;
  const trip = rows.filter((row) => row.status === 'trip').length;

  return (
    <div className={styles.root}>
      <header className={styles.head}>
        <div>
          <div className={styles.kicker}>{t('kicker')}</div>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.sub}>
            {t('summary', { total, free, trip })}
          </p>
        </div>
        <button type="button" className={styles.addBtn} onClick={onAdd}>
          <Plus size={18} strokeWidth={2.25} />
          {t('add')}
        </button>
      </header>

      <div className={styles.stats}>
        <article className={styles.statCard}>
          <div className={styles.statLabel}>{t('total')}</div>
          <div className={styles.statValue}>{total}</div>
        </article>
        <article className={styles.statCard}>
          <div className={styles.statLabel}>{t('freeNow')}</div>
          <div className={`${styles.statValue} ${styles.statGreen}`}>{free}</div>
        </article>
        <article className={styles.statCard}>
          <div className={styles.statLabel}>{t('onTrip')}</div>
          <div className={`${styles.statValue} ${styles.statBlue}`}>{trip}</div>
        </article>
      </div>

      <div className={styles.grid}>
        {rows.map(({ vehicle, status }) => (
          <VehicleCard
            key={vehicle.guid || vehicle.license_plate || vehicle.name}
            vehicle={vehicle}
            status={status}
            onClick={() => onOpen(vehicle)}
          />
        ))}
        <button type="button" className={styles.addCard} onClick={onAdd}>
          <span className={styles.addCardIcon}>
            <Plus size={22} strokeWidth={2.25} />
          </span>
          {t('addToFleet')}
        </button>
      </div>
    </div>
  );
};

function VehicleCard({
  vehicle,
  status,
  onClick,
}: {
  vehicle: TransportData;
  status: FleetStatus;
  onClick: () => void;
}) {
  const { t } = useTranslation('fleet');
  const type = asTransportType(vehicle.transport_type);
  const title = transportDisplayName(vehicle) || t('untitled');
  const plate = vehicle.license_plate || vehicle.number || '';
  const body = type?.name || '—';
  const tons = vehicle.load_capacity ?? vehicle.capacity;
  const volume = vehicle.volume;
  const year = vehicle.manufacture_year || vehicle.year;
  const mileage = vehicle.mileage;
  const driverPhone =
    vehicle.driver_phone ||
    (typeof vehicle.driver === 'object' && vehicle.driver ? vehicle.driver.phone || '' : '');
  const driver =
    transportDriverName(vehicle) || (driverPhone ? formatPhonePretty(driverPhone) : '') || t('unassigned');
  const verified = vehicle.verified ?? Boolean(vehicle.sts);
  const needsVerify = !vehicle.sts && !vehicle.verified;
  const capacityLabel = [
    tons != null ? t('tons', { value: formatNum(tons) }) : '',
    volume != null ? t('volume', { value: formatNum(volume) }) : '',
  ]
    .filter(Boolean)
    .join(' · ');
  const yearLabel = [
    year ? String(year) : '',
    mileage != null ? t('mileage', { value: formatMileage(mileage) }) : '',
  ]
    .filter(Boolean)
    .join(' · ');

  const photo = useResolvedImageSrc(vehicle.image);

  return (
    <button type="button" className={styles.card} onClick={onClick}>
      <div className={styles.cardPhoto}>
        {photo ? (
          <img src={photo} alt="" />
        ) : (
          <span className={styles.cardPhotoEmpty} aria-hidden>
            <Truck size={28} strokeWidth={1.5} />
          </span>
        )}
      </div>
      <div className={styles.cardHead}>
        <div className={styles.cardId}>
          <div className={styles.cardName}>
            {title}
            {verified && (
              <BadgeCheck size={16} strokeWidth={2} className={styles.verified} aria-label={t('verified')} />
            )}
          </div>
          {plate && <div className={styles.cardPlate}>{plate}</div>}
        </div>
        <span className={`${styles.badge} ${
          status === 'trip' ? styles.badge_trip : status === 'service' ? styles.badge_service : styles.badge_free
        }`}>{fleetStatusLabel(status)}</span>
      </div>

      <div className={styles.meta}>
        <Meta icon={<Box size={15} />} label={t('body')} value={body} />
        <Meta icon={<Gauge size={15} />} label={t('capacity')} value={capacityLabel || '—'} />
        <Meta icon={<User size={15} />} label={t('driver')} value={driver} />
        <Meta icon={<Calendar size={15} />} label={t('yearMileage')} value={yearLabel || '—'} />
      </div>

      <div className={`${styles.stsNote} ${vehicle.sts ? styles.stsNote_ok : ''}`}>
        {vehicle.sts ? t('stsLoaded') : t('stsMissing')}
      </div>

      {needsVerify && (
        <div className={styles.warn}>
          <AlertTriangle size={14} strokeWidth={2} />
          {t('needSts')}
        </div>
      )}
    </button>
  );
}

function Meta({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className={styles.metaItem}>
      <span className={styles.metaIcon}>{icon}</span>
      <div>
        <div className={styles.metaLabel}>{label}</div>
        <div className={styles.metaValue}>{value}</div>
      </div>
    </div>
  );
}

function resolveStatus(
  vehicle: TransportData,
  works: { transport?: string; status: string }[]
): FleetStatus {
  if (vehicle.status === 'service' || vehicle.status === 'trip' || vehicle.status === 'free') {
    return vehicle.status;
  }
  const guid = vehicle.guid;
  if (guid) {
    const onTrip = works.some((work) => {
      if (work.transport !== guid) return false;
      return MY_WORK_STATUSES.includes(normalizeWorkStatus(work.status));
    });
    if (onTrip) return 'trip';
  }
  return 'free';
}

function formatNum(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n).replace('.', ',');
}

function formatMileage(km: number): string {
  const thousands = km >= 1000 ? Math.round(km / 1000) : km;
  return String(thousands);
}
