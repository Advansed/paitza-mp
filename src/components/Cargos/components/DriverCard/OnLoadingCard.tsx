import React, { useEffect, useState } from 'react';
import { IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { chatboxEllipsesOutline, cubeOutline, refreshOutline } from 'ionicons/icons';
import { DriverInfo } from '../../../../Store/cargoStore';
import { useChats } from '../../../../Store/useChats';
import offerStyles from './OfferCard.module.css';
import { PhotoPreview } from '../../../Chats/PhotoPreview';
import {
    BODY_PHOTO_STATUS,
    latestPhotoBatch,
    resolvePhotoBatch,
} from '../../../../utils/orderPhotos';

interface OnLoadingCardProps {
    info: DriverInfo;
    onChat?: (info: DriverInfo) => void;
    onStartLoading?: (info: DriverInfo) => void;
    isLoading?: boolean;
}

export const OnLoadingCard: React.FC<OnLoadingCardProps> = ({
    info,
    onChat,
    onStartLoading,
    isLoading,
}) => {
    const [fotos, setFotos] = useState<any[]>([]);
    const [photosLoading, setPhotosLoading] = useState(true);
    const [previewUrl, setPreviewUrl] = useState('');
    const [photoTick, setPhotoTick] = useState(0);
    const { getPhotos } = useChats();

    const formatPrice = (price: number): string => {
        return price.toLocaleString('ru-RU').replace(/,/g, ' ');
    };

    useEffect(() => {
        let cancelled = false;
        let inflight = false;

        const load = async (showSpinner: boolean) => {
            if (inflight) return;
            inflight = true;
            if (showSpinner) setPhotosLoading(true);
            try {
                const data = await getPhotos(info.recipient, info.cargo, BODY_PHOTO_STATUS);
                const srcs = await resolvePhotoBatch(latestPhotoBatch(data || []));
                if (!cancelled) setFotos(srcs);
            } catch (err: unknown) {
                console.error(err);
                if (!cancelled) setFotos([]);
            } finally {
                inflight = false;
                if (!cancelled) setPhotosLoading(false);
            }
        };

        void load(true);
        const poll = window.setInterval(() => {
            void load(false);
        }, 7000);

        return () => {
            cancelled = true;
            window.clearInterval(poll);
        };
    }, [info.recipient, info.cargo, getPhotos, photoTick]);

    const photos = fotos;
    const canStartLoading = !photosLoading && photos.length > 0;

    return (
        <div className={offerStyles.offerCard}>
            <div className={offerStyles.notificationCard}>
                <div className={offerStyles.notificationHeader}>
                    <div className={offerStyles.notificationTitleRow}>
                        <IonIcon icon={cubeOutline} className={offerStyles.notificationIcon} />
                        <h2 className={offerStyles.notificationTitle}>На погрузке</h2>
                    </div>
                    <p className={offerStyles.notificationSubtitle}>
                        Водитель прибыл на место погрузки
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
                <label className={offerStyles.label}>Актуальные фото кузова</label>
                <IonButton
                    fill="clear"
                    size="small"
                    onClick={() => setPhotoTick((n) => n + 1)}
                    disabled={photosLoading}
                >
                    <IonIcon icon={refreshOutline} slot="start" />
                    Обновить
                </IonButton>
                {photosLoading && (
                    <div className="flex items-center gap-05 mt-05">
                        <IonSpinner name="crescent" style={{ color: 'white' }} />
                        <span className={offerStyles.notificationSubtitle}>Загрузка фото…</span>
                    </div>
                )}
                {!photosLoading && photos.length === 0 && (
                    <p className={offerStyles.notificationSubtitle} style={{ marginTop: '0.5em' }}>
                        Фото кузова ещё не получены. Водитель может отправить или заменить снимки.
                    </p>
                )}
                {!photosLoading && photos.length > 0 && (
                    <div className="flex flex-wrap mt-02">
                        {photos.map((src, index) => (
                            <div key={`${src}-${index}`} className="ml-05 mr-05">
                                <img
                                    src={src}
                                    alt={`Фото кузова ${index + 1}`}
                                    style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }}
                                    onClick={() => setPreviewUrl(src)}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className={offerStyles.actions}>
                <div className={offerStyles.buttonsRow}>
                    {onStartLoading && (
                        <IonButton
                            className={offerStyles.acceptButton}
                            expand="block"
                            onClick={() => onStartLoading(info)}
                            disabled={isLoading || !canStartLoading}
                        >
                            <span>Начать погрузку</span>
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
}

