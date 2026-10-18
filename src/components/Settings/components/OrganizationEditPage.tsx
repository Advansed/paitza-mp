import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { IonCheckbox, IonIcon } from '@ionic/react';
import { businessOutline } from 'ionicons/icons';
import { CustomerInfo } from './CustomerInfo';
import { useProfile } from '../useProfile';
import styles from '../../Profile/Profile.module.css';
import { useAgreements } from '../../ProfileOld/components/Agreements/useAgreements';
import { EscrowAgreement } from '../../ProfileOld/components/Agreements/Escrow';
import type { CompanyData } from '../../../Store/companyStore';

export const OrganizationEditPage: React.FC = () => {
  const { t } = useTranslation('settings');
  const history = useHistory();
  const { companyData, updateCompany } = useProfile();
  const { agreements, saveAgreement, isLoading } = useAgreements();
  const [isEscrowOpen, setIsEscrowOpen] = useState(false);

  const isOrganizationFilled = (data: Partial<CompanyData> | null | undefined) => {
    if (!data) return false;
    return Boolean(
      data.tax_number ||
        data.name ||
        data.basis ||
        data.description ||
        data.local_bank_code ||
        data.bank_name ||
        data.bank_account ||
        data.iban ||
        data.swift_bic ||
        data.intermediary_bank_account ||
        data.address ||
        data.postal_address
    );
  };

  const organizationFilled = useMemo(() => isOrganizationFilled(companyData), [companyData]);

  useEffect(() => {
    if (organizationFilled && !agreements.escrow && !isLoading) {
      saveAgreement('escrow', true);
    }
  }, [agreements.escrow, isLoading, organizationFilled, saveAgreement]);

  const handleSaveCompany = async (data: Partial<CompanyData>) => {
    const nextCompany = { ...(companyData || {}), ...data };
    const nextFilled = isOrganizationFilled(nextCompany);

    if (nextFilled || agreements.escrow) {
      saveAgreement('escrow', true);
    }

    await updateCompany(data);
  };

  const escrowConsent = (
    <div className={`${styles.consentBlock} ${styles.consentBlockTop}`}>
      <div className={styles.checkboxWrapper}>
        <IonCheckbox
          checked={Boolean(agreements.escrow)}
          disabled={isLoading || organizationFilled}
          onIonChange={(event) => {
            if (organizationFilled) return;
            saveAgreement('escrow', Boolean(event.detail.checked));
          }}
        />
        <div className={styles.consentCheckboxText}>
          <span className={styles.checkboxLabel}>{t('escrowConsent')}</span>
          <button
            type="button"
            className={styles.consentTextLink}
            onClick={() => setIsEscrowOpen(true)}
          >
            {t('openContract')}
          </button>
        </div>
      </div>
      {organizationFilled && (
        <p className={styles.hintText}>
          {t('escrowAuto')}
        </p>
      )}
    </div>
  );

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <div className={styles.cardIcon} aria-hidden>
          <IonIcon icon={businessOutline} />
        </div>
        <div>
          <h3 className={styles.cardTitle}>{t('orgCard')}</h3>
          <p className={styles.cardSub}>{t('orgCardSub')}</p>
        </div>
      </div>

      <CustomerInfo
        embedded
        companyData={companyData}
        onSave={handleSaveCompany}
        consentSlot={escrowConsent}
        footerSlot={
          companyData?.is_verified ? (
            <div className={`${styles.verifiedStatus} ${styles.verifiedStatusOk}`}>
              <ShieldCheck size={16} strokeWidth={2} aria-hidden />
              <span>{t('orgVerified')}</span>
            </div>
          ) : (
            <div className={styles.verifiedStatus}>
              <span>
                {t('orgVerifyHint')}
              </span>
              <button
                type="button"
                className={styles.consentTextLink}
                onClick={() => history.push('/finance')}
              >
                {t('topUp', { ns: 'finance' })}
              </button>
            </div>
          )
        }
      />

      <EscrowAgreement isOpen={isEscrowOpen} onClose={() => setIsEscrowOpen(false)} />
    </div>
  );
};
