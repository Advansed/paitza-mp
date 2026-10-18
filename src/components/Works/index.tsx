/**
 * Главный компонент модуля Works
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { WorkInfo, OfferInfo, WorkStatus } from './types';
import { WorksList, WorkView } from './components';
import { WorkMap } from './components/WorkMap';
import { Agreement } from './components/WorkView/index';
import { useWorks } from './useWorks';
import { useWorkNavigation } from './hooks/useNavigation';
import { isLocallyOffered, workActions, workGetters, useWorkStore } from './workStore';
import { SaveData, WorkPage1 } from './components/WorkPage1';
import { useSocket } from '../../Store/useSocket';
import { offerTaxAmount, useLoginStore, useToken } from '../../Store/loginStore';
import { useAccountStore } from '../../Store/accountStore';
import { useToast } from '../Toast';
import { formatters } from '../../utils/utils';
import { useChats } from '../../Store/useChats';
import { transportGetters } from '../../Store/transportStore';
import { IonLoading } from '@ionic/react';
import { filterWorksByMode, findWorkByRef, normalizeWorkStatus, type WorksListMode } from './statusFlow';
import { LOAD_CARGO_PHOTO_STATUS, LOAD_SEAL_PHOTO_STATUS } from '../../utils/orderPhotos';
import './styles.css';

export const Works: React.FC<{ mode?: WorksListMode }> = ({ mode = 'all' }) => {
    const { t } = useTranslation('works');
    const { contract, works, isLoading, setOffer, delOffer, setStatus, refreshWorks
        , get_contract_data, set_contract } = useWorks();
    const { emit, socket } = useSocket();
    const token = useToken();
    const toast = useToast();
    const { sendImage } = useChats();

    const { currentPage, navigateTo, goBack } = useWorkNavigation();

    const visibleWorks = useMemo(
        () => filterWorksByMode(works, mode),
        [works, mode]
    );

    // Смена режима списка — закрыть карточку и показать список
    useEffect(() => {
        useWorkStore.getState().setCurrentPage({ type: 'list' });
        useWorkStore.getState().setNavigationHistory([{ type: 'list' }]);
    }, [mode]);

    const emptyTitle =
        mode === 'feed'
            ? t('emptyFeedTitle')
            : mode === 'mine'
              ? t('emptyMineTitle')
              : t('emptyAllTitle');

    const emptyHint =
        mode === 'feed'
            ? t('emptyFeedHint')
            : mode === 'mine'
              ? t('emptyMineHint')
              : t('emptyAllHint');

    // Обновляем currentPage.work (+ history) при push get_works
    const pageType = currentPage.type;
    const pageWork =
        'work' in currentPage ? currentPage.work : undefined;
    const pageWorkGuid = pageWork?.guid;
    const pageWorkCargo = pageWork?.cargo;
    const pageWorkStatus = pageWork?.status;
    const pageWorkPrice = pageWork?.price;
    const pageWorkSigned = pageWork ? Boolean(pageWork.signed) : undefined;
    const pageWorkRef = pageWork;
    const pageContract =
        currentPage.type === 'agreement' ? currentPage.contract : undefined;

    useEffect(() => {
        if (!pageWork) return;

        const stored = findWorkByRef(works, pageWork);
        if (!stored) return;
        const updatedWork =
            isLocallyOffered(stored) && normalizeWorkStatus(stored.status) === WorkStatus.NEW
                ? { ...stored, status: WorkStatus.OFFERED }
                : stored;

        const changed =
            updatedWork.status !== pageWorkStatus ||
            updatedWork.price !== pageWorkPrice ||
            Boolean(updatedWork.signed) !== pageWorkSigned ||
            (updatedWork === stored && stored !== pageWorkRef);

        if (!changed) return;

        if (pageType === 'view') {
            workActions.replaceCurrentPage({ type: 'view', work: updatedWork });
            return;
        }
        if (pageType === 'map') {
            workActions.replaceCurrentPage({ type: 'map', work: updatedWork });
            return;
        }
        if (pageType === 'agreement') {
            workActions.replaceCurrentPage({
                type: 'agreement',
                work: updatedWork,
                contract: pageContract,
            });
        }
    }, [
        works,
        pageType,
        pageWork,
        pageWorkGuid,
        pageWorkCargo,
        pageWorkStatus,
        pageWorkPrice,
        pageWorkSigned,
        pageWorkRef,
        pageContract,
    ]);

    const handleWorkClick                                    = (work: WorkInfo) => {
        navigateTo({ type: 'view', work });
    };

    const loadBalance = () => new Promise<number | null>((resolve) => {
        const current = useAccountStore.getState().accountData;
        if (!socket || !token) {
            resolve(current?.balance ?? null);
            return;
        }

        let done = false;
        let timer = 0;
        const finish = (value: number | null) => {
            if (done) return;
            done = true;
            window.clearTimeout(timer);
            socket.off('get_balance', onBalance);
            resolve(value);
        };
        const onBalance = (response: { success?: boolean; data?: { balance?: number } }) => {
            const fromResponse = Number(response?.data?.balance);
            if (response?.success && Number.isFinite(fromResponse)) {
                finish(fromResponse);
                return;
            }
            finish(useAccountStore.getState().accountData?.balance ?? null);
        };
        timer = window.setTimeout(() => {
            finish(useAccountStore.getState().accountData?.balance ?? null);
        }, 8000);

        socket.once('get_balance', onBalance);
        socket.emit('get_balance', { token });
    });

    const handleOfferClick                                   = async (work: WorkInfo): Promise<boolean> => {
        // Формируем предложение из данных работы
        // Транспорт берется из work.transport, который был выбран в OfferCard
        const offerData: OfferInfo = {
            guid: work.cargo,
            recipient: work.recipient,
            price: work.price,
            weight: work.weight,
            volume: work.volume,
            transport: work.transport || transportGetters.getData()?.guid || '',
            comment: '',
            status: 11 // WorkStatus.OFFERED
        };

        const tax = useLoginStore.getState().tax;
        const required = offerTaxAmount(offerData.price, tax);
        if (required > 0) {
            const balance = await loadBalance();
            if (balance == null || balance < required) {
                toast.error(
                    `Для отправки предложения на счёте должно быть ${formatters.currency(required)} (${tax}% от цены). Сейчас ${formatters.currency(balance ?? 0)}.`
                );
                return false;
            }
        }

        // Отправляем предложение
        const res = await setOffer(offerData, { guid: work.guid, cargo: work.cargo });

        if (res) {
            // Отправляем сообщение в чат
            emit("send_message", {
                token: token,
                recipient: offerData.recipient,
                cargo: offerData.guid || work.guid,
                message: "Сделал предложение: Сумма - " + offerData.price.toFixed() + " рублей",
                image: "",
            });

            const offered: WorkInfo = {
                ...work,
                cargo: work.cargo || offerData.guid,
                status: WorkStatus.OFFERED,
                price: offerData.price,
                weight: offerData.weight,
                volume: offerData.volume,
                transport: offerData.transport || work.transport,
            };
            workActions.replaceCurrentPage({ type: 'view', work: offered });

            await refreshWorks();
            return true;
        }
        return false;
    };

    const handleOfferCancelClick                             = async (work: WorkInfo) => {
        // guid — идентификатор сделки (не груза)
        const offerData: OfferInfo = {
            guid: work.guid,
            recipient: work.recipient,
            price: work.price,
            weight: work.weight,
            volume: work.volume,
            transport: work.transport || transportGetters.getData()?.guid || '',
            comment: '',
            status: 11 // WorkStatus.OFFERED
        };

        // Удаляем предложение
        const res = await delOffer(offerData);

        if (res) {
            // Отправляем сообщение в чат
            emit("send_message", {
                token: token,
                recipient: offerData.recipient,
                cargo: work.cargo,
                message: "Отозвал предложение",
                image: "",
            });

            const updated =
                useWorkStore.getState().works.find((w) => w.guid === work.guid) ||
                { ...work, status: WorkStatus.NEW };
            workActions.setCurrentPage({ type: 'view', work: updated });

            await refreshWorks();
        }
    };

    const handleLoaded                                       = async (work: WorkInfo, data: { verified: boolean; cargoPhotos: string[]; sealPhotos: string[] }) => {
        try {
            const uploadResults = await Promise.all([
                ...data.cargoPhotos.map(image => sendImage(work.recipient, work.cargo, image, LOAD_CARGO_PHOTO_STATUS)),
                ...data.sealPhotos.map(image => sendImage(work.recipient, work.cargo, image, LOAD_SEAL_PHOTO_STATUS)),
            ]);
            if (uploadResults.some(ok => !ok)) {
                throw new Error('Не удалось отправить фото груза или пломбы');
            }
            emit("send_message", {
                token,
                recipient: work.recipient,
                cargo: work.cargo,
                message: "Груз загружен и опломбирован, фото приложено",
            });
            const ok = await setStatus(work);
            if (!ok) throw new Error('Не удалось подтвердить погрузку');
            await refreshWorks();
        } catch (err) {
            console.error("handleLoaded error:", err);
            throw err;
        }
    };

    const handleArrivedAtLoad                                = async (work: WorkInfo, data: { bodyPhotos: string[] }) => {
        try {
            const uploadResults = await Promise.all(
                data.bodyPhotos.map(image => sendImage(work.recipient, work.cargo, image, 14))
            );
            if (uploadResults.some(ok => !ok)) {
                throw new Error('Не удалось отправить фото кузова');
            }
            emit("send_message", {
                token,
                recipient: work.recipient,
                cargo: work.cargo,
                message: "Транспорт прибыл на точку погрузки, фото кузова приложено",
            });
            const ok = await setStatus(work);
            if (!ok) throw new Error('Не удалось подтвердить прибытие на погрузку');
            await refreshWorks();
        } catch (err) {
            console.error("handleArrivedAtLoad error:", err);
            throw err;
        }
    };

    const handleSendLoadedPhotos                             = async (
        work: WorkInfo,
        data: { cargoPhotos: Array<string | File>; sealPhotos: Array<string | File> }
    ) => {
        try {
            const uploadResults = await Promise.all([
                ...data.cargoPhotos.map(image => sendImage(work.recipient, work.cargo, image, LOAD_CARGO_PHOTO_STATUS)),
                ...data.sealPhotos.map(image => sendImage(work.recipient, work.cargo, image, LOAD_SEAL_PHOTO_STATUS)),
            ]);
            if (uploadResults.some(ok => !ok)) {
                throw new Error('Не удалось отправить фото груза или пломбы');
            }
            emit("send_message", {
                token,
                recipient: work.recipient,
                cargo: work.cargo,
                message: "Фото груза и пломбы обновлены",
            });
        } catch (err) {
            console.error("handleSendLoadedPhotos error:", err);
            throw err;
        }
    };

    const handleSendBodyPhotos                               = async (
        work: WorkInfo,
        data: { bodyPhotos: Array<string | File> }
    ) => {
        try {
            const uploadResults = await Promise.all(
                data.bodyPhotos.map(image => sendImage(work.recipient, work.cargo, image, 14))
            );
            if (uploadResults.some(ok => !ok)) {
                throw new Error('Не удалось отправить фото кузова');
            }
            emit("send_message", {
                token,
                recipient: work.recipient,
                cargo: work.cargo,
                message: "Фото кузова обновлены",
            });
        } catch (err) {
            console.error("handleSendBodyPhotos error:", err);
            throw err;
        }
    };

    const handleArrivedUnload                                = async (
        work: WorkInfo,
        data: { verified: boolean; cargoPhotos: string[]; sealPhotos: string[] }
    ) => {
        try {
            const uploadResults = await Promise.all([
                ...data.cargoPhotos.map(image => sendImage(work.recipient, work.cargo, image, 18)),
                ...data.sealPhotos.map(image => sendImage(work.recipient, work.cargo, image, 18)),
            ]);
            if (uploadResults.some(ok => !ok)) {
                throw new Error('Не удалось отправить одно или несколько фото');
            }
            emit("send_message", {
                token,
                recipient: work.recipient,
                cargo: work.cargo,
                message:
                    "Транспорт прибыл на точку разгрузки, груз и пломба в порядке, фото приложено",
            });
            // Только прибытие: IN_WORK (16) → TO_UNLOAD / «Доставлено» (17).
            // «Разгружается» (18) выставляет заказчик при начале разгрузки.
            const okArrived = await setStatus(work);
            if (!okArrived) throw new Error('Не удалось подтвердить прибытие на выгрузку');
            await refreshWorks();
        } catch (err) {
            console.error("handleArrivedUnload error:", err);
            throw err;
        }
    };

    const handleUnloadComplete                               = async (work: WorkInfo, data: { bodyPhotos: string[] }) => {
        try {
            const uploadResults = await Promise.all(
                data.bodyPhotos.map(image => sendImage(work.recipient, work.cargo, image, 20))
            );
            if (uploadResults.some(ok => !ok)) {
                throw new Error('Не удалось отправить фото кузова');
            }
            emit("send_message", {
                token,
                recipient: work.recipient,
                cargo: work.cargo,
                message: "Транспорт разгружен, фото кузова после разгрузки приложено",
            });
            const ok = await setStatus(work);
            if (!ok) throw new Error('Не удалось обновить статус');
            await refreshWorks();
        } catch (err) {
            console.error("handleUnloadComplete error:", err);
            throw err;
        }
    };

    const handleMapClick                                     = (work: WorkInfo) => {
        navigateTo({ type: 'map', work });
    };

    const handleSignContract                                 = useCallback(async (work: WorkInfo) => {
        const contractData = await get_contract_data(work);
        if (contractData) {
            navigateTo({ type: 'agreement', work, contract: contractData });
        }
    }, [get_contract_data, navigateTo]);

    const handleAgreementSign                                = useCallback(async (signature: string, _offer: OfferInfo) => {
        void _offer;
        if (currentPage.type !== 'agreement') return false;
        const ok = await set_contract(currentPage.work, signature);
        if (!ok) return false;
        const work =
            workGetters.getWork(currentPage.work.guid) ?? { ...currentPage.work, signed: true };
        const state = useWorkStore.getState();
        const hist = state.navigationHistory;
        const last = hist[hist.length - 1];
        if (last?.type === 'agreement') {
            workActions.setNavigationHistory(hist.slice(0, -1));
        }
        workActions.setCurrentPage({ type: 'view', work });
        void refreshWorks();
        return true;
    }, [currentPage, set_contract, refreshWorks]);

    const handleSavePage1                                    = async (data: SaveData) => {
        if (currentPage.type === "page1") {
            set_contract(currentPage.work, data.sign);
            setStatus(currentPage.work);
            for (const elem of data.bodyPhotos) {
                const { uploadOrderPhoto } = await import('../../utils/fileUpload');
                const { filePath } = await uploadOrderPhoto(elem, {
                    cargo_id: currentPage.work.cargo,
                    recipient_id: currentPage.work.recipient,
                });
                emit("send_message", {
                    token,
                    recipient: currentPage.work.recipient,
                    cargo: currentPage.work.cargo,
                    message: "",
                    image: filePath,
                });
            }
            emit("send_message", {
                token: token,
                recipient: currentPage.work.recipient,
                cargo: currentPage.work.cargo,
                message: "Транспорт осмотрен, документы проверены, фото кузова приложено, транспорт готов к погрузке",
                image: "",
            });
        }

        return true;
    };

    const renderPage                                         = () => {
        switch (currentPage.type) {
            case 'list':
                return (
                    <WorksList
                        works                     = { visibleWorks }
                        isLoading                 = { isLoading }
                        onWorkClick               = { handleWorkClick }
                        onRefresh                 = { refreshWorks }
                        emptyTitle                = { emptyTitle }
                        emptyHint                 = { emptyHint }
                        variant                   = { mode === 'feed' ? 'feed' : 'simple' }
                    />
                );

            case 'view':
                return (
                    <WorkView
                        work                      = { currentPage.work }
                        onBack                    = { goBack }
                        onOfferClick              = { handleOfferClick }
                        onOfferCancelClick        = { handleOfferCancelClick }
                        onLoaded                  = { handleLoaded }
                        onArrivedAtLoad           = { handleArrivedAtLoad }
                        onSendBodyPhotos          = { handleSendBodyPhotos }
                        onSendLoadedPhotos        = { handleSendLoadedPhotos }
                        onArrivedUnload           = { handleArrivedUnload }
                        onUnloadComplete          = { handleUnloadComplete }
                        onMapClick                = { handleMapClick }
                        onSignContract            = { handleSignContract }
                    />
                );

            case 'map':
                return (
                    <WorkMap
                        work                      = { currentPage.work }
                        onBack                    = { goBack }
                    />
                );

            case 'page1':
                return (
                    <WorkPage1
                        work                      = { currentPage.work }
                        pdf                       = { contract ?? '' }
                        onBack                    = { goBack }
                        onSave                    = { handleSavePage1 }
                    />
                );

            case 'agreement':
                if (currentPage.type !== 'agreement') return null;
                return (
                    <Agreement
                        work                      = { currentPage.work }
                        contractData              = { currentPage.contract }
                        onBack                    = { goBack }
                        onSign                    = { handleAgreementSign }
                    />
                );

            default:
                return (
                    <WorksList
                        works                    = { visibleWorks }
                        isLoading                = { isLoading }
                        onWorkClick              = { handleWorkClick }
                        onRefresh                = { refreshWorks }
                        emptyTitle               = { emptyTitle }
                        emptyHint                = { emptyHint }
                        variant                  = { mode === 'feed' ? 'feed' : 'simple' }
                    />
                );
        }
    };

    return (
        <div className="w-100">
            <IonLoading isOpen={isLoading} message={"Подождите..."} />
            {
                renderPage()

            }
        </div>
    );
};

// Экспорт типов для внешнего использования
export type {
    WorkInfo,
    WorkStatus,
    WorkPriority,
    OfferInfo,
    OfferStatus,
    CreateOfferData,
    WorkFilters,
    WorkPageType,
    DriverTransport
} from './types';

// Экспорт компонентов для внешнего использования
export {
    WorkCard,
    WorksList,
    WorkView,
    WorkOffer
} from './components';
