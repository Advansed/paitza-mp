import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './RoleToggle.module.css';

type RoleToggleProps = {
  userType: number;
  onChange: (userType: number) => void;
  disabled?: boolean;
};

export const RoleToggle: React.FC<RoleToggleProps> = ({ userType, onChange, disabled }) => {
  const { t } = useTranslation('common');
  return (
    <div className={styles.toggle} role="group" aria-label={t('mode', { ns: 'settings' })}>
      <button
        type="button"
        className={`${styles.btn} ${userType === 2 ? styles.active : ''}`}
        onClick={() => onChange(2)}
        disabled={disabled || userType === 2}
      >
        {t('roleExecutor')}
      </button>
      <button
        type="button"
        className={`${styles.btn} ${userType === 1 ? styles.active : ''}`}
        onClick={() => onChange(1)}
        disabled={disabled || userType === 1}
      >
        {t('roleCustomer')}
      </button>
      <button
        type="button"
        className={`${styles.btn} ${userType === 3 ? styles.active : ''}`}
        onClick={() => onChange(3)}
        disabled={disabled || userType === 3}
      >
        {t('roleDispatcher')}
      </button>
    </div>
  );
};
