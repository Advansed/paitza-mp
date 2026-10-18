import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLoginStore } from '../Store/loginStore';
import { useProfile } from '../components/Settings/useProfile';
import { useIsDesktop } from '../hooks/useBreakpoint';
import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';
import { MobileTabBar } from './MobileTabBar';
import { RoleToggle } from './RoleToggle';
import styles from './AppShell.module.css';

type AppShellProps = {
  children: React.ReactNode;
};

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const isDesktop = useIsDesktop();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { name, image, user_type } = useLoginStore();
  const { setUser } = useProfile();

  const handleRoleChange = (nextType: number) => {
    if (nextType === user_type) return;
    setUser({ user_type: nextType });
  };

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className={`${styles.shell} ${isDesktop ? styles.desktop : styles.mobile}`}>
      {isDesktop ? (
        <Sidebar userType={user_type} pathname={location.pathname} />
      ) : (
        <>
          {drawerOpen && (
            <button
              type="button"
              className={styles.backdrop}
              aria-label="Закрыть меню"
              onClick={closeDrawer}
            />
          )}
          <div className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ''}`}>
            <Sidebar
              userType={user_type}
              pathname={location.pathname}
              onNavigate={closeDrawer}
              compact
            />
            <div className={styles.drawerRole}>
              <RoleToggle userType={user_type} onChange={handleRoleChange} />
            </div>
          </div>
        </>
      )}

      <div className={styles.main}>
        <AppHeader
          userType={user_type}
          userName={name}
          userImage={image}
          onRoleChange={handleRoleChange}
          showMenuButton={!isDesktop}
          onMenuToggle={() => setDrawerOpen((v) => !v)}
        />
        <div className={styles.content}>{children}</div>
        {!isDesktop && <MobileTabBar userType={user_type} pathname={location.pathname} />}
      </div>
    </div>
  );
};
