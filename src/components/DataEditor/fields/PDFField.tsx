// PdfField.tsx
import React, { useState } from "react";
import { IonButton, IonIcon, IonModal, IonSpinner } from "@ionic/react";
import { documentOutline, trashOutline, closeOutline, downloadOutline } from "ionicons/icons";
import { PDFDoc, takePicture } from "../../Files";
import styles from './PDFField.module.css';

interface PdfFieldProps {
  label:            string;
  value:            string;
  onChange:         (value: string) => void;
  placeholder?:     string;
  disabled?:        boolean;
  error?:           string;
  validate?:        boolean;
}

export const PdfField: React.FC<PdfFieldProps> = ({
  label,
  value = '',
  onChange,
  placeholder = "Добавить PDF документ",
  disabled = false,
  error
}) => {
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  async function handleAddPdf() {
    if (disabled) return;
    
    setLoading(true);
    try {
      // Здесь должна быть логика выбора PDF файла
      // Временно используем ту же функцию takePicture, но нужно заменить на файловый пикер
      const file = await takePicture();
      if (file?.dataUrl) {
        onChange(file.dataUrl);
      }
    } catch (error) {
      console.error("Ошибка добавления PDF:", error);
    } finally {
      setLoading(false);
    }
  }

  function removePdf() {
    if (disabled) return;
    onChange('');
  }

  const handleDownload = () => {
    if (value) {
      const link = document.createElement('a');
      link.href = value;
      link.download = `${label}.pdf`;
      link.click();
    }
  };

  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <div className={`${styles.pdfWrapper} ${error ? styles.wrapperError : ''}`}>
        
        {/* Превью PDF */}
        {value && (
          <div className={styles.pdfContainer}>
            <div 
              className={styles.pdfPreview}
              onClick={() => !disabled && setModalOpen(true)}
            >
              <IonIcon icon={documentOutline} className={styles.pdfIcon} />
              <span className={styles.pdfText}>PDF документ</span>
            </div>
            
            {!disabled && (
              <div className={styles.actions}>
                <IonButton
                  size="small"
                  fill="clear"
                  className={styles.downloadButton}
                  onClick={handleDownload}
                >
                  <IonIcon icon={downloadOutline} />
                </IonButton>
              </div>
            )}
          </div>
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
          <div className="w-auto h-auto">
            {value ? (
                <PDFDoc  url = { value } onClose = { () => setModalOpen( false )} />              
            ) : (
              <div className={styles.noPdf}>
                <IonIcon icon={documentOutline} className={styles.noPdfIcon} />
                <p>PDF документ не загружен</p>
              </div>
            )}
          </div>
        </div>
      </IonModal>
    </div>
  );
};