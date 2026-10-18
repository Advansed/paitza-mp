import React from 'react';
import { useTranslation } from 'react-i18next';
import { IonModal } from '@ionic/react';
import { Building2, X } from 'lucide-react';
import styles from './OrganizationRequiredModal.module.css';

type OrganizationRequiredModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onGoProfile: () => void;
};

export const OrganizationRequiredModal: React.FC<OrganizationRequiredModalProps> = ({
  isOpen,
  onClose,
  onGoProfile,
}) => {
  const { t } = useTranslation('works');
  return (
  <IonModal isOpen={isOpen} onDidDismiss={onClose} backdropDismiss={false} className={styles.modal}>
    <div className={styles.shell}>
      <div className={styles.head}>
        <div>
          <div className={styles.kicker}>{t('orgKicker')}</div>
          <h2 className={styles.title}>{t('orgTitle')}</h2>
        </div>
        <button type="button" className={styles.close} onClick={onClose} aria-label={t('close', { ns: 'common' })}>
          <X size={20} strokeWidth={2} />
        </button>
      </div>
      <div className={styles.body}>
        <div className={styles.iconWrap} aria-hidden>
          <Building2 size={22} strokeWidth={2} />
        </div>
        <p className={styles.text}>{t('orgText')}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>
            {t('back', { ns: 'common' })}
          </button>
          <button type="button" className={styles.submit} onClick={onGoProfile}>
            {t('orgGo')}
          </button>
        </div>
      </div>
    </div>
  </IonModal>
  );
};
