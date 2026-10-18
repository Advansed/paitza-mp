import React, { useEffect, useState } from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { chatboxEllipsesOutline, cubeOutline } from 'ionicons/icons';
import { DriverInfo } from '../../../../Store/cargoStore';
import { useChats } from '../../../../Store/useChats';
import offerStyles from './OfferCard.module.css';
import { PhotoPreview } from '../../../Chats/PhotoPreview';
import {
    LOAD_CARGO_PHOTO_STATUS,
    LOAD_SEAL_PHOTO_STATUS,
    latestPhotoBatch,
    resolvePhotoBatch,
} from '../../../../utils/orderPhotos';

interface LoadedCardProps {
    info: DriverInfo;
    onChat?: (info: DriverInfo) => void;
    onSend?: (info: DriverInfo) => void;
    isLoading?: boolean;
}

export const LoadedCard: React.FC<LoadedCardProps> = ({ info, onChat, onSend, isLoading }) => {
    const [cargoFotos, setCargoFotos] = useState<string[]>([]);
    const [sealFotos, setSealFotos] = useState<string[]>([]);
    const [previewUrl, setPreviewUrl] = useState('');
    const { getPhotos } = useChats();

    const formatPrice = (price: number): string => {
        return price.toLocaleString('ru-RU').replace(/,/g, ' ');
    };

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const cargoData = await getPhotos(info.recipient, info.cargo, LOAD_CARGO_PHOTO_STATUS);
                const sealData = await getPhotos(info.recipient, info.cargo, LOAD_SEAL_PHOTO_STATUS);
                if (cancelled) return;
                setCargoFotos(await resolvePhotoBatch(latestPhotoBatch(cargoData || [])));
                setSealFotos(await resolvePhotoBatch(latestPhotoBatch(sealData || [])));
            } catch (error: unknown) {
                console.error(error);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [info.recipient, info.cargo, getPhotos]);

    return (
        <div className={offerStyles.offerCard}>
            <div className={offerStyles.notificationCard}>
                <div className={offerStyles.notificationHeader}>
                    <div className={offerStyles.notificationTitleRow}>
                        <IonIcon icon={cubeOutline} className={offerStyles.notificationIcon} />
                        <h2 className={offerStyles.notificationTitle}>Погружено</h2>
                    </div>
                    <p className={offerStyles.notificationSubtitle}>
                        Груз погружен, можно отправлять транспорт
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

            {(cargoFotos.length > 0 || sealFotos.length > 0) && (
                <div className="mt-05 mb-05">
                    {cargoFotos.length > 0 && (
                        <>
                            <label className={offerStyles.label}>Фото груза</label>
                            <div className="flex flex-wrap mt-02">
                                {cargoFotos.map((src, index) => (
                                    <div key={`c-${index}`} className="ml-05 mr-05">
                                        <img
                                            src={src}
                                            alt={`Фото груза ${index + 1}`}
                                            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }}
                                            onClick={() => setPreviewUrl(src)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                    {sealFotos.length > 0 && (
                        <>
                            <label className={offerStyles.label}>Фото пломбы</label>
                            <div className="flex flex-wrap mt-02">
                                {sealFotos.map((src, index) => (
                                    <div key={`s-${index}`} className="ml-05 mr-05">
                                        <img
                                            src={src}
                                            alt={`Фото пломбы ${index + 1}`}
                                            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }}
                                            onClick={() => setPreviewUrl(src)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            <div className={offerStyles.actions}>
                <div className={offerStyles.buttonsRow}>
                    {onSend && (
                        <IonButton
                            className={offerStyles.acceptButton}
                            expand="block"
                            onClick={() => onSend(info)}
                            disabled={isLoading}
                        >
                            <span>Отправить</span>
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

            <PhotoPreview
                imageUrl={previewUrl}
                closeModal={() => setPreviewUrl('')}
            />
        </div>
    );
}

