import React from 'react';
import styles from './NumberField.module.css';

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
  validate?: boolean;
}

export const NumberField: React.FC<NumberFieldProps> = ({ 
  label, 
  value, 
  onChange,
  placeholder = "",
  disabled = false,
  error,
  min,
  max,
  step = 1
}) => {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <input 
        type="number" 
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        value={value || ''} 
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
      />
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};
