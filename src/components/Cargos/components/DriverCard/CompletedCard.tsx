import React, { useState } from 'react';
import { IonButton, IonIcon, IonCheckbox } from '@ionic/react';
import { checkmarkOutline, chatboxEllipsesOutline, cubeOutline } from 'ionicons/icons';
import { DriverInfo } from '../../../../Store/cargoStore';
import offerStyles from './OfferCard.module.css';

interface CompletedCardProps {
    info: DriverInfo;
    onChat?: (info: DriverInfo) => void;
    onComplete?: (info: DriverInfo, rating: number, completed: boolean) => void;
    isLoading?: boolean;
}

export const CompletedCard: React.FC<CompletedCardProps> = ({
    info,
    onChat,
    onComplete,
    isLoading,
}) => {
    const formatPrice = (price: number): string =>
        price.toLocaleString('ru-RU').replace(/,/g, ' ');

    const [rating, setRating] = useState(0);
    const [completed, setCompleted] = useState(false);

    const canSubmit = !!onComplete && completed && rating > 0 && !isLoading;

    return (
        <div className={offerStyles.offerCard}>
            <div className={offerStyles.notificationCard}>
                <div className={offerStyles.notificationHeader}>
                    <div className={offerStyles.notificationTitleRow}>
                        <IonIcon icon={cubeOutline} className={offerStyles.notificationIcon} />
                        <h2 className={offerStyles.notificationTitle}>Товар выгружен</h2>
                    </div>
                    <p className={offerStyles.notificationSubtitle}>
                        Товар выгружен, вы можете завершить работу
                    </p>
                </div>
            </div>

            <div className={offerStyles.detailsCard}>
                <div className={offerStyles.infoRow}>
                    <div className={offerStyles.infoField}>
                        <label className={offerStyles.label}>Цена (₽)</label>
                        <div className={offerStyles.value}>{formatPrice(info.price)} (₽)</div>
                    </div>
                    <div className={offerStyles.infoField}>
                        <label className={offerStyles.label}>Объем (м³)</label>
                        <div className={offerStyles.value}>{info.volume.toFixed(1)} м³</div>
                    </div>
                    <div className={offerStyles.infoField}>
                        <label className={offerStyles.label}>Вес (т)</label>
                        <div className={offerStyles.value}>{info.weight.toFixed(1)} тонн</div>
                    </div>
                </div>
            </div>

            <div className={offerStyles.detailsCard}>
                <div className={offerStyles.ratingBlock}>
                    <label className={offerStyles.label}>Оценка работы водителя</label>
                    <div className={offerStyles.ratingStarsRow} role="group" aria-label="Оценка от 1 до 5">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <span
                                key={star}
                                onClick={() => setRating(star)}
                                style={{
                                    cursor: 'pointer',
                                    color: star <= rating ? '#ffd700' : 'rgba(255, 255, 255, 0.45)',
                                }}
                            >
                                ★
                            </span>
                        ))}
                    </div>
                </div>
                <div className={offerStyles.ratingConfirmRow}>
                    <IonCheckbox
                        checked={completed}
                        onIonChange={e => setCompleted(!!e.detail.checked)}
                    />
                    <span>Все работы завершены в срок и претензий не имею</span>
                </div>
            </div>

            <div className={offerStyles.actions}>
                <div className={offerStyles.buttonsRow}>
                    {onComplete && (
                        <IonButton
                            className={offerStyles.acceptButton}
                            expand="block"
                            onClick={() => onComplete(info, rating, completed)}
                            disabled={!canSubmit}
                        >
                            <IonIcon icon={checkmarkOutline} slot="start" />
                            <span>Завершить</span>
                        </IonButton>
                    )}
                    {onChat && (
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
                    )}
                </div>
            </div>
        </div>
    );
};

