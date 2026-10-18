import React, { lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { Redirect, useHistory, useLocation, useParams } from 'react-router-dom';
import { useUserType } from '../Store/loginStore';
import { isDispatcher, isExecutorRole } from '../Store/roles';
import { PanelFrame } from '../layout/PanelFrame';
import panelStyles from '../layout/PanelFrame.module.css';

const Cargos = lazy(() => import('../components/Cargos').then((m) => ({ default: m.Cargos })));
const Works = lazy(() => import('../components/Works').then((m) => ({ default: m.Works })));
const DriversPage = lazy(() =>
  import('../components/Drivers/DriversPage').then((m) => ({ default: m.DriversPage })),
);
const Chats = lazy(() => import('../components/Chats/Chats'));
const ChatsList = lazy(() =>
  import('../components/Chats/ChatsList').then((m) => ({ default: m.ChatsList })),
);
const Settings = lazy(() => import('../components/Settings').then((m) => ({ default: m.Settings })));
const Profile = lazy(() => import('../components/Profile').then((m) => ({ default: m.Profile })));
const WalletPage = lazy(() =>
  import('../components/Settings/components/WalletPage').then((m) => ({ default: m.WalletPage })),
);
const TransportEditPage = lazy(() =>
  import('../components/Settings/components/TransportEditPage').then((m) => ({ default: m.TransportEditPage })),
);
/** Лента заказов */
export const FeedPage: React.FC = () => {
  const { user_type } = useUserType();

  if (isExecutorRole(user_type)) {
    return (
      <div className="web-performer-feed">
        <Works mode="feed" />
      </div>
    );
  }

  return (
    <div className="web-performer-feed">
      <Cargos />
    </div>
  );
};

export const ChatsPage: React.FC = () => {
  const { t } = useTranslation('works');
  const { id } = useParams<{ id?: string }>();
  const { user_type } = useUserType();
  const chatOpen = Boolean(id);

  return (
    <PanelFrame
      crumb={isExecutorRole(user_type) ? t('chatsCrumbCarrier') : t('chatsCrumbCustomer')}
      title={t('chatsTitle')}
      bare
      className="web-chats-frame"
    >
      <div
        className={`web-chats-layout ${chatOpen ? 'web-chats-open' : 'web-chats-list'}`}
      >
        <aside className="web-chats-sidebar">
          <ChatsList activeId={id} />
        </aside>
        <main className="web-chats-main">
          {id ? (
            <Chats name={id} />
          ) : (
            <div className="web-chats-empty">
              <p>{t('pickChat')}</p>
              <span>{t('pickChatHint')}</span>
            </div>
          )}
        </main>
      </div>
    </PanelFrame>
  );
};

export const SettingsRoutePage: React.FC = () => {
  const { t } = useTranslation('settings');
  return (
  <PanelFrame title={t('title')} subtitle={t('subtitle')} bare>
    <Settings />
  </PanelFrame>
  );
};

export const ProfileRoutePage: React.FC = () => {
  const { t } = useTranslation('settings');
  return (
  <PanelFrame title={t('profileTitle')} subtitle={t('profileSubtitle')}>
    <Profile />
  </PanelFrame>
  );
};

export const FinancePage: React.FC = () => {
  const { t } = useTranslation('finance');
  const history = useHistory();
  const location = useLocation<{ amount?: number | string }>();
  const queryAmount = new URLSearchParams(location.search).get('amount');
  const initialAmount = location.state?.amount ?? queryAmount;

  return (
    <PanelFrame
      crumb={t('crumb')}
      title={t('title')}
      actions={
        <button
          type="button"
          className={panelStyles.refreshBtn}
          onClick={() => document.getElementById('statement')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <Download size={16} strokeWidth={2} />
          {t('statement')}
        </button>
      }
      bare
    >
      <div className="web-finance-layout">
        <WalletPage
          onBack={() => history.push('/')}
          initialAmount={initialAmount}
        />
      </div>
    </PanelFrame>
  );
};

export const VehiclesPage: React.FC = () => {
  return <TransportEditPage />;
};

export const DriversRoutePage: React.FC = () => {
  const { t } = useTranslation('drivers');
  const { user_type } = useUserType();
  if (!isDispatcher(user_type)) return <Redirect to="/" />;
  return (
    <PanelFrame title={t('title')} subtitle={t('subtitle')}>
      <DriversPage />
    </PanelFrame>
  );
};