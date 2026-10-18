import './styles.css';

import React, { useCallback, useEffect }            from 'react';
import { IonLoading }                               from '@ionic/react';
import { cargoGetters, CargoInfo, DriverInfo
    , EMPTY_CARGO, PageType }                       from '../../Store/cargoStore';
import { useSocket }                                from '../../Store/useSocket';
import { useToken }                                 from '../../Store/loginStore';
import { Agreement }                                from '../Offers/Agreement';
import { CargoNew }                                 from './components';
import { CargoInvoice }                             from './components/CargoInvoices';
import { CargoMap }                                 from './components/CargoMap';
import { CargosList }                               from './components/CargosList';
import { CargoView }                                from './components/CargoView';
import { InsurancePage }                            from './components/InsurancePage';
import { PrepaymentPage }                           from './components/PrePayment';
import { useCargos, type UseCargosReturn }          from './hooks/useCargos';
import { useInvoices }                              from './hooks/useInvoices';
import { useCargoNavigation }                       from './hooks/useNavigation';

type CargoActions = Pick<
    UseCargosReturn,
    'createCargo' | 'updateCargo' | 'deleteCargo' | 'publishCargo' | 'unpublishCargo'
>;

function isDetailScreen(page: PageType): boolean {
    if (page.type === 'create') return true;
    if (!page.cargo) return false;
    switch (page.type) {
        case 'edit':
        case 'view':
        case 'map':
        case 'invoices':
        case 'agreement':
        case 'prepayment':
        case 'insurance':
        case 'payment':
            return true;
        default:
            return false;
    }
}

const CargoDetail: React.FC<{ cargosLoading: boolean } & CargoActions> = ({
    cargosLoading,
    createCargo,
    updateCargo,
    deleteCargo,
    publishCargo,
    unpublishCargo,
}) => {
    const { currentPage, navigateTo } = useCargoNavigation();
    const invoiceApi = useInvoices({ info: currentPage.cargo });
    const { create_contract, handleAccept, get_contract, handleReject, handleChat, handleComplete } = invoiceApi;
    const { emit } = useSocket();
    const token = useToken();

    const handleBack = useCallback(() => {
        if (currentPage.type === 'view' || currentPage.type === 'create') {
            navigateTo({ type: 'list' });
        } else if (currentPage.type === 'edit') {
            const cargo = currentPage.cargo?.guid
                ? cargoGetters.getCargo(currentPage.cargo.guid) ?? currentPage.cargo
                : currentPage.cargo;
            if (cargo) {
                navigateTo({ type: 'view', cargo });
            } else {
                navigateTo({ type: 'list' });
            }
        } else if (currentPage.type === 'agreement' && currentPage.cargo?.guid) {
            const cargo = cargoGetters.getCargo(currentPage.cargo.guid) ?? currentPage.cargo;
            navigateTo({ type: 'view', cargo });
        } else if (currentPage.cargo?.guid) {
            const cargo = cargoGetters.getCargo(currentPage.cargo.guid);
            navigateTo({ type: 'view', cargo: cargo });
        }
    }, [currentPage.type, currentPage.cargo?.guid, navigateTo]);

    const handleAgreementSign = useCallback(
        async (invoice: DriverInfo, signature: string) => {
            const signed = await create_contract(invoice, signature);
            if (signed) {
                void handleAccept(invoice, 12, true);
            }
            const guid = currentPage.cargo?.guid;
            const cargo = guid ? cargoGetters.getCargo(guid) ?? currentPage.cargo : currentPage.cargo;
            if (cargo) navigateTo({ type: 'view', cargo });
        },
        [create_contract, handleAccept, currentPage.cargo, navigateTo]
    );

    const handleOpenAgreement = useCallback(
        async (invoice: DriverInfo) => {
            const cargo = currentPage.cargo;
            if (!cargo) return;
            const contractData = await get_contract(invoice);
            if (contractData) {
                navigateTo({ type: 'agreement', cargo, invoice, contract: contractData });
            }
        },
        [currentPage.cargo, get_contract, navigateTo]
    );

    const handleAdvanceInvoice = useCallback(
        async (invoice: DriverInfo, status: number) => {
            await handleAccept(invoice, status);
            if (status === 16) {
                emit('send_message', {
                    token,
                    recipient: invoice.recipient,
                    cargo: invoice.cargo,
                    message: 'Груз осмотрен и опломбирован, документы на груз переданы',
                });
                emit('send_message', {
                    token,
                    recipient: invoice.recipient,
                    cargo: invoice.cargo,
                    message: 'Транспорт отправлен в точку разгрузки',
                });
            }
        },
        [handleAccept, emit, token]
    );

    const handleStartUnloading = useCallback(
        async (invoice: DriverInfo) => {
            await handleAccept(invoice, 18);
            emit('send_message', {
                token,
                recipient: invoice.recipient,
                cargo: invoice.cargo,
                message: 'Пломба цела, груз доставлен',
            });
            emit('send_message', {
                token,
                recipient: invoice.recipient,
                cargo: invoice.cargo,
                message: 'Разгрузка начата',
            });
        },
        [handleAccept, emit, token]
    );

    const handleCompleteTrip = useCallback(
        async (invoice: DriverInfo, rating: number, completed: boolean) => {
            await handleComplete(invoice, rating, {
                delivered: completed,
                documents: completed,
            });
            await handleAccept(invoice, 20);
            emit('send_message', {
                token,
                recipient: invoice.recipient,
                cargo: invoice.cargo,
                message: 'Все работы выполнены',
            });
        },
        [handleComplete, handleAccept, emit, token]
    );

    const handleEdit = useCallback(
        (cargo: CargoInfo) => {
            navigateTo({ type: 'edit', cargo });
        },
        [navigateTo]
    );

    const handleMapClick = useCallback(
        (cargo: CargoInfo) => {
            navigateTo({ type: 'map', cargo });
        },
        [navigateTo]
    );

    const handleInvoiceAgreement = useCallback(
        (invoice: DriverInfo, contract: unknown) => {
            if (!currentPage.cargo) return;
            navigateTo({ type: 'agreement', cargo: currentPage.cargo, invoice, contract });
        },
        [currentPage.cargo, navigateTo]
    );

    const handleSign = useCallback(
        (signature: string) => {
            if (!currentPage.invoice) return;
            void handleAgreementSign(currentPage.invoice, signature);
        },
        [currentPage.invoice, handleAgreementSign]
    );

    const renderContent = () => {
        if (currentPage.cargo) {
            switch (currentPage.type) {
                case 'edit':
                    return (
                        <CargoNew
                            cargo={currentPage.cargo as CargoInfo}
                            onUpdate={updateCargo}
                            onCreate={createCargo}
                            onBack={handleBack}
                        />
                    );

                case 'view':
                    return (
                        <CargoView
                            cargo={currentPage.cargo}
                            onEdit={handleEdit}
                            onDelete={deleteCargo}
                            onPublish={publishCargo}
                            onUnpublish={unpublishCargo}
                            onAcceptInvoice={handleOpenAgreement}
                            onRejectInvoice={handleReject}
                            onChatInvoice={handleChat}
                            onAdvanceInvoice={handleAdvanceInvoice}
                            onStartUnloading={handleStartUnloading}
                            onComplete={handleCompleteTrip}
                            onMapClick={handleMapClick}
                            onBack={handleBack}
                            isLoading={cargosLoading || invoiceApi.isLoading}
                        />
                    );

                case 'map':
                    return (
                        <CargoMap
                            cargo={currentPage.cargo}
                            onBack={handleBack}
                        />
                    );

                case 'invoices':
                    return (
                        <CargoInvoice
                            cargo={currentPage.cargo}
                            invoiceApi={invoiceApi}
                            onBack={handleBack}
                            onOpenAgreement={handleInvoiceAgreement}
                        />
                    );

                case 'agreement':
                    if (!currentPage.invoice) return null;
                    return (
                        <Agreement
                            data={currentPage.contract}
                            onMenu={handleBack}
                            onCancel={handleBack}
                            onSign={handleSign}
                        />
                    );

                case 'prepayment':
                    return (
                        <PrepaymentPage
                            cargo={currentPage.cargo}
                            onBack={handleBack}
                        />
                    );

                case 'insurance':
                    return (
                        <InsurancePage
                            cargo={currentPage.cargo}
                            onBack={handleBack}
                        />
                    );

                case 'payment':
                    return (
                        <PrepaymentPage
                            cargo={currentPage.cargo}
                            onBack={handleBack}
                        />
                    );

                case 'create':
                    return (
                        <CargoNew
                            cargo={EMPTY_CARGO}
                            onUpdate={updateCargo}
                            onCreate={createCargo}
                            onBack={handleBack}
                        />
                    );

                default:
                    return null;
            }
        }

        if (currentPage.type === 'create') {
            return (
                <CargoNew
                    cargo={EMPTY_CARGO}
                    onUpdate={updateCargo}
                    onCreate={createCargo}
                    onBack={handleBack}
                />
            );
        }

        return null;
    };

    return (
        <>
            <IonLoading isOpen={cargosLoading || invoiceApi.isLoading} message="Подождите" />
            {renderContent()}
        </>
    );
};

export const Cargos: React.FC = () => {
    const { cargos, isLoading, createCargo, updateCargo, deleteCargo, publishCargo, unpublishCargo, refreshCargos } = useCargos();
    const { currentPage, replaceCurrentPage, handleCreateNew, handleCargoClick } = useCargoNavigation();
    const detail = isDetailScreen(currentPage);

    useEffect(() => {
        if (!currentPage.cargo?.guid) return;
        const cargo = cargoGetters.getCargo(currentPage.cargo.guid);
        if (!cargo || cargo === currentPage.cargo) return;
        replaceCurrentPage({ type: currentPage.type, cargo });
    }, [cargos, currentPage.cargo, currentPage.type, replaceCurrentPage]);

    return (
        <div className="cargos-module">
            {detail ? (
                <CargoDetail
                    cargosLoading={isLoading}
                    createCargo={createCargo}
                    updateCargo={updateCargo}
                    deleteCargo={deleteCargo}
                    publishCargo={publishCargo}
                    unpublishCargo={unpublishCargo}
                />
            ) : (
                <>
                    <IonLoading isOpen={isLoading} message="Подождите" />
                    <CargosList
                        cargos={cargos}
                        isLoading={isLoading}
                        onCargoClick={handleCargoClick}
                        onCreateNew={handleCreateNew}
                        onRefresh={refreshCargos}
                    />
                </>
            )}
        </div>
    );
};

export type {
    CargoInfo,
    CargoStatus,
    CargoPriority,
    CargoAddress,
    PageType,
    CargoFilters
} from '../../Store/cargoStore';

export {
    CargoCard,
    CargoForm,
    CargosList
} from './components';

export {
    formatters,
    statusUtils
} from '../../utils/utils';

export {
    STATUS_CLASSES,
    STATUS_COLORS,
    VALIDATION_MESSAGES
} from '../../utils/constants';
