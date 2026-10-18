import React from 'react';
import { ContractSignedCard } from './ContractSignedCard';
import { OnLoadingCard } from './OnLoadingCard';
import { LoadingStartedCard } from './LoadingStartedCard';
import { LoadedCard } from './LoadedCard';
import { OnWayCard } from './OnWayCard';
import { ToUnloadCard } from './ToUnloadCard';
import { ArrivedUnloadCard } from './ArrivedUnloadCard';
import { UnloadingCard } from './UnloadingCard';
import { CompletedCard } from './CompletedCard';
import { FinalCard } from './FinalCard';
import { DriverInfo } from '../../../../Store/cargoStore';
import { OfferCard } from './OfferCard';

export interface DriverInfoProps {
    info: DriverInfo;
    onAccept?: (info: DriverInfo) => void;
    onReject?: (info: DriverInfo) => void;
    onChat?: (info: DriverInfo) => void;
    onStartLoading?: (info: DriverInfo) => void;
    onSend?: (info: DriverInfo) => void;
    onStartUnloading?: (info: DriverInfo) => void;
    onComplete?: (info: DriverInfo, rating: number, completed: boolean) => void;
    isLoading?: boolean;
}

export const DriverCard: React.FC<DriverInfoProps> = ({
    info,
    onAccept,
    onReject,
    onChat,
    onStartLoading,
    onSend,
    onStartUnloading,
    onComplete,
    isLoading = false
}) => {
    const inner = (() => {
        switch (info.status) {
            case 'Заказано':
                return (
                    <OfferCard
                        info={info}
                        onAccept={onAccept}
                        onReject={onReject}
                        isLoading={isLoading}
                    />
                );
            case 'Принято':
                return <ContractSignedCard info={info} onChat={onChat} isLoading={isLoading} />;
            case 'На погрузке':
                return (
                    <OnLoadingCard
                        info={info}
                        onChat={onChat}
                        onStartLoading={onStartLoading}
                        isLoading={isLoading}
                    />
                );
            case 'Загружается':
                return (
                    <LoadingStartedCard
                        info={info}
                        onChat={onChat}
                        isLoading={isLoading}
                    />
                );
            case 'Загружено':
                return (
                    <LoadedCard info={info} onChat={onChat} onSend={onSend} isLoading={isLoading} />
                );
            case 'В пути':
                return <OnWayCard info={info} />;
            case 'Прибыл':
                return (
                    <ArrivedUnloadCard info={info} onChat={onChat} isLoading={isLoading} />
                );
            case 'Доставлено':
                return (
                    <ToUnloadCard
                        info={info}
                        onChat={onChat}
                        onStartUnloading={onStartUnloading}
                        isLoading={isLoading}
                    />
                );
            case 'Разгружается':
                return <UnloadingCard info={info} onChat={onChat} isLoading={isLoading} />;
            case 'Разгружено':
                return (
                    <CompletedCard info={info} onChat={onChat} onComplete={onComplete} isLoading={isLoading} />
                );
            case 'Завершено':
                return <FinalCard info={info} onChat={onChat} isLoading={isLoading} />;
            default:
                return <></>;
        }
    })();

    return <div className="p-05">{inner}</div>;
};
