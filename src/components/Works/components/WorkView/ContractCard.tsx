import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { WorkInfo } from '../../types';
import { WorkActionPanel } from './WorkActionPanel';
import styles from './CounterOffer.module.css';

interface ContractCardProps {
  work: WorkInfo;
  onSignContract: () => void;
}

export const ContractCard: React.FC<ContractCardProps> = ({ work, onSignContract }) => {
  return (
    <WorkActionPanel
      title="Подписать договор"
      hint="Предложение принято. Подпишите договор со своей стороны."
      work={work}
      aside={
        <aside className={styles.secure}>
          <ShieldCheck size={22} strokeWidth={2} className={styles.secureIcon} />
          <div>
            <h4 className={styles.secureTitle}>Безопасная оплата через платформу</h4>
            <p className={styles.secureText}>
              Все платежи проходят через специальный эскроу-счёт приложения. Комиссия платформы 5%
              обеспечивает защиту обеих сторон и гарантию выполнения сделки.
            </p>
          </div>
        </aside>
      }
      action={{ label: 'Подписать договор', onClick: onSignContract }}
    />
  );
};
