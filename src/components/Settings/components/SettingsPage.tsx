import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IonIcon, IonToggle, IonButton, IonAlert } from '@ionic/react';
import {
  personOutline,
  carOutline,
  peopleOutline,
  checkmarkCircleOutline,
  documentTextOutline,
  notificationsOutline,
  volumeHighOutline,
  phonePortrait,
  lockClosedOutline,
  linkOutline,
  logOutOutline,
  trashOutline,
  chevronForwardOutline,
} from 'ionicons/icons';
import { useLogin } from '../../../Store/useLogin';
import { useToken } from '../../../Store/loginStore';
import { useSocket } from '../../../Store/useSocket';
import { useToast } from '../../Toast/useToast';
import { useProfile } from '../../Profile/useProfile';
import { useCompany } from '../../../Store/useCompany';
import { useAppPlan, useProUnlocked } from '../../../plan';
import { useHistory } from 'react-router-dom';
import styles from '../Settings.module.css';
import { SettingsAgreementsSection } from './SettingsAgreementsSection';
import { LanguageSwitcher } from '../../../i18n/LanguageSwitcher';

export interface SettingsPageProps {
  onRoleChange?: (userType: number) => void;
  onBack?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onRoleChange,
}) => {
  const { t } = useTranslation('settings');
  const { logout } = useLogin();
  const token = useToken();
  const { socket } = useSocket();
  const toast = useToast();
  const { user_type } = useProfile();
  const { setPlan } = useCompany();
  const plan = useAppPlan();
  const proUnlocked = useProUnlocked();
  const history = useHistory();

  const [pushNotifications, setPushNotifications] = useState(true);
  const [sound, setSound] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleLogout = () => {
    logout();
    history.push('/');
  };

  const deleteAccount = useCallback(() => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      if (!socket) {
        resolve({ success: false, error: t('deleteAccountError') });
        return;
      }
      let settled = false;
      const finish = (result: { success: boolean; error?: string }) => {
        if (settled) return;
        settled = true;
        socket.off('delete_account', onResponse);
        resolve(result);
      };
      const onResponse = (response: { success?: boolean; message?: string }) => {
        if (response?.success) finish({ success: true });
        else finish({ success: false, error: response?.message || t('deleteAccountError') });
      };
      socket.on('delete_account', onResponse);
      window.setTimeout(() => finish({ success: false, error: t('deleteAccountError') }), 10000);
      socket.emit('delete_account', { token });
    });
  }, [socket, t, token]);

  const handleDeleteAccount = () => {
    if (deleting) return;
    setDeleting(true);
    void deleteAccount()
      .then((result) => {
        if (!result.success) {
          toast.error(result.error || t('deleteAccountError'));
          return;
        }
        handleLogout();
      })
      .finally(() => setDeleting(false));
  };

  const handleRole = (nextType: number) => {
    if (user_type !== nextType) onRoleChange?.(nextType);
  };

  return (
    <div className={styles.content}>
        <section className={styles.section}>
          <div className={styles.cardHead}>
            <div className={styles.cardIcon} aria-hidden>
              <IonIcon icon={personOutline} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>{t('language', { ns: 'common' })}</h3>
            </div>
          </div>
          <LanguageSwitcher variant="inline" />
        </section>

        <section className={styles.section}>
          <div className={styles.cardHead}>
            <div className={styles.cardIcon} aria-hidden>
              <IonIcon icon={personOutline} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>{t('mode')}</h3>
              <p className={styles.cardSub}>{t('modeSub')}</p>
            </div>
          </div>

          <div className={styles.verifiedBadge}>
            <IonIcon icon={checkmarkCircleOutline} />
            {t('verified')}
          </div>

          <div className={styles.roleSwitcher} role="radiogroup" aria-label={t('mode')}>
            <button
              type="button"
              role="radio"
              aria-checked={user_type === 1}
              className={`${styles.roleItem} ${user_type === 1 ? styles.roleActive : ''}`}
              onClick={() => handleRole(1)}
            >
              <IonIcon icon={personOutline} className={styles.roleIcon} />
              <span className={styles.roleText}>{t('roleCustomer', { ns: 'common' })}</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={user_type === 2}
              className={`${styles.roleItem} ${user_type === 2 ? styles.roleActive : ''}`}
              onClick={() => handleRole(2)}
            >
              <IonIcon icon={carOutline} className={styles.roleIcon} />
              <span className={styles.roleText}>{t('roleDriver', { ns: 'common' })}</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={user_type === 3}
              className={`${styles.roleItem} ${user_type === 3 ? styles.roleActive : ''}`}
              onClick={() => handleRole(3)}
            >
              <IonIcon icon={peopleOutline} className={styles.roleIcon} />
              <span className={styles.roleText}>{t('roleDispatcher', { ns: 'common' })}</span>
            </button>
          </div>
          <p className={styles.instructionText}>
            {user_type === 3 ? t('hintDispatcher') : user_type === 2 ? t('hintCarrier') : t('hintCustomer')}
          </p>
        </section>

        <section className={styles.section}>
          <div className={styles.cardHead}>
            <div className={styles.cardIcon} aria-hidden>
              <IonIcon icon={checkmarkCircleOutline} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>{t('planTitle', { defaultValue: 'Тариф' })}</h3>
              <p className={styles.cardSub}>
                {t('planSub', { defaultValue: 'Basic и Pro не смешивают заявки' })}
              </p>
            </div>
          </div>
          {proUnlocked ? (
            <div className={styles.roleSwitcher} role="radiogroup" aria-label={t('planTitle', { defaultValue: 'Тариф' })}>
              <button
                type="button"
                role="radio"
                aria-checked={plan === 'basic'}
                className={`${styles.roleItem} ${plan === 'basic' ? styles.roleActive : ''}`}
                onClick={() => setPlan('basic')}
              >
                <span className={styles.roleText}>Basic</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={plan === 'pro'}
                className={`${styles.roleItem} ${plan === 'pro' ? styles.roleActive : ''}`}
                onClick={() => setPlan('pro')}
              >
                <span className={styles.roleText}>Pro</span>
              </button>
            </div>
          ) : (
            <>
              <p className={styles.instructionText}>
                {t('planLocked', { defaultValue: 'Сейчас Basic. Pro откроется после пополнения счёта.' })}
              </p>
              <IonButton expand="block" onClick={() => history.push('/finance')}>
                {t('planTopUp', { defaultValue: 'Пополнить и открыть Pro' })}
              </IonButton>
            </>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.cardHead}>
            <div className={styles.cardIcon} aria-hidden>
              <IonIcon icon={notificationsOutline} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>{t('notifications')}</h3>
              <p className={styles.cardSub}>{t('notificationsSub')}</p>
            </div>
          </div>

          <div className={styles.settingsList}>
            <div className={styles.settingItem}>
              <IonIcon icon={notificationsOutline} className={styles.settingIcon} />
              <div className={styles.settingContent}>
                <span className={styles.settingLabel}>{t('push')}</span>
                <span className={styles.settingSubtext}>{t('inApp')}</span>
              </div>
              <IonToggle
                checked={pushNotifications}
                onIonChange={(e) => setPushNotifications(e.detail.checked)}
                className={styles.toggle}
              />
            </div>
            <div className={styles.settingItem}>
              <IonIcon icon={volumeHighOutline} className={styles.settingIcon} />
              <div className={styles.settingContent}>
                <span className={styles.settingLabel}>{t('sound')}</span>
              </div>
              <IonToggle
                checked={sound}
                onIonChange={(e) => setSound(e.detail.checked)}
                className={styles.toggle}
              />
            </div>
            <div className={styles.settingItem}>
              <IonIcon icon={phonePortrait} className={styles.settingIcon} />
              <div className={styles.settingContent}>
                <span className={styles.settingLabel}>{t('vibration')}</span>
              </div>
              <IonToggle
                checked={vibration}
                onIonChange={(e) => setVibration(e.detail.checked)}
                className={styles.toggle}
              />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.cardHead}>
            <div className={styles.cardIcon} aria-hidden>
              <IonIcon icon={lockClosedOutline} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>{t('security')}</h3>
              <p className={styles.cardSub}>{t('securitySub')}</p>
            </div>
          </div>

          <div className={styles.settingsList}>
            <div className={styles.settingItem}>
              <IonIcon icon={lockClosedOutline} className={styles.settingIcon} />
              <div className={styles.settingContent}>
                <span className={styles.settingLabel}>{t('changePassword')}</span>
              </div>
              <IonIcon icon={chevronForwardOutline} className={styles.chevronIcon} />
            </div>
            <div className={styles.settingItem}>
              <IonIcon icon={linkOutline} className={styles.settingIcon} />
              <div className={styles.settingContent}>
                <span className={styles.settingLabel}>{t('devices')}</span>
              </div>
              <IonIcon icon={chevronForwardOutline} className={styles.chevronIcon} />
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.spanFull}`}>
          <div className={styles.cardHead}>
            <div className={styles.cardIcon} aria-hidden>
              <IonIcon icon={documentTextOutline} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>{t('consents')}</h3>
              <p className={styles.cardSub}>{t('consentsSub')}</p>
            </div>
          </div>
          <SettingsAgreementsSection />
        </section>

        <div className={styles.logoutSection}>
          <IonButton color="danger" className={styles.logoutButton} onClick={handleLogout}>
            <IonIcon icon={logOutOutline} slot="start" />
            {t('logout')}
          </IonButton>
          <IonButton
            fill="outline"
            color="danger"
            className={styles.deleteAccountButton}
            disabled={deleting}
            onClick={() => setConfirmDelete(true)}
          >
            <IonIcon icon={trashOutline} slot="start" />
            {t('deleteAccount')}
          </IonButton>
        </div>

        <IonAlert
          isOpen={confirmDelete}
          onDidDismiss={() => setConfirmDelete(false)}
          header={t('deleteAccountHeader')}
          message={t('deleteAccountMessage')}
          buttons={[
            { text: t('cancel', { ns: 'common' }), role: 'cancel' },
            {
              text: t('deleteAccountConfirm'),
              role: 'destructive',
              handler: handleDeleteAccount,
            },
          ]}
        />
    </div>
  );
};
