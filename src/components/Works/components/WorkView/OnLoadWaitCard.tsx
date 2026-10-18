import React, { useEffect, useState } from 'react';
import { ImagesField } from '../../../DataEditor/fields/ImagesField';
import { WorkInfo } from '../../types';
import { WorkActionPanel } from './WorkActionPanel';
import { useChats } from '../../../../Store/useChats';
import {
  BODY_PHOTO_STATUS,
  MAX_BODY_PHOTOS,
  latestPhotoBatch,
  resolvePhotoBatch,
  toUploadablePhoto,
} from '../../../../utils/orderPhotos';
import styles from './CounterOffer.module.css';

export interface BodyPhotosPayload {
  bodyPhotos: Array<string | File>;
}

interface OnLoadWaitCardProps {
  work: WorkInfo;
  onSendBodyPhotos: (data: BodyPhotosPayload) => Promise<void>;
}

export const OnLoadWaitCard: React.FC<OnLoadWaitCardProps> = ({ work, onSendBodyPhotos }) => {
  const [bodyPhotos, setBodyPhotos] = useState<string[]>([]);
  const [hadPhotos, setHadPhotos] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingCurrent, setLoadingCurrent] = useState(true);
  const { getPhotos } = useChats();

  const cargo = work.cargo || work.guid;

  useEffect(() => {
    let cancelled = false;
    setLoadingCurrent(true);
    getPhotos(work.recipient, cargo, BODY_PHOTO_STATUS)
      .then(async (data) => {
        if (cancelled) return;
        const srcs = await resolvePhotoBatch(latestPhotoBatch(data || []));
        if (cancelled) return;
        setBodyPhotos(srcs);
        setHadPhotos(srcs.length > 0);
      })
      .catch(() => {
        if (!cancelled) {
          setBodyPhotos([]);
          setHadPhotos(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCurrent(false);
      });
    return () => {
      cancelled = true;
    };
  }, [work.recipient, cargo, getPhotos]);

  const handleSubmit = async () => {
    setError('');
    if (bodyPhotos.length === 0) {
      setError('Добавьте фото кузова — без них заказчик не начнёт погрузку');
      return;
    }
    setIsSubmitting(true);
    try {
      const uploadable: Array<string | File> = [];
      for (const src of bodyPhotos) {
        try {
          uploadable.push(await toUploadablePhoto(src));
        } catch {
          if (src.startsWith('data:') || src.startsWith('blob:')) throw new Error('bad-local');
        }
      }
      if (uploadable.length === 0) {
        setError('Не удалось подготовить фото. Сделайте новые снимки камерой.');
        return;
      }
      await onSendBodyPhotos({ bodyPhotos: uploadable });
      setHadPhotos(true);
    } catch {
      setError('Не удалось отправить фото. Попробуйте ещё раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const actionLabel = isSubmitting
    ? 'Отправка…'
    : hadPhotos
      ? 'Заменить фото'
      : 'Отправить фото';

  return (
    <WorkActionPanel
      title={hadPhotos ? 'Фото кузова' : 'Нужны фото кузова'}
      hint={
        hadPhotos
          ? 'Заказчик ещё не начал погрузку. Если снимки не подошли — уберите лишние, добавьте новые и замените комплект.'
          : 'Вы на месте, но фото кузова не дошли до заказчика. Отправьте снимки, иначе он не сможет начать погрузку.'
      }
      work={work}
      error={error}
      action={{
        label: actionLabel,
        onClick: handleSubmit,
        disabled: isSubmitting || loadingCurrent,
      }}
    >
      <div className={styles.photos}>
        {loadingCurrent ? (
          <p className={styles.formHint}>Загрузка текущих фото…</p>
        ) : (
          <ImagesField
            label="Фото кузова"
            value={bodyPhotos}
            onChange={setBodyPhotos}
            placeholder="Добавить фото кузова"
            maxImages={MAX_BODY_PHOTOS}
          />
        )}
      </div>
    </WorkActionPanel>
  );
};
