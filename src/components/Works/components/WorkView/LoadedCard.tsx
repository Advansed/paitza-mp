import React, { useState } from 'react';
import { CheckField } from '../../../DataEditor/fields/CheckField';
import { ImagesField } from '../../../DataEditor/fields/ImagesField';
import { WorkInfo } from '../../types';
import { WorkActionPanel } from './WorkActionPanel';
import styles from './CounterOffer.module.css';

export interface LoadedCardData {
  verified: boolean;
  cargoPhotos: string[];
  sealPhotos: string[];
}

interface LoadedCardProps {
  work: WorkInfo;
  onLoaded: (data: LoadedCardData) => Promise<void>;
  isLoading?: boolean;
}

export const LoadedCard: React.FC<LoadedCardProps> = ({ work, onLoaded, isLoading = false }) => {
  const [verified, setVerified] = useState(false);
  const [cargoPhotos, setCargoPhotos] = useState<string[]>([]);
  const [sealPhotos, setSealPhotos] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!verified) {
      setError('Подтвердите, что груз проверен');
      return;
    }
    if (cargoPhotos.length === 0) {
      setError('Добавьте фото загруженного груза');
      return;
    }
    if (sealPhotos.length === 0) {
      setError('Добавьте фото пломбы');
      return;
    }
    setIsSubmitting(true);
    try {
      await onLoaded({ verified, cargoPhotos, sealPhotos });
    } catch {
      setError('Ошибка при отправке');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <WorkActionPanel
      title="Загрузка"
      hint="Загрузите груз и приложите фото груза и пломбы."
      work={work}
      error={error}
      action={{
        label: isSubmitting ? 'Отправка…' : 'Загружен',
        onClick: handleSubmit,
        disabled: isLoading || isSubmitting,
      }}
    >
      <div className={styles.photos}>
        <CheckField
          label="Проверен"
          value={verified}
          onChange={setVerified}
          description="Груз осмотрен и проверен"
        />
        <ImagesField
          label="Фото загруженного груза"
          value={cargoPhotos}
          onChange={setCargoPhotos}
          placeholder="Добавить фото груза"
          maxImages={5}
        />
        <ImagesField
          label="Фото пломбы"
          value={sealPhotos}
          onChange={setSealPhotos}
          placeholder="Добавить фото пломбы"
          maxImages={5}
        />
      </div>
    </WorkActionPanel>
  );
};
