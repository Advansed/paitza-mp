import React, { useState } from 'react';
import { CheckField } from '../../../DataEditor/fields/CheckField';
import { ImagesField } from '../../../DataEditor/fields/ImagesField';
import { WorkInfo } from '../../types';
import { WorkActionPanel } from './WorkActionPanel';
import styles from './CounterOffer.module.css';

export interface InWorkUnloadData {
  verified: boolean;
  cargoPhotos: string[];
  sealPhotos: string[];
}

interface InWorkCardProps {
  work: WorkInfo;
  onArrivedUnload: (data: InWorkUnloadData) => Promise<void>;
  isLoading?: boolean;
}

export const InWorkCard: React.FC<InWorkCardProps> = ({
  work,
  onArrivedUnload,
  isLoading = false,
}) => {
  const [verified, setVerified] = useState(false);
  const [cargoPhotos, setCargoPhotos] = useState<string[]>([]);
  const [sealPhotos, setSealPhotos] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!verified) {
      setError('Подтвердите, что с грузом и пломбой всё в порядке');
      return;
    }
    if (cargoPhotos.length === 0) {
      setError('Добавьте фото груза');
      return;
    }
    if (sealPhotos.length === 0) {
      setError('Добавьте фото пломбы');
      return;
    }
    setIsSubmitting(true);
    try {
      await onArrivedUnload({ verified, cargoPhotos, sealPhotos });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка при отправке');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <WorkActionPanel
      title="Прибыл на выгрузку"
      hint="Сфотографируйте груз и пломбу и подтвердите осмотр."
      work={work}
      error={error}
      action={{
        label: isSubmitting ? 'Отправка…' : 'Прибыл на выгрузку',
        onClick: handleSubmit,
        disabled: isLoading || isSubmitting,
      }}
    >
      <div className={styles.photos}>
        <CheckField
          label="Всё в порядке"
          value={verified}
          onChange={setVerified}
          description="Груз и пломба в порядке, замечаний нет"
        />
        <ImagesField
          label="Фото груза"
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
