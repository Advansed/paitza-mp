// src/components/DataEditor/fields/ImageField.tsx
import React, { useState } from "react";
import { IonButton, IonIcon, IonModal } from "@ionic/react";
import { cameraOutline, trashOutline, closeOutline, cameraReverseOutline, apertureOutline } from "ionicons/icons";
import styles from './ImageField.module.css';
import { takePicture } from "../../Files";

// TODO: Добавить функцию toTIFF позже

interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  validate?: boolean;
}


export const ImageField: React.FC<ImageFieldProps> = ({
  label,
  value = '',
  onChange,
  placeholder = "Добавить изображение",
  disabled = false,
  error
}) => {
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  async function handleAddPhoto() {
    if (disabled) return;
    
    setLoading(true);
    try {
      const photo = await takePicture();
      if (photo?.dataUrl) {
        onChange(photo.dataUrl);
      }
    } catch (error) {
      console.error("Ошибка добавления фото:", error);
    } finally {
      setLoading(false);
    }
  }

  function removeImage() {
    if (disabled) return;
    onChange('');
  }

  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <div className={`${styles.imageWrapper} ${error ? styles.wrapperError : ''}`}>
        
        {/* Превью изображения */}
        {value && (
          <div className={styles.imageContainer}>
            <img 
              src={value} 
              alt={label}
              className={styles.imagePreview}
              onClick={() => !disabled && setModalOpen(true)}
            />
            {!disabled && (
              <IonButton
                size="small"
                fill="clear"
                className={styles.removeButton}
                onClick={removeImage}
              >
                <IonIcon icon={trashOutline} />
              </IonButton>
            )}
          </div>
        )}

        {/* Кнопка добавления */}
        {(!disabled && !value) && (
          <IonButton
            fill="outline"
            className={styles.addButton}
            onClick={handleAddPhoto}
            disabled={loading}
          >
            <IonIcon icon={cameraOutline} className={styles.buttonIcon} />
            {loading ? "Загрузка..." : placeholder}
          </IonButton>
        )}

        {/* Кнопка замены */}
        {(!disabled && value) && (
          <IonButton
            fill="clear"
            size="small"
            className={styles.replaceButton}
            onClick={handleAddPhoto}
            disabled={loading}
          >
            <IonIcon icon={cameraOutline} className={styles.buttonIcon} />
            {loading ? "Загрузка..." : "Заменить"}
          </IonButton>
        )}
      </div>
      
      {error && <span className={styles.errorMessage}>{error}</span>}
      
      {/* Модальное окно просмотра */}
      <IonModal
        className={styles.modal}
        isOpen={modalOpen}
        onDidDismiss={() => setModalOpen(false)}
      >
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <div className={styles.modalTitle}>{label}</div>
            <IonButton
              fill="clear"
              onClick={() => setModalOpen(false)}
            >
              <IonIcon icon={closeOutline} />
            </IonButton>
          </div>
          <div className={styles.modalBody}>
            {value && (
              <img 
                src={value} 
                alt={label}
                className={styles.modalImage}
              />
            )}
          </div>
        </div>
      </IonModal>
    </div>
  );
};