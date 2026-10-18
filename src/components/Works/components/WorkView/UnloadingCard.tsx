import React, { useState } from 'react';
import { ImagesField } from '../../../DataEditor/fields/ImagesField';
import { WorkInfo } from '../../types';
import { WorkActionPanel } from './WorkActionPanel';
import styles from './CounterOffer.module.css';

export interface UnloadingCompleteData {
  bodyPhotos: string[];
}

interface UnloadingCardProps {
  work: WorkInfo;
  onCompleted: (data: UnloadingCompleteData) => Promise<void>;
  isLoading?: boolean;
}

export const UnloadingCard: React.FC<UnloadingCardProps> = ({
  work,
  onCompleted,
  isLoading = false,
}) => {
  const [bodyPhotos, setBodyPhotos] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (bodyPhotos.length === 0) {
      setError('Добавьте фото кузова после разгрузки');
      return;
    }
    setIsSubmitting(true);
    try {
      await onCompleted({ bodyPhotos });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка при отправке');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <WorkActionPanel
      title="Разгрузка"
      hint="После разгрузки сфотографируйте кузов и подтвердите завершение."
      work={work}
      error={error}
      action={{
        label: isSubmitting ? 'Отправка…' : 'Разгружено',
        onClick: handleSubmit,
        disabled: isLoading || isSubmitting,
      }}
    >
      <div className={styles.photos}>
        <ImagesField
          label="Фото кузова после разгрузки"
          value={bodyPhotos}
          onChange={setBodyPhotos}
          placeholder="Добавить фото кузова"
          maxImages={5}
        />
      </div>
    </WorkActionPanel>
  );
};
