import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import agreementStyles from '../../ProfileOld/components/Agreements/Agreements.module.css';
import EULA from '../../ProfileOld/components/Agreements/eula';
import Signs from '../../ProfileOld/components/Agreements/Signs';
import Oferta from '../../ProfileOld/components/Agreements/Oferta';
import { useAgreements } from '../../ProfileOld/components/Agreements/useAgreements';
import settingsStyles from '../Settings.module.css';

/**
 * Пользовательское соглашение (с вложенными документами) и маркетинг — логика и модалки из ProfileOld.
 */
export const SettingsAgreementsSection: React.FC = () => {
  const { t } = useTranslation('settings');
  const { agreements, toggleAgreement, isLoading } = useAgreements();
  const [isEulaOpen, setIsEulaOpen] = useState(false);
  const [isSignOpen, setIsSignOpen] = useState(false);
  const [isOferta, setIsOferta] = useState(false);

  const handleUserAgreementOpen = () => {
    setIsEulaOpen(true);
  };

  return (
    <>
      <div className={settingsStyles.agreementsEmbed}>
        <div className={agreementStyles.content}>
          <div className={`${agreementStyles.agreementItem} ${isLoading ? agreementStyles.disabled : ''}`}>
            <div
              className={`${agreementStyles.checkbox} ${agreements.userAgreement ? agreementStyles.checked : agreementStyles.unchecked}`}
              onClick={handleUserAgreementOpen}
            >
              <div className={agreementStyles.checkIcon}>✓</div>
            </div>
            <div className={agreementStyles.agreementText}>
              <div onClick={handleUserAgreementOpen}>
                <b className="cl-blue t-underline">{t('userAgreement')}</b>
              </div>
              <div className="ml-2 mt-1" onClick={() => setIsSignOpen(true)}>
                <b className="cl-blue t-underline">— {t('pepAgreement')}</b>
              </div>

              {/* Лицензионное соглашение показываем как просмотр, без отдельной галочки */}
              <div className="ml-2 mt-1" onClick={() => setIsOferta(true)}>
                <b className="cl-blue t-underline">— {t('licenseAgreement')}</b>
              </div>
            </div>
          </div>

          <div
            className={`${agreementStyles.agreementItem} ${isLoading ? agreementStyles.disabled : ''}`}
            onClick={() => !isLoading && toggleAgreement('marketing')}
          >
            <div
              className={`${agreementStyles.checkbox} ${agreements.marketing ? agreementStyles.checked : agreementStyles.unchecked}`}
            >
              <div className={agreementStyles.checkIcon}>✓</div>
            </div>
            <div className={agreementStyles.agreementText}>{t('adsConsent')}</div>
          </div>
        </div>
      </div>

      <EULA isOpen={isEulaOpen} onClose={() => setIsEulaOpen(false)} />
      <Signs isOpen={isSignOpen} onClose={() => setIsSignOpen(false)} />
      <Oferta isOpen={isOferta} onClose={() => setIsOferta(false)} />
    </>
  );
};
