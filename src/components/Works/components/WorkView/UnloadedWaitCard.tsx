import React from 'react';
import { WorkInfo } from '../../types';
import { WorkActionPanel } from './WorkActionPanel';

interface UnloadedWaitCardProps {
  work: WorkInfo;
}

export const UnloadedWaitCard: React.FC<UnloadedWaitCardProps> = ({ work }) => {
  return (
    <WorkActionPanel
      title="Груз разгружен"
      hint="Фото кузова отправлено. Ожидайте завершения заказа со стороны заказчика."
      work={work}
    />
  );
};
