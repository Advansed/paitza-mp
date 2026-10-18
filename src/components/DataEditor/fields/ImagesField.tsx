// src/components/DataEditor/fields/ImageField.tsx
import React, { useState }                            from "react";
import { IonButton, IonIcon, IonModal }               from "@ionic/react";
import { cameraOutline, trashOutline, closeOutline }  from "ionicons/icons";
import { takePicture }                                from "../../Files";
import styles                                         from './ImagesField.module.css';

// TODO: Добавить функцию toTIFF позже

interface ImagesFieldProps {
  label:        string;
  value:        string[];
  onChange:     (value: string[]) => void;
  placeholder?: string;
  disabled?:    boolean;
  error?:       string;
  maxImages?:   number;
  validate?:    boolean;
  /** Светлый текст и рамка на тёмном/зелёном фоне (Works OfferCard) */
  light?:       boolean;
}

export const ImagesField: React.FC<ImagesFieldProps> = ({
  label,
  value = [],
  onChange,
  placeholder = "Добавьте изображения",
  disabled = false,
  error,
  maxImages = 10,
  light = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [modalImage, setModalImage] = useState<string | undefined>(undefined);

  async function handleAddPhoto() {
    if (disabled || value.length >= maxImages) return;
    
    setLoading(true);
    try {
      const photo = await takePicture();
      if (photo?.dataUrl) {
        onChange([...value, photo.dataUrl]);
      }
    } catch (error) {
      console.error("Ошибка добавления фото:", error);
    } finally {
      setLoading(false);
    }
  }

  function removeImage(index: number) {
    if (disabled) return;
    const newImages = value.filter((_, i) => i !== index);
    onChange(newImages);
  }

  return (
    <div className={styles.field}>
      <label className={`${styles.label} ${light ? styles.labelLight : ''}`}>{label}</label>
      <div
        className={`${styles.imageWrapper} ${error ? styles.wrapperError : ''} ${
          light ? styles.imageWrapperLight : ''
        }`}
      >
        
        {/* Превью изображений */}
        <div className={styles.imageGrid}>
          {value.map((image, index) => (
            <div key={index} className={styles.imageItem}>
              <img 
                src={image} 
                alt={`${label} ${index + 1}`}
                className={styles.imageItem}
                onClick={() => !disabled && setModalImage(image)}
              />
              {!disabled && (
                <IonButton
                  size="small"
                  fill="clear"
                  className={styles.removeButton}
                  onClick={() => removeImage(index)}
                >
                  <IonIcon icon={trashOutline} />
                </IonButton>
              )}
            </div>
          ))}
        </div>

        {/* Кнопка добавления */}
        {(!disabled && value.length < maxImages) && (
          <IonButton
            fill="outline"
            className={`${styles.addButton} ${light ? styles.addButtonLight : ''}`}
            onClick={handleAddPhoto}
            disabled={loading}
          >
            <IonIcon icon={cameraOutline} className={styles.buttonIcon} />
            {loading ? "Загрузка..." : placeholder}
          </IonButton>
        )}

        {/* Счетчик изображений */}
        {value.length > 0 && (
          <div className={`${styles.counter} ${light ? styles.counterLight : ''}`}>
            {value.length} из {maxImages}
          </div>
        )}
      </div>
      
      {error && <span className={styles.errorMessage}>{error}</span>}
      
      {/* Модальное окно просмотра */}
      <IonModal
        className={styles.modal}
        isOpen={modalImage !== undefined}
        onDidDismiss={() => setModalImage(undefined)}
      >
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <div className={styles.modalTitle}>{label}</div>
            <IonButton
              fill="clear"
              onClick={() => setModalImage(undefined)}
            >
              <IonIcon icon={closeOutline} />
            </IonButton>
          </div>
          <div className={styles.modalBody}>
            {modalImage && (
              <img 
                src={modalImage} 
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