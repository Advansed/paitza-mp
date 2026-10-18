import React, { useEffect, useState } from 'react';
import { IonButton, IonCheckbox, IonIcon, IonSpinner } from '@ionic/react';
import { chatboxEllipsesOutline, locationOutline } from 'ionicons/icons';
import { DriverInfo } from '../../../../Store/cargoStore';
import { useChats } from '../../../../Store/useChats';
import offerStyles from './OfferCard.module.css';
import { PhotoPreview } from '../../../Chats/PhotoPreview';
import { latestPhotoBatch, resolvePhotoBatch } from '../../../../utils/orderPhotos';

/** Фото груза/пломбы при прибытии на выгрузку (Works sendImage …, 18) */
const UNLOAD_ARRIVAL_PHOTO_STATUS = 18;

interface ToUnloadCardProps {
    info: DriverInfo;
    onChat?: (info: DriverInfo) => void;
    onStartUnloading?: (info: DriverInfo) => void;
    isLoading?: boolean;
}

export const ToUnloadCard: React.FC<ToUnloadCardProps> = ({
    info,
    onChat,
    onStartUnloading,
    isLoading,
}) => {
    const [confirmed, setConfirmed] = useState(false);
    const [fotos, setFotos] = useState<any[]>([]);
    const [photosLoading, setPhotosLoading] = useState(true);
    const [previewUrl, setPreviewUrl] = useState('');
    const { getPhotos } = useChats();

    const formatPrice = (price: number): string => {
        return price.toLocaleString('ru-RU').replace(/,/g, ' ');
    };

    useEffect(() => {
        let isMounted = true;
        setPhotosLoading(true);

        getPhotos(info.recipient, info.cargo, UNLOAD_ARRIVAL_PHOTO_STATUS)
            .then(async (data: any[]) => {
                const srcs = await resolvePhotoBatch(latestPhotoBatch(data || []));
                if (!isMounted) return;
                setFotos(srcs);
            })
            .catch((err: unknown) => {
                console.error(err);
                if (isMounted) setFotos([]);
            })
            .finally(() => {
                if (isMounted) setPhotosLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [info.recipient, info.cargo, getPhotos]);

    return (
        <div className={offerStyles.offerCard}>
            <div className={offerStyles.notificationCard}>
                <div className={offerStyles.notificationHeader}>
                    <div className={offerStyles.notificationTitleRow}>
                        <IonIcon icon={locationOutline} className={offerStyles.notificationIcon} />
                        <h2 className={offerStyles.notificationTitle}>Товар прибыл</h2>
                    </div>
                    <p className={offerStyles.notificationSubtitle}>
                        Товар прибыл и ждет разгрузки
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

            <div className={offerStyles.detailsCard}>
                <label className={offerStyles.label}>Фото от водителя при прибытии на выгрузку</label>
                {photosLoading && (
                    <div className="flex items-center gap-05 mt-05">
                        <IonSpinner name="crescent" style={{ color: 'white' }} />
                        <span className={offerStyles.notificationSubtitle}>Загрузка фото…</span>
                    </div>
                )}
                {!photosLoading && fotos.length > 0 && (
                    <div className="flex flex-wrap mt-02">
                        {fotos.map((src: string, index: number) => {
                            if (!src) return null;

                            return (
                                <div key={index} className="ml-05 mr-05">
                                    <img
                                        src={src}
                                        alt={`Фото ${index + 1}`}
                                        style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }}
                                        onClick={() => setPreviewUrl(src)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
                {!photosLoading && fotos.length === 0 && (
                    <p className={offerStyles.notificationSubtitle} style={{ marginTop: '0.5em' }}>
                        Фото ещё не получены.
                    </p>
                )}
            </div>

            <div className={offerStyles.detailsCard}>
                <div className="flex ai-center">
                    <IonCheckbox
                        checked={confirmed}
                        onIonChange={e => setConfirmed(!!e.detail.checked)}
                    />
                    <span className="ml-05">
                        Пломба цела, груз доставлен
                    </span>
                </div>
            </div>

            <div className={offerStyles.actions}>
                <div className={offerStyles.buttonsRow}>
                    {onStartUnloading && (
                        <IonButton
                            className={offerStyles.acceptButton}
                            expand="block"
                            onClick={() => onStartUnloading(info)}
                            disabled={isLoading || !confirmed}
                        >
                            <span>Начать разгрузку</span>
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

            <PhotoPreview imageUrl={previewUrl} closeModal={() => setPreviewUrl('')} />
        </div>
    );
};

