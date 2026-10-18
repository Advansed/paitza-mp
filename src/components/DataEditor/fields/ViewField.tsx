import React from 'react';
import styles from './TextField.module.css';

interface ViewFieldProps {
  label:        string;
  value:        string;
  onChange:     (value: string) => void;
  placeholder?: string;
  disabled?:    boolean;
  error?:       string;
  type?:        'text' | 'email' | 'password' | 'tel';
  validate?:    boolean;

}

export const ViewField: React.FC<ViewFieldProps> = ({ 
  label, 
  value
}) => {
  return (
    <div className={styles.field}>
        <label className={styles.label}>{label}</label>
        <div 
            className={`${styles.input}`}
        > 
            { value || '' }
        </div>
    </div>
  );
};
