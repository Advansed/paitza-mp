// src/components/DataEditor/fields/ImageField.tsx
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from './ImageField.module.css';
import { IonLoading, IonButton } from "@ionic/react";
import { useToast } from "../../Toast";
import SignatureCanvas from 'react-signature-canvas';

// TODO: Добавить функцию toTIFF позже

interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (value: any) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  validate?: boolean;
}

export const SignField: React.FC<ImageFieldProps> = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  disabled, 
  error, 
  validate 
}) => {
  const { t } = useTranslation('common');
  const signatureRef = useRef<SignatureCanvas>(null);
  
  const toast = useToast();

  // Обработчик изменения подписи
  const handleSignatureEnd = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const dataURL = signatureRef.current.toDataURL('image/png');
      onChange([{dataUrl: dataURL, format: "png"}]);
    }
  };

  // Очистка подписи
  const handleClearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      onChange('');
    }
  };

  // Если есть значение, устанавливаем подпись
  useEffect(() => {
    if (value && signatureRef.current && signatureRef.current.isEmpty()) {
      // Здесь можно добавить логику для загрузки существующей подписи
      // Например, если value является dataURL
    }
  }, [value]);

  return (
    <>
      <div className={styles.container}>
        {label && <label className={styles.label}>{label}</label>}
        
        <div className={styles.signatureContainer}>
          <SignatureCanvas
            ref           = {signatureRef}
            penColor      = "black"
            canvasProps   = {{
              className:  styles.signatureCanvas,
              width:      500,
              height:     200
            }}
            onEnd         = { handleSignatureEnd }
            clearOnResize = { false }
          />
        </div>

        <div className={styles.controls}>
          <IonButton 
            size="small" 
            onClick={handleClearSignature}
            disabled={disabled}
          >
            {t('clear')}
          </IonButton>
        </div>

        {placeholder && !value && (
          <div className={styles.placeholder}>{placeholder}</div>
        )}

        {error && <div className={styles.error}>{error}</div>}
      </div>
    </>
  );
};