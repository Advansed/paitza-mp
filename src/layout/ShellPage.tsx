import React from 'react';
import { IonContent, IonPage } from '@ionic/react';
import styles from './ShellPage.module.css';

type ShellPageProps = {
  children: React.ReactNode;
  className?: string;
  /** Skip IonPage wrapper for plain HTML content */
  plain?: boolean;
};

/** Wrapper so existing Ionic screens fit inside AppShell content area */
export const ShellPage: React.FC<ShellPageProps> = ({ children, className, plain }) => {
  if (plain) {
    return <div className={`${styles.plain} ${className || ''}`}>{children}</div>;
  }

  return (
    <IonPage className={`${styles.page} ${className || ''}`}>
      <IonContent className={styles.content} forceOverscroll={false}>
        <div className={styles.inner}>{children}</div>
      </IonContent>
    </IonPage>
  );
};
