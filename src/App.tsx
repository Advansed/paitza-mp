import { Redirect, Route, Switch, useParams } from 'react-router-dom';
import { IonApp, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import './theme/design-tokens.css';
import './app.css';
import './theme/variables.css';
import './theme/web-layout.css';

import { ToastProvider } from './components/Toast/ToastManager';
import { useLogin } from './Store/useLogin';
import { useExecutorLocation } from './services/useExecutorLocation';
import { PushNavigator, usePushNotifications } from './services/usePushNotifications';
import { ServerConnectionGuard } from './components/ServerConnectionGuard';
import { useSocketManager } from './services/useSocketManager';
import { useApp } from './Store/useApp';
import { useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { getVersion } from './Store/api';
import { AppShell } from './layout';
import { Login, type LoginFormMode } from './components/Login';
import { HomePage } from './pages/Home/HomePage';
import { StubPage } from './pages/Stub/StubPage';

const FeedPage = lazy(() => import('./pages/RoutePages').then((m) => ({ default: m.FeedPage })));
const ChatsPage = lazy(() => import('./pages/RoutePages').then((m) => ({ default: m.ChatsPage })));
const DriversRoutePage = lazy(() => import('./pages/RoutePages').then((m) => ({ default: m.DriversRoutePage })));
const FinancePage = lazy(() => import('./pages/RoutePages').then((m) => ({ default: m.FinancePage })));
const ProfileRoutePage = lazy(() => import('./pages/RoutePages').then((m) => ({ default: m.ProfileRoutePage })));
const SettingsRoutePage = lazy(() => import('./pages/RoutePages').then((m) => ({ default: m.SettingsRoutePage })));
const VehiclesPage = lazy(() => import('./pages/RoutePages').then((m) => ({ default: m.VehiclesPage })));

setupIonicReact({
  mode: 'ios',
  statusTap: true,
});

const LegacyChatRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Redirect to={`/chats/${id}`} />;
};

const GuestLogin: React.FC<{ mode: LoginFormMode }> = ({ mode }) => (
  <Login variant="page" initialMode={mode} />
);

const GuestRoutes: React.FC = () => (
  <IonReactRouter>
    <Switch>
      <Route exact path="/" render={() => <GuestLogin mode="login" />} />
      <Route exact path="/login" render={() => <GuestLogin mode="login" />} />
      <Route exact path="/register" render={() => <GuestLogin mode="register" />} />
      <Route exact path="/recovery" render={() => <GuestLogin mode="recovery" />} />
      <Route>
        <Redirect to="/login" />
      </Route>
    </Switch>
  </IonReactRouter>
);

const AppContent: React.FC = () => {
  const { t } = useTranslation('common');
  const { auth } = useLogin();
  useExecutorLocation();
  usePushNotifications();

  useSocketManager();
  useApp();

  useEffect(() => {
    getVersion().then(() => undefined);
  }, []);

  return (
    <ServerConnectionGuard>
      {auth ? (
        <IonReactRouter>
          <PushNavigator />
          <AppShell>
            <Suspense fallback={null}>
            <Switch>
              <Route exact path="/" component={HomePage} />
              <Route exact path="/feed" component={FeedPage} />
              <Route exact path="/applications">
                <Redirect to="/feed" />
              </Route>
              <Route exact path="/orders">
                <Redirect to="/feed" />
              </Route>
              <Route exact path="/finance" component={FinancePage} />
              <Route exact path="/chats" component={ChatsPage} />
              <Route exact path="/chats/:id" component={ChatsPage} />
              <Route exact path="/vehicles" component={VehiclesPage} />
              <Route exact path="/drivers" component={DriversRoutePage} />
              <Route exact path="/settings" component={SettingsRoutePage} />
              <Route exact path="/profile" component={ProfileRoutePage} />
              <Route exact path="/cabinet">
                <Redirect to="/profile" />
              </Route>

              <Route exact path="/support">
                <StubPage title={t('supportTitle')} description={t('supportText')} />
              </Route>
              <Route exact path="/documents">
                <StubPage title={t('documentsTitle')} description={t('documentsText')} />
              </Route>
              <Route exact path="/verification">
                <Redirect to="/finance" />
              </Route>
              <Route exact path="/partners">
                <StubPage title={t('partnersTitle')} description={t('partnersText')} />
              </Route>

              {/* Legacy tabs */}
              <Route exact path="/tab1">
                <Redirect to="/feed" />
              </Route>
              <Route exact path="/tab2">
                <Redirect to="/chats" />
              </Route>
              <Route exact path="/tab2/:id" component={LegacyChatRedirect} />
              <Route exact path="/tab3">
                <Redirect to="/settings" />
              </Route>
              <Route exact path="/tab3/:name">
                <Redirect to="/settings" />
              </Route>
              <Route exact path="/tab4">
                <Redirect to="/feed" />
              </Route>

              <Route exact path="/login">
                <Redirect to="/" />
              </Route>
              <Route exact path="/register">
                <Redirect to="/" />
              </Route>

              <Route>
                <Redirect to="/" />
              </Route>
            </Switch>
            </Suspense>
          </AppShell>
        </IonReactRouter>
      ) : (
        <GuestRoutes />
      )}
    </ServerConnectionGuard>
  );
};

const App: React.FC = () => {
  return (
    <IonApp>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </IonApp>
  );
};

export default App;
