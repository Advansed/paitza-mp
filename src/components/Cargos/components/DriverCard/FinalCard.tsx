import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { checkmarkCircleOutline, chatboxEllipsesOutline } from 'ionicons/icons';
import { DriverInfo } from '../../../../Store/cargoStore';
import offerStyles from './OfferCard.module.css';

interface FinalCardProps {
    info: DriverInfo;
    onChat?: (info: DriverInfo) => void;
    isLoading?: boolean;
}

export const FinalCard: React.FC<FinalCardProps> = ({ info, onChat, isLoading }) => {
    const formatPrice = (price: number): string =>
        price.toLocaleString('ru-RU').replace(/,/g, ' ');

    return (
        <div className={offerStyles.offerCard}>
            <div className={offerStyles.notificationCard}>
                <div className={offerStyles.notificationHeader}>
                    <div className={offerStyles.notificationTitleRow}>
                        <IonIcon icon={checkmarkCircleOutline} className={offerStyles.notificationIcon} />
                        <h2 className={offerStyles.notificationTitle}>Работы завершены</h2>
                    </div>
                    <p className={offerStyles.notificationSubtitle}>
                        Все работы с данным водителем завершены
                    </p>
                </div>
            </div>

            <div className={offerStyles.detailsCard}>
                <div className={offerStyles.infoRow}>
                    <div className={offerStyles.infoField}>
                        <label className={offerStyles.label}>Водитель</label>
                        <div className={offerStyles.value}>
                            {info.client}
                        </div>
                    </div>
                    <div className={offerStyles.infoField}>
                        <label className={offerStyles.label}>Транспорт</label>
                        <div className={offerStyles.value}>
                            {info.transport}
                        </div>
                    </div>
                </div>

                <div className={offerStyles.infoRow}>
                    <div className={offerStyles.infoField}>
                        <label className={offerStyles.label}>Вес (т)</label>
                        <div className={offerStyles.value}>
                            {info.weight.toFixed(1)} тонн
                        </div>
                    </div>
                    <div className={offerStyles.infoField}>
                        <label className={offerStyles.label}>Объем (м³)</label>
                        <div className={offerStyles.value}>
                            {info.volume.toFixed(1)} м³
                        </div>
                    </div>
                    <div className={offerStyles.infoField}>
                        <label className={offerStyles.label}>Цена (₽)</label>
                        <div className={offerStyles.value}>
                            {formatPrice(info.price)} (₽)
                        </div>
                    </div>
                </div>
            </div>

            <div className={`${offerStyles.detailsCard} ${offerStyles.ratingSummaryCard}`}>
                <div className={offerStyles.ratingSummaryBlock}>
                    <label className={offerStyles.label}>Оценка работы водителя</label>
                    <div className={offerStyles.ratingSummaryValue}>
                        {typeof (info as any).rating === 'number'
                            ? `${(info as any).rating.toFixed(1)} / 5`
                            : '—'}
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

