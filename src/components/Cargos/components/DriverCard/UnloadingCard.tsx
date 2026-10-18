import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { chatboxEllipsesOutline, cubeOutline } from 'ionicons/icons';
import { DriverInfo } from '../../../../Store/cargoStore';
import offerStyles from './OfferCard.module.css';

interface UnloadingCardProps {
    info: DriverInfo;
    onChat?: (info: DriverInfo) => void;
    isLoading?: boolean;
}

export const UnloadingCard: React.FC<UnloadingCardProps> = ({ info, onChat, isLoading }) => {
    const formatPrice = (price: number): string => {
        return price.toLocaleString('ru-RU').replace(/,/g, ' ');
    };

    return (
        <div className={offerStyles.offerCard}>
            <div className={offerStyles.notificationCard}>
                <div className={offerStyles.notificationHeader}>
                    <div className={offerStyles.notificationTitleRow}>
                        <IonIcon icon={cubeOutline} className={offerStyles.notificationIcon} />
                        <h2 className={offerStyles.notificationTitle}>Разгружается</h2>
                    </div>
                    <p className={offerStyles.notificationSubtitle}>
                        Товар разгружается
                    </p>
                </div>
            </div>

            <div className={offerStyles.detailsCard}>
                <div className={offerStyles.infoRow}>
                    <div className={offerStyles.infoField}>
                        <label className={offerStyles.label}>Цена (₽)</label>
                        <div className={offerStyles.value}>
                            {formatPrice(info.price)} (₽)
                        </div>
                    </div>
                    <div className={offerStyles.infoField}>
                        <label className={offerStyles.label}>Объем (м³)</label>
                        <div className={offerStyles.value}>
                            {info.volume.toFixed(1)} м³
                        </div>
                    </div>
                    <div className={offerStyles.infoField}>
                        <label className={offerStyles.label}>Вес (т)</label>
                        <div className={offerStyles.value}>
                            {info.weight.toFixed(1)} тонн
                        </div>
                    </div>
                </div>
            </div>

            {onChat && (
                <div className={offerStyles.actions}>
                    <IonButton
                        fill="outline"
                        className={offerStyles.rejectButton}
                        expand="block"
                        onClick={() => onChat(info)}
                        disabled={isLoading}
                    >
                        <IonIcon icon={chatboxEllipsesOutline} slot="start" />
                        <span>Чат</span>
                    </IonButton>
                </div>
            )}
        </div>
    );
};

