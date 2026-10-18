import React, { useState } from 'react';
import { ImagesField } from '../../../DataEditor/fields/ImagesField';
import { WorkInfo } from '../../types';
import { WorkActionPanel } from './WorkActionPanel';
import styles from './CounterOffer.module.css';

export interface ArrivedCardData {
  bodyPhotos: string[];
}

interface ArrivedCardProps {
  work: WorkInfo;
  onArrived: (data: ArrivedCardData) => Promise<void>;
}

export const ArrivedCard: React.FC<ArrivedCardProps> = ({ work, onArrived }) => {
  const [bodyPhotos, setBodyPhotos] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (bodyPhotos.length === 0) {
      setError('Добавьте фото кузова для подтверждения приезда');
      return;
    }
    setIsSubmitting(true);
    try {
      await onArrived({ bodyPhotos });
    } catch {
      setError('Ошибка при отправке');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <WorkActionPanel
      title="Приехал на погрузку"
      hint="Договор подписан. Подтвердите прибытие: приложите фото кузова на месте погрузки."
      work={work}
      error={error}
      action={{
        label: isSubmitting ? 'Отправка…' : 'Приехал на погрузку',
        onClick: handleSubmit,
        disabled: isSubmitting,
      }}
    >
      <div className={styles.photos}>
        <ImagesField
          label="Фото кузова"
          value={bodyPhotos}
          onChange={setBodyPhotos}
          placeholder="Добавить фото кузова"
          maxImages={5}
        />
      </div>
    </WorkActionPanel>
  );
};
