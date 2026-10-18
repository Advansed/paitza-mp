// src/components/ReconnectToServerForm/ReconnectToServerForm.tsx

import React from 'react';
import { useTranslation } from 'react-i18next';
import { IonIcon, IonButton } from '@ionic/react';
import { 
  cloudOfflineOutline, 
  refreshOutline, 
  serverOutline,
  wifiOutline 
} from 'ionicons/icons';
import styles from './ReconnectToServerForm.module.css';

interface ReconnectToServerFormProps {
  isConnecting: boolean;
  error: string | null;
  onRetry: () => void;
  overlay?: boolean;
}

export const ReconnectToServerForm: React.FC<ReconnectToServerFormProps> = ({ 
  isConnecting, 
  error, 
  onRetry,
  overlay = false,
}) => {
  const { t } = useTranslation('common');
  return (
    <div
      className={`${styles.container} ${overlay ? styles.overlay : ''}`}
      role={overlay ? 'alertdialog' : undefined}
      aria-modal={overlay || undefined}
      aria-labelledby="reconnect-title"
    >
      <div className={styles.card}>
        
        {/* Иконка */}
        <div className={styles.iconContainer}>
          {isConnecting ? (
            <IonIcon 
              icon={wifiOutline} 
              className={`${styles.icon} ${styles.connecting}`} 
            />
          ) : (
            <IonIcon 
              icon={cloudOfflineOutline} 
              className={`${styles.icon} ${styles.disconnected}`} 
            />
          )}
        </div>

        {/* Заголовок */}
        <h1 id="reconnect-title" className={styles.title}>
          {isConnecting ? t('connecting') : t('offline')}
        </h1>

        {/* Сообщение */}
        <p className={styles.message}>
          {isConnecting ? t('connectingHint') : t('offlineHint')}
        </p>

        {/* Ошибка */}
        {error && !isConnecting && (
          <div className={styles.error}>
            <IonIcon icon={serverOutline} />
            <span>{error}</span>
          </div>
        )}

        {/* Прогресс при подключении */}
        {isConnecting && (
          <div className={styles.progress}>
            <div className={styles.progressBar}></div>
          </div>
        )}

        {/* Кнопка повтора */}
        {!isConnecting && (
          <IonButton 
            expand="block" 
            size="large"
            onClick={onRetry}
            className={styles.retryButton}
          >
            <IonIcon icon={refreshOutline} slot="start" />
            {t('retry')}
          </IonButton>
        )}

        {/* Информация */}
        <div className={styles.info}>
          <p>{t('checkTitle')}</p>
          <ul>
            <li>{t('checkNet')}</li>
            <li>{t('checkServer')}</li>
            <li>{t('checkFirewall')}</li>
          </ul>
        </div>

      </div>
    </div>
  );
};
