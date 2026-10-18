import React from 'react';
import { IonIcon } from '@ionic/react';
import { menuOutline, refreshOutline, closeOutline, chevronBackOutline, saveOutline } from 'ionicons/icons';
import styles from './WizardHeader.module.css';

interface WizardHeaderProps {
  title:            string;
  pages?:           string;
  onMenu?:          () => void;
  onSave?:          () => void;
  onBack?:          () => void;
  onClose?:         () => void;
  onRefresh?:       () => void;
}

export const WizardHeader: React.FC<WizardHeaderProps> = ({
  title,
  pages     = "",
  onMenu,
  onSave,
  onBack,
  onClose,
  onRefresh   
}) => {

  return (
    <div className={styles.stepHeader}>
        <button 
            className = { `${styles.navButton} ${styles.navButtonLeft} ${onMenu ? styles.menuButton : ''}` } 
            onClick   = { () => { 
              if(onMenu) onMenu();
              else if(onBack) onBack();
            } }
        >
            { onMenu !== undefined && ( <IonIcon icon={menuOutline} />)}
            { onMenu === undefined && onBack !== undefined && ( <IonIcon icon={chevronBackOutline} />)}
        </button>

        <div className={styles.titleContainer}>
            <h3 className={styles.stepTitle}>{title}</h3>
            {pages && <h3 className={styles.pageTitle}>{pages}</h3>}
        </div>

        <button 
            className={`${styles.navButton} ${styles.navButtonRight} ${onRefresh ? styles.refreshButton : ''}`} 
            onClick={ () => { 
              if(onRefresh) onRefresh();
              if(onClose) onClose();
              if(onSave) onSave();
            } }
            disabled={ false }
        >
            { onRefresh !== undefined && (<IonIcon icon={ refreshOutline } />)  }
            { onClose   !== undefined && (<IonIcon icon={ closeOutline } />)  }
            { onSave    !== undefined && (<IonIcon icon={ saveOutline } />)  }
        </button>
    </div>
  );
};
