import React from 'react';
import { IonIcon } from '@ionic/react';
import { checkmarkOutline } from 'ionicons/icons';
import styles from './CheckField.module.css';

interface CheckFieldProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  error?: string;
  description?: string;
  validate?: boolean;
}

export const CheckField: React.FC<CheckFieldProps> = ({ 
  label, 
  value, 
  onChange,
  disabled = false,
  error,
  description
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      onChange(e.target.checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled) {
        onChange(!value);
      }
    }
  };

  return (
    <div className={styles.field}>
      {/* <label className={styles.label}>{label}</label> */}
      
      <div 
        className={`${styles.checkboxContainer} ${disabled ? styles.disabled : ''}`}
        tabIndex={disabled ? -1 : 0}
        onKeyDown = { handleKeyDown }
        onClick   = { ()=> onChange(!value) }
      >
        <input
          type="checkbox"
          className={styles.hiddenCheckbox}
          checked={value}
          onChange={handleChange}
          disabled={disabled}
        />
        <div className={`${styles.customCheckbox} ${value ? styles.checked : ''} ${error ? styles.error : ''}`}>
          {value && <IonIcon icon={checkmarkOutline} className={styles.checkIcon} />}
        </div>
        <span className={styles.checkboxLabel}>
          {description || label}
        </span>
      </div>

      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};