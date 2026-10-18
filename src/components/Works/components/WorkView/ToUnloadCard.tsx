import React from 'react';
import { WorkInfo } from '../../types';
import { WorkActionPanel } from './WorkActionPanel';

interface ToUnloadCardProps {
  work: WorkInfo;
}

export const ToUnloadCard: React.FC<ToUnloadCardProps> = ({ work }) => {
  return (
    <WorkActionPanel
      title="Доставлено"
      hint="Транспорт прибыл на место выгрузки. Ожидайте начала разгрузки."
      work={work}
    />
  );
};
