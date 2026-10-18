import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { FOOTER_NAV, MAIN_NAV, filterNavByRole, isNavActive } from './navConfig';
import { useLoginStore } from '../Store/loginStore';
import { roleLabel } from '../Store/roles';
import { useResolvedImageSrc } from '../utils/fileUpload';
import styles from './Sidebar.module.css';

type SidebarProps = {
  userType: number;
  pathname: string;
  onNavigate?: () => void;
  compact?: boolean;
};

export const Sidebar: React.FC<SidebarProps> = ({ userType, pathname, onNavigate, compact }) => {
  const main = filterNavByRole(MAIN_NAV, userType);
  const footer = filterNavByRole(FOOTER_NAV, userType);
  const { t } = useTranslation();
  const name = useLoginStore((s) => s.name);
  const image = useLoginStore((s) => s.image);
  const imageSrc = useResolvedImageSrc(image);
  const displayName = name?.trim() || t('user');
  const initial = displayName.charAt(0).toUpperCase() || 'П';
  const role = roleLabel(userType);

  return (
    <aside className={`${styles.sidebar} ${compact ? styles.compact : ''}`}>
      <div className={styles.brand}>
        <img
          src="/landing/logo.jpg"
          alt=""
          className={styles.logoImg}
          width={40}
          height={40}
        />
        <div className={styles.brandText}>
          <div className={styles.brandTitle}>ПАЙЦЗА</div>
          <div className={styles.brandSubtitle}>{t('brandSubtitle')}</div>
        </div>
      </div>

      <nav className={styles.nav} aria-label={t('mainMenu')}>
        {main.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(pathname, item.path);
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={`${styles.navItem} ${active ? styles.active : ''}`}
              onClick={onNavigate}
            >
              <Icon size={19} strokeWidth={1.85} className={styles.navIcon} />
              <span className={styles.navLabel}>{t(`nav:${item.id}`)}</span>
              {active && <span className={styles.activeDot} aria-hidden />}
              {!active && item.alert && <span className={styles.alertDot} aria-label={t('attention')} />}
            </NavLink>
          );
        })}
      </nav>

      <div className={styles.footerNav}>
        {footer.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(pathname, item.path);
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={`${styles.navItem} ${active ? styles.active : ''}`}
              onClick={onNavigate}
            >
              <Icon size={19} strokeWidth={1.85} className={styles.navIcon} />
              <span className={styles.navLabel}>{t(`nav:${item.id}`)}</span>
              {active && <span className={styles.activeDot} aria-hidden />}
              {!active && item.alert && <span className={styles.alertDot} aria-label={t('attention')} />}
            </NavLink>
          );
        })}
      </div>

      <NavLink
        to="/profile"
        className={styles.userCard}
        onClick={onNavigate}
      >
        <span className={styles.userAvatar}>
          {imageSrc ? (
            <img src={imageSrc} alt="" />
          ) : (
            <span>{initial}</span>
          )}
        </span>
        <span className={styles.userMeta}>
          <span className={styles.userName}>{displayName}</span>
          <span className={styles.userRole}>{role}</span>
        </span>
      </NavLink>
    </aside>
  );
};
