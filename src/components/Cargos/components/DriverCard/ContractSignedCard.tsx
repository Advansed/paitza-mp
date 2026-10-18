import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { checkmarkCircleOutline, chatboxEllipsesOutline } from 'ionicons/icons';
import { DriverInfo } from '../../../Store/cargoStore';
import styles from '../DriverCard.module.css';

interface ContractSignedCardProps {
    info: DriverInfo;
    onChat?: (info: DriverInfo) => void;
    isLoading?: boolean;
}

export const ContractSignedCard: React.FC<ContractSignedCardProps> = ({
    info,
    onChat,
    isLoading,
}) => {
    const formatPrice = (price: number): string => {
        return price.toLocaleString('ru-RU').replace(/,/g, ' ');
    };

    return (
        <div className={styles.contractSignedCard}>
            <div className={styles.header}>
                <IonIcon icon={checkmarkCircleOutline} className={styles.headerIcon + ' w-15 h-15'} />
                <h2 className={styles.title}>
                    <b> Предложение принято, договор подписан</b>
                </h2>
            </div>

            <div className={styles.infoRow}>
                <div className={styles.infoField}>
                    <label className={styles.label}>Вес (т)</label>
                    <div className={styles.value + ' cl-white fs-11'}>
                        <b>{info.weight.toFixed(1)}</b>
                    </div>
                </div>

                <div className={styles.infoField}>
                    <label className={styles.label}>Объем (м³)</label>
                    <div className={styles.value + ' cl-white fs-11'}>
                        <b>{info.volume.toFixed(1)}</b>
                    </div>
                </div>

                <div className={styles.infoField}>
                    <label className={styles.label}>Цена (₽)</label>
                    <div className={styles.value + ' cl-white fs-11'}>
                        <b>{formatPrice(info.price)}</b>
                    </div>
                </div>
            </div>

            <div className={styles.message + ' fs-11'}>
                Ждем подписания договора водителем
            </div>

            {onChat && (
                <IonButton
                    color="success"
                    expand="block"
                    onClick={() => onChat(info)}
                    disabled={isLoading}
                >
                    <IonIcon
                        icon={chatboxEllipsesOutline}
                        className={styles.buttonIcon + ' fs-14'}
                        color="light"
                    />
                    <span className="ml-05 cl-white">
                        <b>Чат</b>
                    </span>
                </IonButton>
            )}
        </div>
    );
}

