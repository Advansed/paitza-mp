import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IonIcon, IonButton, IonCheckbox } from '@ionic/react';
import { personOutline, cameraOutline } from 'ionicons/icons';
import styles from '../../Profile/Profile.module.css';
import { useAgreements } from '../../ProfileOld/components/Agreements/useAgreements';
import { useProfile } from '../../Profile/useProfile';
import { useToast } from '../../Toast';
import { useResolvedImageSrc } from '../../../utils/fileUpload';
import { PersonalDataAgreementModal } from './PersonalDataAgreementModal';

interface GeneralInfoProps {
  image: string | null;
  name: string;
  phone: string;
  email: string;
  photoLoading?: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: (data: {
    name: string;
    phone: string;
    email: string;
    additionalPhone: string;
    phoneOnlyForRegistration: boolean;
    displayAdditionalAsPrimary: boolean;
  }) => Promise<void>;
}

export const GeneralInfo: React.FC<GeneralInfoProps> = ({
  image,
  name: initialName,
  phone: initialPhone,
  email: initialEmail,
  photoLoading = false,
  onImageUpload,
  onSave,
}) => {
  const { t } = useTranslation('settings');
  const { agreements, toggleAgreement, isLoading } = useAgreements();
  const { setUser: saveProfile } = useProfile();
  const toast = useToast();
  const imageSrc = useResolvedImageSrc(image);
  const [pdModalOpen, setPdModalOpen] = useState(false);
  const [consentBusy, setConsentBusy] = useState(false);

  const fieldsLocked = !agreements.personalData || isLoading || consentBusy;
  const photoLocked = fieldsLocked || photoLoading;

  const [formData, setFormData] = useState({
    name: initialName,
    phone: initialPhone,
    email: initialEmail,
    additionalPhone: '',
    phoneOnlyForRegistration: false,
    displayAdditionalAsPrimary: false,
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      name: initialName || prev.name,
      phone: initialPhone || prev.phone,
      email: initialEmail || prev.email,
    }));
  }, [initialName, initialPhone, initialEmail]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!agreements.personalData) {
      toast.info(t('needConsent'));
      return;
    }
    await onSave(formData);
  };

  const anonymizedPayload = {
    name: '',
    phone: '',
    email: '',
    image: '',
  };

  const handlePersonalDataCheckbox = async (checked: boolean) => {
    if (checked === agreements.personalData || isLoading || consentBusy) return;

    if (!checked && agreements.personalData) {
      setConsentBusy(true);
      try {
        const ok = await saveProfile(anonymizedPayload);
        if (!ok) {
          toast.error(t('deleteFailed'));
          return;
        }
        setFormData((prev) => ({
          ...prev,
          name: '',
          phone: '',
          email: '',
          additionalPhone: '',
          phoneOnlyForRegistration: false,
          displayAdditionalAsPrimary: false,
        }));
        toggleAgreement('personalData');
      } finally {
        setConsentBusy(false);
      }
      return;
    }

    toggleAgreement('personalData');
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <div className={styles.cardIcon} aria-hidden>
          <IonIcon icon={personOutline} />
        </div>
        <div>
          <h3 className={styles.cardTitle}>{t('personalTitle')}</h3>
          <p className={styles.cardSub}>{t('personalSub')}</p>
        </div>
      </div>

      <div className={styles.photoSection}>
        <div className={styles.photoPlaceholder}>
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={t('photoAlt')}
              className={styles.profileImage}
            />
          ) : (
            <IonIcon icon={personOutline} className={styles.photoIcon} />
          )}
        </div>
        <div className={styles.uploadSection}>
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={onImageUpload}
            id="photo-upload"
            className={styles.fileInput}
            disabled={photoLocked}
          />
          <IonButton
            color="primary"
            fill="outline"
            className={styles.uploadButton}
            disabled={photoLocked}
            onClick={() => {
              if (photoLocked) return;
              document.getElementById('photo-upload')?.click();
            }}
          >
            <IonIcon icon={cameraOutline} slot="start" />
            {photoLoading
              ? t('loading', { ns: 'common' })
              : image
                ? t('replacePhoto')
                : t('uploadPhoto')}
          </IonButton>
          <p className={styles.uploadInfo}>{t('photoHint')}</p>
        </div>
      </div>

      <div className={styles.formFields}>
        <div className={styles.field}>
          <label className={styles.label}>{t('fullName')}</label>
          <input
            type="text"
            className={styles.input}
            value={formData.name}
            disabled={fieldsLocked}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder={t('fullNamePh')}
          />
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.label}>{t('phone', { ns: 'drivers' })}</label>
            <input
              type="tel"
              className={styles.input}
              value={formData.phone}
              disabled={fieldsLocked}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+7 …"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              className={styles.input}
              value={formData.email}
              disabled={fieldsLocked}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="name@email.com"
            />
          </div>
        </div>

        <div className={styles.checkboxWrapper}>
          <IonCheckbox
            checked={formData.phoneOnlyForRegistration}
            disabled={fieldsLocked}
            onIonChange={(e) =>
              handleInputChange('phoneOnlyForRegistration', e.detail.checked)
            }
          />
          <label className={styles.checkboxLabel}>
            {t('hidePhone')}
          </label>
        </div>

        <div className={styles.sectionDivider}>
          <p className={styles.sectionLabel}>{t('extraContact')}</p>
          <div className={styles.field}>
            <label className={styles.label}>{t('extraPhone')}</label>
            <input
              type="tel"
              className={styles.input}
              value={formData.additionalPhone}
              disabled={fieldsLocked}
              onChange={(e) => handleInputChange('additionalPhone', e.target.value)}
              placeholder="+7 …"
            />
          </div>
          <div className={styles.checkboxWrapper}>
            <IonCheckbox
              checked={formData.displayAdditionalAsPrimary}
              disabled={fieldsLocked}
              onIonChange={(e) =>
                handleInputChange('displayAdditionalAsPrimary', e.detail.checked)
              }
            />
            <label className={styles.checkboxLabel}>
              {t('showAsPrimary')}
            </label>
          </div>
        </div>
      </div>

      <div className={styles.consentBlock}>
        <div className={styles.checkboxWrapper}>
          <IonCheckbox
            checked={agreements.personalData}
            disabled={isLoading || consentBusy}
            onIonChange={(e) => void handlePersonalDataCheckbox(e.detail.checked)}
          />
          <div className={styles.consentCheckboxText}>
            <span className={styles.checkboxLabel}>
              {t('pdConsent')}
            </span>
            <button
              type="button"
              className={styles.consentTextLink}
              onClick={() => setPdModalOpen(true)}
            >
              {t('consentText')}
            </button>
          </div>
        </div>
      </div>

      <PersonalDataAgreementModal isOpen={pdModalOpen} onClose={() => setPdModalOpen(false)} />

      <div className={styles.cardFooter}>
        <IonButton
          color="primary"
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={isLoading || consentBusy || !agreements.personalData}
        >
          {t('save', { ns: 'common' })}
        </IonButton>
      </div>
    </div>
  );
};
