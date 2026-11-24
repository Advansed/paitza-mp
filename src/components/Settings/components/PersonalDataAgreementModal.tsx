import React from 'react';
import { IonButton, IonContent, IonHeader, IonIcon, IonModal, IonTitle, IonToolbar } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { consentDocument } from '../../../pages/Privacy/consentContent';
import { PrivacyDocument } from '../../../pages/Privacy/PrivacyDocument';

interface PersonalDataAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PersonalDataAgreementModal: React.FC<PersonalDataAgreementModalProps> = ({
  isOpen,
  onClose
}) => {
  const { t, i18n } = useTranslation();
  const content = consentDocument(i18n.resolvedLanguage || i18n.language);

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{content.title}</IonTitle>
          <IonButton fill="clear" slot="end" onClick={onClose}>
            <IonIcon icon={closeOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <PrivacyDocument content={content} />
        <div style={{ marginTop: '1.5rem' }}>
          <IonButton expand="block" onClick={onClose}>
            {t('close')}
          </IonButton>
        </div>
      </IonContent>
    </IonModal>
  );
};
