import React, { useEffect, useMemo, useState } from 'react';
import { Camera, MessageSquare, Package, RefreshCw, Send, Star, type LucideIcon } from 'lucide-react';
import { DriverInfo } from '../../../Store/cargoStore';
import { useChats } from '../../../Store/useChats';
import { formatters } from '../../../utils/utils';
import { latestPhotoBatch, resolvePhotoBatch, LOAD_CARGO_PHOTO_STATUS, LOAD_SEAL_PHOTO_STATUS } from '../../../utils/orderPhotos';
import { PhotoPreview } from '../../Chats/PhotoPreview';
import styles from './CargoView.module.css';

type CargoTripActionProps = {
  invoice: DriverInfo;
  onChat: (invoice: DriverInfo) => void;
  onStartLoading: (invoice: DriverInfo) => void | Promise<void>;
  onSend: (invoice: DriverInfo) => void | Promise<void>;
  onStartUnloading: (invoice: DriverInfo) => void | Promise<void>;
  onComplete: (invoice: DriverInfo, rating: number, completed: boolean) => void | Promise<void>;
  isLoading?: boolean;
};

type PhotoGroupCopy = {
  status: number;
  label: string;
  empty?: string;
};

type StepCopy = {
  title: string;
  hint: string;
  photoStatus?: number;
  photoLabel?: string;
  photoEmpty?: string;
  photoGroups?: PhotoGroupCopy[];
  requirePhotos?: boolean;
  requireConfirm?: boolean;
  confirmLabel?: string;
  requireRating?: boolean;
  primaryLabel?: string;
  PrimaryIcon?: LucideIcon;
};

function resolvePhotoGroups(copy: StepCopy): PhotoGroupCopy[] {
  if (copy.photoGroups?.length) return copy.photoGroups;
  if (copy.photoStatus) {
    return [{ status: copy.photoStatus, label: copy.photoLabel || '', empty: copy.photoEmpty }];
  }
  return [];
}

function stepCopy(status: DriverInfo['status']): StepCopy {
  switch (status) {
    case 'Принято':
      return {
        title: 'Договор подписан',
        hint: 'Водитель принят. Ожидайте прибытия на место погрузки.',
      };
    case 'На погрузке':
      return {
        title: 'Приехал на погрузку',
        hint: 'Исполнитель прибыл. Проверьте фото кузова и начните загрузку.',
        photoStatus: 14,
        photoLabel: 'Актуальные фото кузова',
        photoEmpty: 'Фото кузова ещё не получены. Водитель может отправить или заменить снимки в действии по заказу.',
        requirePhotos: true,
        primaryLabel: 'Начать погрузку',
        PrimaryIcon: Package,
      };
    case 'Загружается':
      return {
        title: 'Загрузка начата',
        hint: 'Погрузка выполняется. Ожидайте, пока водитель подтвердит загрузку.',
      };
    case 'Загружено':
      return {
        title: 'Погружено',
        hint: 'Груз погружен. Проверьте фото и отправьте транспорт в рейс. Водитель может заменить снимки, пока вы не отправили.',
        photoGroups: [
          {
            status: LOAD_CARGO_PHOTO_STATUS,
            label: 'Актуальные фото груза',
            empty: 'Фото груза ещё не получены.',
          },
          {
            status: LOAD_SEAL_PHOTO_STATUS,
            label: 'Актуальные фото пломбы',
            empty: 'Фото пломбы ещё не получены.',
          },
        ],
        primaryLabel: 'Отправить',
        PrimaryIcon: Send,
      };
    case 'В пути':
      return {
        title: 'В пути',
        hint: 'Транспорт в пути к месту разгрузки.',
      };
    case 'Прибыл':
      return {
        title: 'Прибыл на выгрузку',
        hint: 'Транспорт на месте разгрузки. Ожидайте фото и начала разгрузки.',
      };
    case 'Доставлено':
      return {
        title: 'Товар прибыл',
        hint: 'Проверьте фото и подтвердите, что пломба цела, затем начните разгрузку.',
        photoStatus: 18,
        photoLabel: 'Фото при прибытии на выгрузку',
        photoEmpty: 'Фото ещё не получены.',
        requireConfirm: true,
        confirmLabel: 'Пломба цела, груз доставлен',
        primaryLabel: 'Начать разгрузку',
        PrimaryIcon: Package,
      };
    case 'Разгружается':
      return {
        title: 'Разгружается',
        hint: 'Идёт разгрузка. Ожидайте завершения со стороны водителя.',
      };
    case 'Разгружено':
      return {
        title: 'Товар выгружен',
        hint: 'Оцените работу исполнителя и завершите заказ.',
        requireRating: true,
        requireConfirm: true,
        confirmLabel: 'Все работы завершены в срок и претензий не имею',
        primaryLabel: 'Завершить',
        PrimaryIcon: Star,
      };
    case 'Завершено':
      return {
        title: 'Заказ завершён',
        hint: 'Все работы по этому исполнителю завершены.',
      };
    default:
      return {
        title: 'Действие по заказу',
        hint: 'Откройте чат с исполнителем, если нужна связь.',
      };
  }
}

export const CargoTripAction: React.FC<CargoTripActionProps> = ({
  invoice,
  onChat,
  onStartLoading,
  onSend,
  onStartUnloading,
  onComplete,
  isLoading = false,
}) => {
  const copy = stepCopy(invoice.status);
  const photoGroups = resolvePhotoGroups(copy);
  const photoKey = photoGroups.map((g) => g.status).join(',');
  const [groupFotos, setGroupFotos] = useState<Record<number, unknown[]>>({});
  const [photosLoading, setPhotosLoading] = useState(photoGroups.length > 0);
  const [previewUrl, setPreviewUrl] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [rating, setRating] = useState(0);
  const [photoTick, setPhotoTick] = useState(0);
  const { getPhotos } = useChats();

  useEffect(() => {
    if (photoGroups.length === 0) {
      setGroupFotos({});
      setPhotosLoading(false);
      return;
    }
    let cancelled = false;
    let inflight = false;
    const statuses = photoGroups.map((g) => g.status);

    const load = async (showSpinner: boolean) => {
      if (inflight) return;
      inflight = true;
      if (showSpinner) setPhotosLoading(true);
      try {
        const next: Record<number, unknown[]> = {};
        for (const status of statuses) {
          next[status] = await resolvePhotoBatch(
            latestPhotoBatch((await getPhotos(invoice.recipient, invoice.cargo, status)) || [])
          );
        }
        if (!cancelled) setGroupFotos(next);
      } catch (err: unknown) {
        console.error(err);
        if (!cancelled) setGroupFotos({});
      } finally {
        inflight = false;
        if (!cancelled) setPhotosLoading(false);
      }
    };

    void load(true);
    const shouldPoll = invoice.status === 'На погрузке' || invoice.status === 'Загружено';
    const poll = shouldPoll
      ? window.setInterval(() => {
          void load(false);
        }, 7000)
      : undefined;

    return () => {
      cancelled = true;
      if (poll !== undefined) window.clearInterval(poll);
    };
  }, [invoice.recipient, invoice.cargo, invoice.status, photoKey, getPhotos, photoTick]);

  const groupedPhotos = useMemo(() => {
    return photoGroups.map((group) => ({
      ...group,
      srcs: (groupFotos[group.status] || []) as string[],
    }));
  }, [photoGroups, groupFotos]);

  const anyPhotos = groupedPhotos.some((g) => g.srcs.length > 0);
  const photosReady = !copy.requirePhotos || (!photosLoading && anyPhotos);
  const confirmReady = !copy.requireConfirm || confirmed;
  const ratingReady = !copy.requireRating || rating > 0;
  const canSubmit = Boolean(copy.primaryLabel) && photosReady && confirmReady && ratingReady && !isLoading;

  const handlePrimary = () => {
    if (invoice.status === 'На погрузке') {
      void onStartLoading(invoice);
      return;
    }
    if (invoice.status === 'Загружено') {
      void onSend(invoice);
      return;
    }
    if (invoice.status === 'Доставлено') {
      void onStartUnloading(invoice);
      return;
    }
    if (invoice.status === 'Разгружено') {
      void onComplete(invoice, rating, confirmed);
    }
  };

  const PrimaryIcon = copy.PrimaryIcon;

  return (
    <div>
      <p className={styles.confirmText}>{copy.hint}</p>

      <div className={styles.confirmCard}>
        <div className={styles.confirmRow}>
          <span className={styles.confirmLabel}>Исполнитель</span>
          <span className={styles.confirmValue}>{invoice.client || 'Исполнитель'}</span>
        </div>
        <div className={styles.confirmRow}>
          <span className={styles.confirmLabel}>Транспорт</span>
          <span className={styles.confirmValue}>
            {[invoice.transport, invoice.capacity].filter(Boolean).join(' · ') || 'Не указан'}
          </span>
        </div>
        <div className={styles.confirmRow}>
          <span className={styles.confirmLabel}>Ставка</span>
          <span className={styles.confirmValue}>{formatters.currency(invoice.price)}</span>
        </div>
      </div>

      {groupedPhotos.map((group) => (
        <div key={group.status} className={styles.photoBlock}>
          <div className={styles.photoHead}>
            <Camera size={16} strokeWidth={1.75} />
            {group.label}
            <button
              type="button"
              className={styles.photoRefresh}
              onClick={() => setPhotoTick((n) => n + 1)}
              disabled={photosLoading}
            >
              <RefreshCw size={14} strokeWidth={2} />
              Обновить
            </button>
          </div>
          {photosLoading && <p className={styles.photoEmpty}>Загрузка фото…</p>}
          {!photosLoading && group.srcs.length === 0 && (
            <p className={styles.photoEmpty}>{group.empty}</p>
          )}
          {!photosLoading && group.srcs.length > 0 && (
            <div className={styles.photoGrid}>
              {group.srcs.map((src, index) => (
                <button
                  key={`${src}-${index}`}
                  type="button"
                  className={styles.photoThumbBtn}
                  onClick={() => setPreviewUrl(src)}
                >
                  <img src={src} alt={`Фото ${index + 1}`} className={styles.photoThumb} />
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {copy.requireRating && (
        <div className={styles.photoBlock}>
          <div className={styles.photoHead}>Оценка работы исполнителя</div>
          <div className={styles.stars} role="group" aria-label="Оценка от 1 до 5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`${styles.star} ${star <= rating ? styles.starOn : ''}`}
                onClick={() => setRating(star)}
                aria-label={`${star}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      )}

      {copy.requireConfirm && (
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          <span>{copy.confirmLabel}</span>
        </label>
      )}

      <div className={styles.confirmActions}>
        <button type="button" className={styles.confirmCancel} onClick={() => onChat(invoice)}>
          <MessageSquare size={16} strokeWidth={1.75} />
          Написать
        </button>
        {copy.primaryLabel && (
          <button
            type="button"
            className={styles.confirmSubmit}
            disabled={!canSubmit}
            onClick={handlePrimary}
          >
            {PrimaryIcon && <PrimaryIcon size={16} strokeWidth={1.75} />}
            {copy.primaryLabel}
          </button>
        )}
      </div>

      <PhotoPreview imageUrl={previewUrl} closeModal={() => setPreviewUrl('')} />
    </div>
  );
};
