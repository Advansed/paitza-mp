import React from 'react';
import styles from './TextField.module.css';

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  type?: 'text' | 'email' | 'password' | 'tel';
  validate?: boolean;

}

export const TextField: React.FC<TextFieldProps> = ({ 
  label, 
  value, 
  onChange,
  placeholder = "",
  disabled = false,
  error,
  type = 'text'
}) => {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <input 
        type={type}
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={disabled}
      />
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};
