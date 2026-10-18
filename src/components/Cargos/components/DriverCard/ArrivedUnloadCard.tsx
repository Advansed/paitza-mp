import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { chatboxEllipsesOutline, locationOutline } from 'ionicons/icons';
import { DriverInfo } from '../../../../Store/cargoStore';
import offerStyles from './OfferCard.module.css';

interface ArrivedUnloadCardProps {
    info: DriverInfo;
    onChat?: (info: DriverInfo) => void;
    isLoading?: boolean;
}

/** Транспорт прибыл на точку разгрузки (статус «Прибыл», код 17) */
export const ArrivedUnloadCard: React.FC<ArrivedUnloadCardProps> = ({
    info,
    onChat,
    isLoading,
}) => {
    return (
        <div className={offerStyles.offerCard}>
            <div className={offerStyles.notificationCard}>
                <div className={offerStyles.notificationHeader}>
                    <div className={offerStyles.notificationTitleRow}>
                        <IonIcon icon={locationOutline} className={offerStyles.notificationIcon} />
                        <h2 className={offerStyles.notificationTitle}>Прибыл</h2>
                    </div>
                    <p className={offerStyles.notificationSubtitle}>
                        Транспорт на месте разгрузки. Ожидайте начала разгрузки или свяжитесь с водителем.
                    </p>
                </div>
            </div>

            <div className={offerStyles.detailsCard}>
                <div className={offerStyles.infoRow}>
                    <div className={offerStyles.infoField}>
                        <label className={offerStyles.label}>Номер транспорта</label>
                        <div className={offerStyles.value}>{info.transport}</div>
                    </div>
                    <div className={offerStyles.infoField}>
                        <label className={offerStyles.label}>Водитель</label>
                        <div className={offerStyles.value}>{info.client}</div>
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
