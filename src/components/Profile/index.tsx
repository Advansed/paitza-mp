import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Profile.module.css';
import { useProfile } from './useProfile';
import { GeneralInfo } from '../Settings/components/GeneralInfo';
import { OrganizationEditPage } from '../Settings/components/OrganizationEditPage';
import { useLoginStore } from '../../Store/loginStore';
import { useToast } from '../Toast';
import { uploadProfilePhoto } from '../../utils/fileUpload';

/** Профиль — персональные данные и организация. Транспорт — в /vehicles. */
export const Profile: React.FC = () => {
  const { t } = useTranslation('settings');
  const { image, name, phone, email, setUser } = useProfile();
  const personalDataConsent = useLoginStore((s) => s.agreements.personalData);
  const toast = useToast();
  const [photoLoading, setPhotoLoading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!personalDataConsent) {
      e.target.value = '';
      return;
    }

    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.match(/^image\/(png|jpg|jpeg|webp)$/)) {
      toast.error(t('photoType'));
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      toast.error(t('photoSize'));
      return;
    }

    setPhotoLoading(true);
    try {
      const { filePath } = await uploadProfilePhoto(file);
      if (!filePath) {
        throw new Error('Сервер не вернул filePath');
      }
      await setUser({ image: filePath });
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : t('photoFailed'));
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleGeneralInfoSave = async (data: {
    name: string;
    phone: string;
    email: string;
    additionalPhone: string;
    phoneOnlyForRegistration: boolean;
    displayAdditionalAsPrimary: boolean;
  }) => {
    await setUser({
      name: data.name,
      phone: data.phone,
      email: data.email,
    });
  };

  return (
    <div className={styles.profileContainer}>
      <div className={styles.content}>
        <GeneralInfo
          image={image}
          name={name}
          phone={phone}
          email={email}
          photoLoading={photoLoading}
          onImageUpload={handleImageUpload}
          onSave={handleGeneralInfoSave}
        />
        <OrganizationEditPage />
      </div>
    </div>
  );
};
