import React from 'react';
import { useLoginStore } from '../Store/loginStore';
import { panelLabel } from '../Store/roles';
import styles from './PanelFrame.module.css';

type PanelFrameProps = {
  title?: string;
  subtitle?: string;
  crumb?: string;
  children: React.ReactNode;
  /** Home dashboard: no single white wrapper around everything */
  bare?: boolean;
  className?: string;
  actions?: React.ReactNode;
};

/** Единый каркас «Панель перевозчика / заказчика» для всех разделов */
export const PanelFrame: React.FC<PanelFrameProps> = ({
  title,
  subtitle,
  crumb,
  children,
  bare,
  className,
  actions,
}) => {
  const userType = useLoginStore((s) => s.user_type);
  const label = crumb || panelLabel(userType);

  return (
    <div className={`${styles.root} ${className || ''}`}>
      <div className={styles.crumb}>{label}</div>
      {(title || subtitle || actions) && (
        <div className={styles.titleRow}>
          <div>
            {title && <h1 className={styles.title}>{title}</h1>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      )}

      {bare ? (
        children
      ) : (
        <div className={`${styles.panel} panel-embedded`}>{children}</div>
      )}
    </div>
  );
};

export function usePanelPanelLabel(): string {
  const userType = useLoginStore((s) => s.user_type);
  return panelLabel(userType);
}
