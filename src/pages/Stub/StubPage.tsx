import React from 'react';
import { Construction } from 'lucide-react';
import { PanelFrame } from '../../layout/PanelFrame';
import styles from './StubPage.module.css';

type StubPageProps = {
  title: string;
  description?: string;
};

export const StubPage: React.FC<StubPageProps> = ({
  title,
  description = 'Раздел в разработке. Скоро здесь появится полный функционал.',
}) => {
  return (
    <PanelFrame title={title}>
      <div className={styles.wrap}>
        <div className={styles.icon}>
          <Construction size={32} strokeWidth={1.5} />
        </div>
        <p className={styles.desc}>{description}</p>
      </div>
    </PanelFrame>
  );
};

export default StubPage;
