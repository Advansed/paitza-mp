import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IonModal, useIonRouter } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { ArrowLeft, Handshake, MessageSquare, X } from 'lucide-react';
import { WorkInfo, WorkStatus } from '../../types';
import { isLocallyOffered, useWorkStore } from '../../workStore';
import { companyGetters, useCompanyStore } from '../../../../Store/companyStore';
import { useTransportStore } from '../../../../Store/transportStore';
import { useToast } from '../../../Toast';
import { useChats } from '../../../../Store/useChats';
import { WORK_CURRENT_ACTION, findWorkByRef, normalizeWorkStatus } from '../../statusFlow';
import { getWorkCustomerName, workFormatters } from '../../utils';
import {
  feedStatusKind,
  feedStatusLabel,
  fleetSlots,
  publishedDateTime,
  resolvePublishedAt,
} from '../../feedFormat';
import { CounterOfferCard } from './OfferCard';
import { ContractCard } from './ContractCard';
import { ArrivedCard } from './ArrivedCard';
import { OnLoadWaitCard } from './OnLoadWaitCard';
import { LoadedCard } from './LoadedCard';
import { LoadedWaitDispatchCard } from './LoadedWaitDispatchCard';
import { InWorkCard } from './InWorkCard';
import { ToUnloadCard } from './ToUnloadCard';
import { UnloadingCard } from './UnloadingCard';
import { UnloadedWaitCard } from './UnloadedWaitCard';
import { WorkOrderInfo } from './WorkOrderInfo';
import { StatusTimeline } from './StatusTimeline';
import { OrganizationRequiredModal } from '../../../OrganizationRequiredModal';
import styles from './WorkView.module.css';

interface WorkViewProps {
    work: WorkInfo;
    onBack: () => void;
    onOfferClick: (work: WorkInfo) => Promise<boolean> | boolean;
    onOfferCancelClick: (work: WorkInfo) => void;
    onLoaded?: (work: WorkInfo, data: { verified: boolean; cargoPhotos: string[]; sealPhotos: string[] }) => Promise<void>;
    onArrivedAtLoad?: (work: WorkInfo, data: { bodyPhotos: string[] }) => Promise<void>;
    onSendBodyPhotos?: (work: WorkInfo, data: { bodyPhotos: Array<string | File> }) => Promise<void>;
    onSendLoadedPhotos?: (
        work: WorkInfo,
        data: { cargoPhotos: Array<string | File>; sealPhotos: Array<string | File> }
    ) => Promise<void>;
    onArrivedUnload?: (
        work: WorkInfo,
        data: { verified: boolean; cargoPhotos: string[]; sealPhotos: string[] }
    ) => Promise<void>;
    onUnloadComplete?: (work: WorkInfo, data: { bodyPhotos: string[] }) => Promise<void>;
    onMapClick: (work: WorkInfo) => void;
    onSignContract?: (work: WorkInfo) => void;
}

export const WorkView: React.FC<WorkViewProps> = ({
    work,
    onBack,
    onOfferClick,
    onOfferCancelClick,
    onLoaded,
    onArrivedAtLoad,
    onSendBodyPhotos,
    onSendLoadedPhotos,
    onArrivedUnload,
    onUnloadComplete,
    onMapClick,
    onSignContract
}) => {
    const { t } = useTranslation('works');
    const works = useWorkStore(state => state.works);
    const archiveWorks = useWorkStore(state => state.archiveWorks);
    const hist = useIonRouter();
    const history = useHistory();
    const toast = useToast();
    const { setCurrentChat } = useChats();
    const [actionOpen, setActionOpen] = useState(false);

    // Живой объект из стора (guid/cargo), иначе снимок из навигации
    const storeWork = useMemo(() => {
        return findWorkByRef(works, work) ?? findWorkByRef(archiveWorks, work) ?? work;
    }, [works, archiveWorks, work]);

    // Явная подписка на статус/подпись — гарантирует ре-рендер таймлайна при push
    const liveStatus = useWorkStore((state) => {
        const found = findWorkByRef(state.works, work) ?? findWorkByRef(state.archiveWorks, work);
        const status = found ? normalizeWorkStatus(found.status) : normalizeWorkStatus(work.status);
        if ((found ? isLocallyOffered(found) : isLocallyOffered(work)) &&
            (status === WorkStatus.NEW || status === WorkStatus.OFFERED)) {
            return WorkStatus.OFFERED;
        }
        return status;
    });
    const liveSigned = useWorkStore((state) => {
        const found = findWorkByRef(state.works, work) ?? findWorkByRef(state.archiveWorks, work);
        return found ? Boolean(found.signed) : Boolean(work.signed);
    });

    const workInfo = useMemo(
        () => ({
            ...storeWork,
            status: liveStatus,
            signed: liveSigned,
        }),
        [storeWork, liveStatus, liveSigned]
    );

    const companyData = useCompanyStore((state) => state.data);
    const companyLoading = useCompanyStore((state) => state.isLoading);
    const companyCompletion = useMemo(
        () => companyGetters.getCompletionPercentage(),
        [companyData]
    );
    const transportItems = useTransportStore((state) => state.items);
    const transportData = useTransportStore((state) => state.data);
    const transportLoading = useTransportStore((state) => state.isLoading);
    const hasTransport =
        transportItems.length > 0 ||
        Boolean(transportData?.guid || transportData?.license_plate || transportData?.number);
    const organizationRequired = !companyLoading && companyCompletion < 80;

    const actionHint = WORK_CURRENT_ACTION[workInfo.status] || t('orderActionHint');
    const hasInteractiveAction =
        workInfo.status !== WorkStatus.COMPLETED &&
        workInfo.status !== WorkStatus.REJECTED;
    const slots = fleetSlots(workInfo);
    const slotsOpen = !slots || slots.free > 0;
    const isBidding = workInfo.status === WorkStatus.OFFERED;
    const isNew = workInfo.status === WorkStatus.NEW;
    const ctaDisabled =
        workInfo.status === WorkStatus.REJECTED ||
        workInfo.status === WorkStatus.COMPLETED ||
        (isNew && !slotsOpen);
    const ctaLabel =
        workInfo.status === WorkStatus.REJECTED
            ? t('ctaRejected')
            : workInfo.status === WorkStatus.COMPLETED
              ? t('ctaCompleted')
              : isNew && !slotsOpen
                ? t('ctaSlotsFull')
                : isNew
                  ? t('ctaRespond')
                  : isBidding
                    ? t('ctaChangeOffer')
                    : workInfo.status === WorkStatus.TO_LOAD && !workInfo.signed
                      ? t('ctaSignContract')
                      : workInfo.status === WorkStatus.TO_LOAD && workInfo.signed
                        ? t('ctaArrivedLoad')
                      : workInfo.status === WorkStatus.ON_LOAD
                        ? t('ctaBodyPhotos')
                        : workInfo.status === WorkStatus.LOADED
                          ? t('ctaCargoPhotos')
                          : hasInteractiveAction
                          ? t('ctaContinue')
                          : '';
    const statusKind = feedStatusKind(workInfo.status);
    const badgeClass =
        statusKind === 'new'
            ? styles.badge_new
            : statusKind === 'bids'
              ? styles.badge_bids
              : statusKind === 'done'
                ? styles.badge_done
                : statusKind === 'alert'
                  ? styles.badge_alert
                  : styles.badge_work;
    const publishedAt = resolvePublishedAt(workInfo);
    const subtitleParts = [
        workInfo.category?.trim() || '',
        publishedAt ? t('publishedLine', { date: publishedDateTime(publishedAt) }) : '',
    ].filter(Boolean);

    // Смена этапа с сервера — закрыть модалку, чтобы показать новое действие
    useEffect(() => {
        setActionOpen(false);
    }, [liveStatus, liveSigned]);

    useEffect(() => {
        if (companyLoading || transportLoading || companyCompletion < 80) return;
        if (hasTransport) return;
        onBack();
        toast.info(t('addTransportToast'));
        hist.push('/vehicles');
    }, [companyLoading, companyCompletion, transportLoading, hasTransport, onBack, toast, hist, t]);

    const handleOffer = async (data: Partial<WorkInfo>, volume: number): Promise<void> => {
        const updatedWork: WorkInfo = {
            ...workInfo,
            ...data,
            volume
        };
        const ok = await onOfferClick(updatedWork);
        if (ok) setActionOpen(false);
    };

    const handleCancelOffer = async (data: Partial<WorkInfo>, volume: number): Promise<void> => {
        const updatedWork: WorkInfo = {
            ...workInfo,
            ...data,
            volume
        };
        onOfferCancelClick(updatedWork);
        setActionOpen(false);
    };

    const closeAfter = async (fn: () => Promise<void>) => {
        await fn();
        setActionOpen(false);
    };

    const handleOpenChat = () => {
        const recipient = workInfo.recipient;
        const cargo = workInfo.cargo || workInfo.guid;
        const name = getWorkCustomerName(workInfo) || t('sender');
        if (!recipient || !cargo) {
            toast.error(t('chatOpenError'));
            return;
        }
        setCurrentChat(recipient, cargo);
        history.push(`/chats/${recipient}:${cargo}:${encodeURIComponent(name)}`);
    };

    const actionContent = (
        <>
            {workInfo.status === WorkStatus.NEW && (
                <CounterOfferCard work={workInfo} onSubmit={handleOffer} />
            )}

            {workInfo.status === WorkStatus.OFFERED && (
                <CounterOfferCard work={workInfo} onSubmit={handleCancelOffer} />
            )}

            {workInfo.status === WorkStatus.TO_LOAD && !workInfo.signed && (
                <ContractCard
                    work={workInfo}
                    onSignContract={() => {
                        if (onSignContract) onSignContract(workInfo);
                        setActionOpen(false);
                    }}
                />
            )}

            {workInfo.status === WorkStatus.TO_LOAD && workInfo.signed && (
                <ArrivedCard
                    work={workInfo}
                    onArrived={(data) =>
                        closeAfter(() =>
                            onArrivedAtLoad ? onArrivedAtLoad(workInfo, data) : Promise.resolve()
                        )
                    }
                />
            )}

            {workInfo.status === WorkStatus.ON_LOAD && (
                <OnLoadWaitCard
                    work={workInfo}
                    onSendBodyPhotos={(data) =>
                        onSendBodyPhotos ? onSendBodyPhotos(workInfo, data) : Promise.resolve()
                    }
                />
            )}

            {workInfo.status === WorkStatus.LOADING && (
                <LoadedCard
                    work={workInfo}
                    onLoaded={(data) =>
                        closeAfter(() =>
                            onLoaded ? onLoaded(workInfo, data) : Promise.resolve()
                        )
                    }
                />
            )}

            {workInfo.status === WorkStatus.LOADED && (
                <LoadedWaitDispatchCard
                    work={workInfo}
                    onSendLoadedPhotos={(data) =>
                        onSendLoadedPhotos ? onSendLoadedPhotos(workInfo, data) : Promise.resolve()
                    }
                />
            )}

            {workInfo.status === WorkStatus.IN_WORK && (
                <InWorkCard
                    work={workInfo}
                    onArrivedUnload={(data) =>
                        closeAfter(() =>
                            onArrivedUnload ? onArrivedUnload(workInfo, data) : Promise.resolve()
                        )
                    }
                />
            )}

            {workInfo.status === WorkStatus.TO_UNLOAD && <ToUnloadCard work={workInfo} />}

            {workInfo.status === WorkStatus.UNLOADING && (
                <UnloadingCard
                    work={workInfo}
                    onCompleted={(data) =>
                        closeAfter(() =>
                            onUnloadComplete ? onUnloadComplete(workInfo, data) : Promise.resolve()
                        )
                    }
                />
            )}

            {workInfo.status === WorkStatus.UNLOADED && (
                <UnloadedWaitCard work={workInfo} />
            )}

            {workInfo.status === WorkStatus.COMPLETED && (
                <div className={styles.doneNote}>
                    {t('orderDoneNote')}
                </div>
            )}

            {workInfo.status === WorkStatus.REJECTED && (
                <div className={styles.doneNote}>
                    {t('orderRejectedNote')}
                </div>
            )}
        </>
    );

    return (
        <div className={styles.view}>
            <button type="button" className={styles.backBtn} onClick={onBack}>
                <ArrowLeft size={16} strokeWidth={2} />
                {t('backToFeed')}
            </button>

            <header className={styles.head}>
                <div className={styles.headMeta}>
                    <span className={`${styles.badge} ${badgeClass}`}>
                        {feedStatusLabel(workInfo.status)}
                    </span>
                    <span className={styles.headId}>
                        ЗК-{workFormatters.shortId(workInfo.guid || workInfo.cargo)}
                    </span>
                </div>
                <h1 className={styles.title}>{workInfo.name || t('untitled')}</h1>
                {subtitleParts.length > 0 && (
                    <p className={styles.subtitle}>{subtitleParts.join(' · ')}</p>
                )}
            </header>

            <StatusTimeline work={workInfo} />

            <div className={styles.body}>
                <WorkOrderInfo work={workInfo} onMapClick={onMapClick} />

                {isBidding && (
                    <section className={styles.bidsCard}>
                        <p className={styles.bidsTitle}>
                            <Handshake size={16} strokeWidth={2} />
                            {t('bidsTitle')}
                        </p>
                        <p className={styles.bidsText}>
                            {t('bidsText')}
                        </p>
                        <div className={styles.bidsActions}>
                            <button
                                type="button"
                                className={styles.bidsPrimary}
                                onClick={() => setActionOpen(true)}
                            >
                                <Handshake size={16} strokeWidth={2} />
                                {t('bargain')}
                            </button>
                            <button
                                type="button"
                                className={styles.bidsGhost}
                                onClick={handleOpenChat}
                            >
                                <MessageSquare size={16} strokeWidth={2} />
                                {t('chatWithCustomer')}
                            </button>
                            <button
                                type="button"
                                className={styles.bidsDanger}
                                onClick={() => onOfferCancelClick(workInfo)}
                            >
                                {t('cancelOrder')}
                            </button>
                        </div>
                    </section>
                )}

                {workInfo.status === WorkStatus.REJECTED && (
                    <p className={styles.refusedNote}>
                        {t('refusedNote')}
                    </p>
                )}
            </div>

            <div className={styles.footer}>
                {ctaLabel && (
                    <button
                        type="button"
                        className={`${styles.actionCta} ${ctaDisabled ? styles.actionCtaDisabled : ''}`}
                        onClick={() => {
                            if (!ctaDisabled) setActionOpen(true);
                        }}
                        disabled={ctaDisabled}
                    >
                        {ctaLabel}
                    </button>
                )}
                <button
                    type="button"
                    className={styles.chatCta}
                    onClick={handleOpenChat}
                    aria-label={t('writeToSender')}
                >
                    <MessageSquare size={20} strokeWidth={1.75} />
                </button>
            </div>

            <OrganizationRequiredModal
                isOpen={organizationRequired}
                onClose={onBack}
                onGoProfile={() => history.push('/profile')}
            />

            <IonModal
                isOpen={actionOpen}
                onDidDismiss={() => setActionOpen(false)}
                className={styles.actionModal}
            >
                <div className={styles.modalShell}>
                    <div className={styles.modalHead}>
                        <div>
                            <div className={styles.modalKicker}>{t('orderKicker')}</div>
                            <h2 className={styles.modalTitle}>{t('orderAction')}</h2>
                            {workInfo.status !== WorkStatus.NEW &&
                              workInfo.status !== WorkStatus.OFFERED &&
                              actionHint && (
                                <p className={styles.modalHint}>{actionHint}</p>
                              )}
                        </div>
                        <button
                            type="button"
                            className={styles.modalClose}
                            onClick={() => setActionOpen(false)}
                            aria-label="Закрыть"
                        >
                            <X size={20} strokeWidth={2} />
                        </button>
                    </div>
                    <div className={styles.modalBody}>{actionContent}</div>
                </div>
            </IonModal>
        </div>
    );
};

export { Agreement } from './Agreement';
export type { ContractData } from './Agreement';
