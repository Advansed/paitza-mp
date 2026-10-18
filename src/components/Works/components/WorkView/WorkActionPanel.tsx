import React from 'react';
import { WorkInfo } from '../../types';
import styles from './CounterOffer.module.css';

type WorkActionPanelProps = {
  title: string;
  hint: string;
  work: WorkInfo;
  children?: React.ReactNode;
  aside?: React.ReactNode;
  error?: string;
  action?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
};

export const WorkActionPanel: React.FC<WorkActionPanelProps> = ({
  title,
  hint,
  work,
  children,
  aside,
  error,
  action,
}) => {
  const price = work.currentOffer?.price ?? work.price;
  const weight = work.currentOffer?.weight ?? work.weight;
  const volume = work.currentOffer?.volume ?? work.volume;
  const priceLabel = price.toLocaleString('ru-RU').replace(/,/g, ' ');

  return (
    <div className={styles.root}>
      <section className={styles.formCard}>
        <h3 className={styles.formTitle}>{title}</h3>
        <p className={styles.formHint}>{hint}</p>
        <div className={styles.fields}>
          <label className={styles.field}>
            <span>Цена (₽)</span>
            <div className={styles.readonlyValue}>{priceLabel}</div>
          </label>
          <label className={styles.field}>
            <span>Вес (т)</span>
            <div className={styles.readonlyValue}>{weight.toFixed(1)}</div>
          </label>
          <label className={styles.field}>
            <span>Объём (м³)</span>
            <div className={styles.readonlyValue}>{volume.toFixed(1)}</div>
          </label>
        </div>
        {children}
      </section>
      {aside}
      {error && <div className={styles.error}>{error}</div>}
      {action && (
        <button
          type="button"
          className={styles.submitBtn}
          onClick={action.onClick}
          disabled={action.disabled}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
