import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { MOBILE_TABS, filterNavByRole, isNavActive } from './navConfig';
import styles from './MobileTabBar.module.css';

type MobileTabBarProps = {
  userType: number;
  pathname: string;
};

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ userType, pathname }) => {
  const { t } = useTranslation();
  const tabs = filterNavByRole(MOBILE_TABS, userType);

  return (
    <nav className={styles.bar} aria-label={t('mainMenu')}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isNavActive(pathname, tab.path);
        const label = tab.id === 'feed' ? t('nav:feedShort') : t(`nav:${tab.id}`);
        return (
          <NavLink
            key={tab.id}
            to={tab.path}
            className={`${styles.tab} ${active ? styles.active : ''}`}
          >
            <Icon size={22} strokeWidth={1.75} />
            <span>{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
