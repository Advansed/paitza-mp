import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Check } from 'lucide-react';
import { CargoInfo, CargoStatus } from '../../../Store/cargoStore';
import {
  cargoStatusLabel,
  getCargoProgressSlots,
  resolveCargoProgressStatus,
} from '../cargoStatusFlow';
import styles from './CargoStatusTimeline.module.css';

type CargoStatusTimelineProps = {
  cargo: CargoInfo;
};

export const CargoStatusTimeline: React.FC<CargoStatusTimelineProps> = ({ cargo }) => {
  const { t } = useTranslation('works');
  const current = resolveCargoProgressStatus(cargo);
  const isProblems = current === CargoStatus.PROBLEMS;
  const slots = isProblems ? [] : getCargoProgressSlots(current);

  return (
    <section className={styles.wrap} aria-label={t('tripStatus')}>
      <div className={styles.head}>
        <p className={styles.title}>{t('tripStatus')}</p>
        {!isProblems && (
          <span className={styles.pill}>{cargoStatusLabel(current)}</span>
        )}
      </div>

      {isProblems ? (
        <div className={styles.rejectedBanner}>
          <AlertTriangle size={16} strokeWidth={2} />
          <span>{t('problems', { ns: 'cargos' })}</span>
        </div>
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
                  {done || (active && current === CargoStatus.COMPLETED) ? (
                    <Check size={14} strokeWidth={2.5} />
                  ) : (
                    <span className={styles.dotMark} />
                  )}
                </span>
                <span className={styles.stepLabel}>{cargoStatusLabel(slot.status)}</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};
