import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { WorkInfo, WorkStatus } from '../../types';
import {
  getOrderProgressSlots,
  normalizeWorkStatus,
  workStatusLabel,
} from '../../statusFlow';
import styles from './StatusTimeline.module.css';

type StatusTimelineProps = {
  work: WorkInfo;
};

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ work }) => {
  const { t } = useTranslation('works');
  const current = normalizeWorkStatus(work.status);
  const isRejected = current === WorkStatus.REJECTED;
  const slots = isRejected ? [] : getOrderProgressSlots(current);

  return (
    <section className={styles.wrap} aria-label={t('tripStatus')}>
      <div className={styles.head}>
        <p className={styles.title}>{t('tripStatus')}</p>
        {!isRejected && (
          <span className={styles.pill}>{workStatusLabel(current)}</span>
        )}
      </div>

      {isRejected ? (
        <div className={styles.rejectedBanner}>{t('rejected')}</div>
      ) : (
        <ol className={`${styles.track} ${slots.length >= 6 ? styles.dense : ''}`}>
          {slots.map((slot, offset) => {
            if (slot.type === 'ellipsis') {
              return (
                <li key="ellipsis" className={`${styles.step} ${styles.gap}`}>
                  {offset > 0 && <span className={styles.connector} aria-hidden />}
                  <span className={styles.dot} aria-hidden>
                    …
                  </span>
                  <span className={styles.stepLabel}>…</span>
                </li>
              );
            }

            const done = slot.role === 'prev';
            const active = slot.role === 'current';
            return (
              <li
                key={`${slot.role}-${slot.status}`}
                className={[
                  styles.step,
                  done ? styles.done : '',
                  active ? styles.active : '',
                  !done && !active ? styles.upcoming : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {offset > 0 && (
                  <span
                    className={`${styles.connector} ${done || active ? styles.connectorOn : ''}`}
                    aria-hidden
                  />
                )}
                <span className={styles.dot} aria-hidden>
                  {done || (active && current === WorkStatus.COMPLETED) ? (
                    <Check size={14} strokeWidth={2.5} />
                  ) : (
                    <span className={styles.dotMark} />
                  )}
                </span>
                <span className={styles.stepLabel}>{workStatusLabel(slot.status)}</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};
