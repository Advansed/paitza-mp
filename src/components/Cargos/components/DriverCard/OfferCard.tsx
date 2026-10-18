import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { mailOutline, shieldCheckmarkOutline, documentOutline, timeOutline, closeOutline, checkmarkOutline } from 'ionicons/icons';
import styles from './OfferCard.module.css';
import { DriverInfo } from '../../../../Store/cargoStore';

interface OfferCardProps {
    info: DriverInfo
    onAccept?: (info: DriverInfo) => void;
    onReject?: (info: DriverInfo) => void;
    isLoading?: boolean;
    comment?: string;
    createdAt?: string;
}

export const OfferCard: React.FC<OfferCardProps> = ({
    info,
    onAccept,
    onReject,
    isLoading = false,
    comment,
    createdAt
}) => {
    const formatPrice = (price: number): string => {
        return price.toLocaleString('ru-RU').replace(/,/g, ' ');
    };

    return (
        <div className={styles.offerCard}>
            {/* Card 1: New Offer Notification */}
            <div className={styles.notificationCard}>
                <div className={styles.notificationHeader}>
                    <div className={styles.notificationTitleRow}>
                        <IonIcon icon={mailOutline} className={styles.notificationIcon} />
                        <h2 className={styles.notificationTitle}>
                            Новое предложение от водителя!
                        </h2>
                        <span className={styles.newBadge}>NEW</span>
                    </div>
                    <p className={styles.notificationSubtitle}>
                        Водитель отправил предложение
                    </p>
                </div>
                {createdAt && (
                    <div className={styles.timestamp}>
                        <IonIcon icon={timeOutline} className={styles.clockIcon} />
                        <span>{createdAt}</span>
                    </div>
                )}
            </div>

            {/* Card 2: Offer Details */}
            <div className={styles.detailsCard}>
                <div className={styles.driverInfo}>
                    <div className={styles.driverInfoItem}>
                        <span className={styles.driverInfoLabel}>Водитель</span>
                        <span className={styles.driverInfoValue}>{info.client}</span>
                    </div>
                    <div className={styles.driverInfoItem}>
                        <span className={styles.driverInfoLabel}>Рейтинг</span>
                        <span className={styles.driverInfoValue}>⭐ {info.rating}</span>
                    </div>
                    <div className={styles.driverInfoItem}>
                        <span className={styles.driverInfoLabel}>Транспорт</span>
                        <span className={styles.driverInfoValue}>{info.transport}</span>
                    </div>
                </div>
                <div className={styles.infoRow}>
                    <div className={styles.infoField}>
                        <label className={styles.label}> Цена (₽)</label>
                        <div className={styles.value}>
                            {formatPrice(info.price)} (₽)
                        </div>
                    </div>
                    <div className={styles.infoField}>
                        <label className={styles.label}>Вес (т)</label>
                        <div className={styles.value}>
                            {info.weight.toFixed(1)} тонн
                        </div>
                    </div>
                    <div className={styles.infoField}>
                        <label className={styles.label}>Объем (м³)</label>
                        <div className={styles.value}>
                            {info.volume.toFixed(1)} м³
                        </div>
                    </div>
                </div>
            </div>

            {/* Card 3: Secure Payment */}
            <div className={styles.secureCard}>
                <IonIcon icon={shieldCheckmarkOutline} className={styles.secureIcon} />
                <h3 className={styles.secureTitle}>Безопасная оплата через платформу</h3>
                <p className={styles.secureDescription}>
                    Все платежи проходят через специальный счет приложения. Комиссия платформы 5% обеспечивает защиту обеих сторон и гарантию выполнения сделки.
                </p>
            </div>

            {/* Card 4: Comment (optional) */}
            {comment && (
                <div className={styles.commentCard}>
                    <IonIcon icon={documentOutline} className={styles.commentIcon} />
                    <h3 className={styles.commentTitle}>Комментарий от водителя:</h3>
                    <p className={styles.commentText}>«{comment}»</p>
                </div>
            )}

            {/* Action Buttons */}
            <div className={styles.actions}>
                <div className={styles.buttonsRow}>
                    {onReject && (
                        <IonButton
                            className={styles.rejectButton}
                            fill="outline"
                            expand="block"
                            onClick={() => onReject(info)}
                            disabled={isLoading}
                        >
                            <IonIcon icon={closeOutline} slot="start" />
                            <span>Отклонить</span>
                        </IonButton>
                    )}
                    {onAccept && (
                        <IonButton
                            className={styles.acceptButton}
                            color="success"
                            expand="block"
                            onClick={() => onAccept(info)}
                            disabled={isLoading}
                        >
                            <IonIcon icon={checkmarkOutline} slot="start" />
                            <span>Принять</span>
                        </IonButton>
                    )}
                </div>
            </div>
        </div>
    );
};
