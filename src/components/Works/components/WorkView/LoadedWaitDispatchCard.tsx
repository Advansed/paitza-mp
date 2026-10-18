import React, { useEffect, useState } from 'react';
import { ImagesField } from '../../../DataEditor/fields/ImagesField';
import { WorkInfo } from '../../types';
import { WorkActionPanel } from './WorkActionPanel';
import { useChats } from '../../../../Store/useChats';
import {
  LOAD_CARGO_PHOTO_STATUS,
  LOAD_SEAL_PHOTO_STATUS,
  MAX_BODY_PHOTOS,
  latestPhotoBatch,
  resolvePhotoBatch,
  prepareUploadablePhotos,
} from '../../../../utils/orderPhotos';
import styles from './CounterOffer.module.css';

export interface LoadedPhotosPayload {
  cargoPhotos: Array<string | File>;
  sealPhotos: Array<string | File>;
}

interface LoadedWaitDispatchCardProps {
  work: WorkInfo;
  onSendLoadedPhotos: (data: LoadedPhotosPayload) => Promise<void>;
}

export const LoadedWaitDispatchCard: React.FC<LoadedWaitDispatchCardProps> = ({
  work,
  onSendLoadedPhotos,
}) => {
  const [cargoPhotos, setCargoPhotos] = useState<string[]>([]);
  const [sealPhotos, setSealPhotos] = useState<string[]>([]);
  const [hadPhotos, setHadPhotos] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingCurrent, setLoadingCurrent] = useState(true);
  const { getPhotos } = useChats();

  const cargoId = work.cargo || work.guid;

  useEffect(() => {
    let cancelled = false;
    setLoadingCurrent(true);

    (async () => {
      try {
        const cargoData = await getPhotos(work.recipient, cargoId, LOAD_CARGO_PHOTO_STATUS);
        const sealData = await getPhotos(work.recipient, cargoId, LOAD_SEAL_PHOTO_STATUS);
        if (cancelled) return;
        const cargoSrcs = await resolvePhotoBatch(latestPhotoBatch(cargoData || []));
        const sealSrcs = await resolvePhotoBatch(latestPhotoBatch(sealData || []));
        setCargoPhotos(cargoSrcs);
        setSealPhotos(sealSrcs);
        setHadPhotos(cargoSrcs.length > 0 || sealSrcs.length > 0);
      } catch {
        if (!cancelled) {
          setCargoPhotos([]);
          setSealPhotos([]);
          setHadPhotos(false);
        }
      } finally {
        if (!cancelled) setLoadingCurrent(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [work.recipient, cargoId, getPhotos]);

  const handleSubmit = async () => {
    setError('');
    if (cargoPhotos.length === 0) {
      setError('Добавьте фото загруженного груза');
      return;
    }
    if (sealPhotos.length === 0 && !hadPhotos) {
      setError('Добавьте фото пломбы');
      return;
    }
    setIsSubmitting(true);
    try {
      const cargoUploadable = await prepareUploadablePhotos(cargoPhotos);
      const sealUploadable =
        sealPhotos.length > 0 ? await prepareUploadablePhotos(sealPhotos) : [];
      if (cargoUploadable.length === 0) {
        setError('Не удалось подготовить фото. Сделайте новые снимки камерой.');
        return;
      }
      if (sealPhotos.length > 0 && sealUploadable.length === 0) {
        setError('Не удалось подготовить фото пломбы. Сделайте новые снимки камерой.');
        return;
      }
      await onSendLoadedPhotos({
        cargoPhotos: cargoUploadable,
        sealPhotos: sealUploadable,
      });
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
      title="Фото груза и пломбы"
      hint={
        hadPhotos
          ? 'Заказчик ещё не отправил транспорт. Можно добавить снимки или заменить комплект, если фото не подошли.'
          : 'Отправьте фото груза и пломбы — без них заказчик не отправит транспорт в рейс.'
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
          <>
            <ImagesField
              label="Фото загруженного груза"
              value={cargoPhotos}
              onChange={setCargoPhotos}
              placeholder="Добавить фото груза"
              maxImages={MAX_BODY_PHOTOS}
            />
            <ImagesField
              label="Фото пломбы"
              value={sealPhotos}
              onChange={setSealPhotos}
              placeholder="Добавить фото пломбы"
              maxImages={MAX_BODY_PHOTOS}
            />
          </>
        )}
      </div>
    </WorkActionPanel>
  );
};
