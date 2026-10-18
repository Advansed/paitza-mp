import React from 'react';
import { IonIcon } from '@ionic/react';
import { cubeOutline } from 'ionicons/icons';
import { DriverInfo } from '../../../../Store/cargoStore';
import offerStyles from './OfferCard.module.css';

interface OnWayCardProps {
    info: DriverInfo;
}

export const OnWayCard: React.FC<OnWayCardProps> = ({ info }) => {
    return (
        <div className={offerStyles.offerCard}>
            <div className={offerStyles.notificationCard}>
                <div className={offerStyles.notificationHeader}>
                    <div className={offerStyles.notificationTitleRow}>
                        <IonIcon icon={cubeOutline} className={offerStyles.notificationIcon} />
                        <h2 className={offerStyles.notificationTitle}>В пути</h2>
                    </div>
                    <p className={offerStyles.notificationSubtitle}>
                        Транспорт в пути к месту разгрузки
                    </p>
                </div>
            </div>

            <div className={offerStyles.detailsCard}>
                <div className={offerStyles.infoRow}>
                    <div className={offerStyles.infoField}>
                        <label className={offerStyles.label}>Номер транспорта</label>
                        <div className={offerStyles.value}>
                            {info.transport}
                        </div>
                    </div>
                    <div className={offerStyles.infoField}>
                        <label className={offerStyles.label}>Водитель</label>
                        <div className={offerStyles.value}>
                            {info.client}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

