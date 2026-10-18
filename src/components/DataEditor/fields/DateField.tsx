// src/components/DataEditor/fields/DateField.tsx
import React from 'react';
import { IonIcon } from '@ionic/react';
import { calendarOutline } from 'ionicons/icons';
import styles from './DateField.module.css';

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  min?: string;
  max?: string;
  validate?: boolean;
}

export const DateField: React.FC<DateFieldProps> = ({ 
  label, 
  value, 
  onChange,
  placeholder = "ДД.ММ.ГГГГ",
  disabled = false,
  error,
  min,
  max
}) => {
  // Форматирование даты для отображения
  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('ru-RU');
    } catch {
      return dateString;
    }
  };

  // Обработчик изменения даты
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <div className={styles.dateWrapper}>
        <input 
          type="date"
          className={`${styles.dateInput} ${error ? styles.inputError : ''} ${!value ? styles.placeholder : ''}`}
          value={value || ''} 
          onChange={handleChange}
          // placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
        />
        <div className={styles.iconWrapper}>
          <IonIcon icon={calendarOutline} className={styles.icon} />
        </div>
        {value && (
          <div className={styles.displayValue}>
            {formatDateForDisplay(value)}
          </div>
        )}
      </div>
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};