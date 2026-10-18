import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IonAlert, IonLoading, IonInput, IonIcon } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import { shieldCheckmarkOutline, documentTextOutline, businessOutline } from 'ionicons/icons';
import { formatters } from '../../../utils/utils';
import { CargoInfo, useCargoStore } from '../../../Store/cargoStore';
import { useLoginStore, useToken } from '../../../Store/loginStore';
import { useAccountStore } from '../../../Store/accountStore';
import { useSocket } from '../../../Store/useSocket';
import { useToast } from '../../Toast';
import styles from './InsurancePage.module.css';

interface InsurancePageProps {
    cargo: CargoInfo;
    onBack: () => void;
}

type InsuranceType = {
    id: string;
    name: string;
    icon: string;
    description: string;
    rate: number;
    coverage: string[];
};

const INSURANCE_TYPES: InsuranceType[] = [
    {
        id: 'basic',
        name: 'Базовое покрытие',
        icon: shieldCheckmarkOutline,
        description: 'Покрытие от утраты и повреждения',
        rate: 1.0,
        coverage: ['Полная утрата груза', 'Повреждение при перевозке', 'Кража груза'],
    },
    {
        id: 'extended',
        name: 'Расширенное покрытие',
        icon: documentTextOutline,
        description: 'Полное покрытие всех рисков',
        rate: 2.0,
        coverage: [
            'Все риски базового покрытия',
            'Стихийные бедствия',
            'Задержка в доставке',
            'Порча груза',
        ],
    },
    {
        id: 'premium',
        name: 'Премиум покрытие',
        icon: businessOutline,
        description: 'Максимальная защита и сервис',
        rate: 3.0,
        coverage: [
            'Все риски расширенного покрытия',
            'Экспресс-выплаты',
            'Юридическое сопровождение',
        ],
    },
];

function calcInsuranceCost(cargoCost: number, rate: number): number {
    if (!cargoCost || !rate) return 0;
    return Math.round(cargoCost * rate / 100);
}

type InsuranceTypeSelectorProps = {
    cargoCost: number;
    selectedType: string;
    onSelect: (id: string) => void;
};

const InsuranceTypeSelector: React.FC<InsuranceTypeSelectorProps> = ({
    cargoCost,
    selectedType,
    onSelect,
}) => {
    const [listOpen, setListOpen] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const selectedInsurance = INSURANCE_TYPES.find((type) => type.id === selectedType);

    const openList = (id: string) => {
        setListOpen(true);
        setExpandedId(id);
    };

    const handleHeadClick = (id: string) => {
        if (!listOpen) {
            openList(id);
            return;
        }
        setExpandedId((prev) => (prev === id ? null : id));
    };

    const handleSelect = (id: string) => {
        onSelect(id);
        setListOpen(false);
        setExpandedId(null);
    };

    if (!listOpen && selectedInsurance) {
        const price = calcInsuranceCost(cargoCost, selectedInsurance.rate);
        return (
            <section className={styles.card}>
                <div className={styles.cardKicker}>Тип покрытия</div>
                <button
                    type="button"
                    className={styles.selectedPreview}
                    onClick={() => openList(selectedInsurance.id)}
                >
                    <span className={styles.typeIcon}>
                        <IonIcon icon={selectedInsurance.icon} />
                    </span>
                    <span className={styles.typeMain}>
                        <div className={styles.typeName}>{selectedInsurance.name}</div>
                        <div className={styles.typeDesc}>{selectedInsurance.description}</div>
                        <div className={styles.typePrice}>
                            {selectedInsurance.rate}% · {formatters.currency(price)}
                        </div>
                    </span>
                    <span className={styles.selectedBadge}>Выбрано</span>
                </button>
                <div className={styles.changeHint}>Нажмите, чтобы изменить тип покрытия</div>
            </section>
        );
    }

    return (
        <section className={styles.card}>
            <div className={styles.cardKicker}>Тип покрытия</div>
            <h2 className={styles.cardTitle}>Выберите покрытие</h2>
            <div className={styles.typesList}>
                {INSURANCE_TYPES.map((insurance) => {
                    const isExpanded = expandedId === insurance.id;
                    const isSelected = selectedType === insurance.id;
                    const price = calcInsuranceCost(cargoCost, insurance.rate);

                    return (
                        <article
                            key={insurance.id}
                            className={[
                                styles.typeCard,
                                isExpanded ? styles.typeCardExpanded : '',
                                isSelected ? styles.typeCardSelected : '',
                            ]
                                .filter(Boolean)
                                .join(' ')}
                        >
                            <button
                                type="button"
                                className={styles.typeHead}
                                onClick={() => handleHeadClick(insurance.id)}
                            >
                                <span className={styles.typeIcon}>
                                    <IonIcon icon={insurance.icon} />
                                </span>
                                <span className={styles.typeMain}>
                                    <div className={styles.typeName}>{insurance.name}</div>
                                    <div className={styles.typeDesc}>{insurance.description}</div>
                                </span>
                                <span className={styles.typeMeta}>
                                    <div className={styles.typeRate}>{insurance.rate}%</div>
                                    <div className={styles.typePrice}>{formatters.currency(price)}</div>
                                </span>
                                <ChevronDown
                                    size={18}
                                    strokeWidth={2}
                                    className={`${styles.typeChevron} ${isExpanded ? styles.typeChevronOpen : ''}`}
                                />
                            </button>

                            {isExpanded && (
                                <>
                                    <div className={styles.typeBody}>
                                        <div className={styles.coverageTitle}>Что покрывает</div>
                                        <ul className={styles.coverageList}>
                                            {insurance.coverage.map((item) => (
                                                <li key={item} className={styles.coverageItem}>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className={styles.typeActions}>
                                        <button
                                            type="button"
                                            className={styles.selectBtn}
                                            onClick={() => handleSelect(insurance.id)}
                                        >
                                            {isSelected ? 'Выбрано' : 'Выбрать'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </article>
                    );
                })}
            </div>
        </section>
    );
};

type CargoCostProps = {
    cost: number;
    onChange: (value: number) => void;
};

const CargoCostEditor: React.FC<CargoCostProps> = ({ cost, onChange }) => {
    const [focused, setFocused] = useState(false);
    const [localCost, setLocalCost] = useState(cost || 0);

    useEffect(() => {
        if (!focused) setLocalCost(cost || 0);
    }, [cost, focused]);

    const hasValue = (cost || 0) > 0;
    const showEditor = focused || !hasValue;

    if (!showEditor && hasValue) {
        return (
            <section className={styles.card}>
                <button type="button" className={styles.costCollapsed} onClick={() => setFocused(true)}>
                    <div>
                        <div className={styles.cardKicker}>Стоимость груза</div>
                        <div className={styles.typeDesc}>Сумма для расчёта страховки</div>
                    </div>
                    <div className={styles.costValue}>{formatters.currency(cost)}</div>
                </button>
            </section>
        );
    }

    return (
        <section className={styles.card}>
            <div className={styles.cardKicker}>Стоимость груза</div>
            <div className={styles.costRow}>
                <div>
                    <h2 className={styles.cardTitle} style={{ marginBottom: 4 }}>
                        Сумма для страхования
                    </h2>
                    <div className={styles.typeDesc}>Укажите фактическую стоимость груза</div>
                </div>
                <div className={styles.costValue}>{formatters.currency(localCost || 0)}</div>
            </div>
            <div className={styles.costInputWrap}>
                <IonInput
                    type="number"
                    value={localCost}
                    className={styles.costInput}
                    placeholder="0"
                    onIonInput={(e) => {
                        const raw = String(e.detail.value ?? '');
                        const num = parseFloat(raw.replace(',', '.'));
                        setLocalCost(Number.isNaN(num) ? 0 : num);
                    }}
                    onIonFocus={() => setFocused(true)}
                />
                <span className={styles.costCurrency}>₽</span>
            </div>
            <p className={styles.costHint}>
                От этой суммы рассчитывается стоимость страхового полиса.
            </p>
            <div className={styles.typeActions}>
                <button
                    type="button"
                    className={styles.selectBtn}
                    onClick={() => {
                        onChange(localCost);
                        setFocused(false);
                    }}
                >
                    Применить
                </button>
            </div>
        </section>
    );
};

export const InsurancePage: React.FC<InsurancePageProps> = ({
    cargo,
    onBack,
}) => {
    const [cost, setCost] = useState(Number(cargo.cost) || Number(cargo.price) || 0);
    const [selectedType, setSelectedType] = useState<string>('basic');
    const [showConfirmAlert, setShowConfirmAlert] = useState(false);
    const [showCancelAlert, setShowCancelAlert] = useState(false);
    const [insuranceCost, setInsuranceCost] = useState(0);

    const { accountData, isLoading, set_insurance, del_insurance } = useData(cargo, onBack);

    const selectedInsurance = INSURANCE_TYPES.find((type) => type.id === selectedType);
    const history = useHistory();

    useEffect(() => {
        if (selectedInsurance && cost) {
            setInsuranceCost(calcInsuranceCost(cost, selectedInsurance.rate));
        } else {
            setInsuranceCost(0);
        }
    }, [selectedType, selectedInsurance, cost]);

    const handleInsurance = async () => {
        try {
            await set_insurance({
                cargo_id: cargo.guid,
                prepayment: insuranceCost,
                description:
                    'Страхование ' + (selectedInsurance?.name || 'basic') + ' груза ' + cargo.name,
                currency: accountData?.currency,
                type: 2,
            });
        } catch (error) {
            console.error('Payment error:', error);
        }
    };

    const handleConfirmInsurance = () => {
        setShowConfirmAlert(false);
        handleInsurance();
    };

    const handleCancel = async () => {
        setShowCancelAlert(false);
        await del_insurance({ cargo_id: cargo.guid, type: 2 });
        if (onBack) onBack();
    };

    const balance = accountData?.balance || 0;
    const canPayFromBalance = balance >= insuranceCost;

    return (
        <div className={styles.page}>
            <IonLoading isOpen={isLoading} message="Оформление страховки..." />

            <div className={styles.topBar}>
                <button type="button" className={styles.backBtn} onClick={onBack}>
                    <ChevronLeft size={20} strokeWidth={2} />
                    К заказу
                </button>
            </div>
            <h1 className={styles.pageTitle}>Страхование груза</h1>

            <div className={styles.content}>
                <CargoCostEditor cost={cost} onChange={setCost} />

                <InsuranceTypeSelector
                    cargoCost={cost}
                    selectedType={selectedType}
                    onSelect={setSelectedType}
                />

                <section className={styles.card}>
                    <div className={styles.summaryRow}>
                        <div>
                            <div className={styles.cardKicker}>Итого</div>
                            <h2 className={styles.cardTitle} style={{ marginBottom: 4 }}>
                                Стоимость страхования
                            </h2>
                            <div className={styles.typeDesc}>
                                {selectedInsurance?.rate}% от стоимости груза
                            </div>
                        </div>
                        <div className={styles.summaryPrice}>{formatters.currency(insuranceCost)}</div>
                    </div>
                </section>

                <section className={styles.card}>
                    <div className={styles.cardKicker}>Важно</div>
                    <ul className={styles.infoList}>
                        <li className={styles.infoItem}>Страхование вступает в силу с момента оплаты.</li>
                        <li className={styles.infoItem}>
                            В случае страхового случая обращайтесь в службу поддержки.
                        </li>
                        <li className={styles.infoItem}>
                            Выплаты по страховым случаям — в течение 10 рабочих дней.
                        </li>
                    </ul>
                </section>

                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={() => setShowCancelAlert(true)}
                    >
                        Отказаться
                    </button>
                    {canPayFromBalance ? (
                        <button
                            type="button"
                            className={styles.btnPrimary}
                            onClick={() => setShowConfirmAlert(true)}
                            disabled={!selectedType || !insuranceCost}
                        >
                            Оформить за {formatters.currency(insuranceCost)}
                        </button>
                    ) : (
                        <button
                            type="button"
                            className={styles.btnPrimary}
                            onClick={() => {
                                const needed = Math.max(0, insuranceCost - balance);
                                history.push({
                                    pathname: '/finance',
                                    state: { amount: needed },
                                    search: needed > 0 ? `?amount=${needed}` : undefined,
                                });
                            }}
                            disabled={!selectedType || !insuranceCost}
                        >
                            Доплатить {formatters.currency(Math.max(0, insuranceCost - balance))}
                        </button>
                    )}
                </div>
            </div>

            <IonAlert
                isOpen={showConfirmAlert}
                onDidDismiss={() => setShowConfirmAlert(false)}
                header="Оформление страхования"
                message={`Оформить ${selectedInsurance?.name.toLowerCase()} на сумму ${formatters.currency(insuranceCost)}?`}
                buttons={[
                    {
                        text: 'Отмена',
                        role: 'cancel',
                        handler: () => setShowConfirmAlert(false),
                    },
                    {
                        text: 'Оформить',
                        role: 'confirm',
                        handler: handleConfirmInsurance,
                    },
                ]}
            />

            <IonAlert
                isOpen={showCancelAlert}
                onDidDismiss={() => setShowCancelAlert(false)}
                header="Отказ от страхования"
                message="Груз будет опубликован без страхового покрытия"
                buttons={[
                    {
                        text: 'Оформить страховку',
                        role: 'cancel',
                        handler: () => setShowCancelAlert(false),
                    },
                    {
                        text: 'Продолжить без страховки',
                        role: 'confirm',
                        handler: handleCancel,
                    },
                ]}
            />
        </div>
    );
};

export const useData = (cargo: CargoInfo, onBack: () => void) => {
    const token = useToken();
    const id = useLoginStore((state) => state.id);
    const accountData = useAccountStore((state) => state.accountData);
    const isLoading = useAccountStore((state) => state.isLoading);
    const setLoading = useAccountStore((state) => state.setLoading);
    const { socket } = useSocket();
    const pendingRequests = useRef<Map<string, { resolve: Function; reject: Function }>>(new Map());

    const updateCargo = useCargoStore((state) => state.updateCargo);

    const toast = useToast();

    const socketRequest = useCallback((event: string, data: any, responseEvent: string): Promise<any> => {
        return new Promise((resolve, reject) => {
            const requestId = `${event}_${Date.now()}`;
            if (!socket) return;

            pendingRequests.current.set(requestId, { resolve, reject });

            const onSuccess = (response: any) => {
                if (response.success) {
                    const pending = pendingRequests.current.get(requestId);
                    if (pending) {
                        pendingRequests.current.delete(requestId);
                        pending.resolve({ success: true, data: response.data });
                    }
                } else {
                    const pending = pendingRequests.current.get(requestId);
                    if (pending) {
                        pendingRequests.current.delete(requestId);
                        pending.resolve({ success: false, error: response.message || 'Ошибка сервера' });
                    }
                }

                socket.off(responseEvent, onSuccess);
            };

            socket.on(responseEvent, onSuccess);

            setTimeout(() => {
                const pending = pendingRequests.current.get(requestId);
                if (pending) {
                    pendingRequests.current.delete(requestId);
                    socket.off(responseEvent, onSuccess);
                    pending.resolve({ success: false, error: 'Время ожидания истекло' });
                }
            }, 10000);

            socket.emit(event, { ...data, requestId });
        });
    }, [socket]);

    const set_insurance = async (data: any): Promise<any> => {
        setLoading(true);

        try {
            const result = await socketRequest(
                'set_document',
                { token, ...data },
                'set_document',
            );

            if (result.success) {
                cargo.insurance = data.prepayment;
                updateCargo(cargo.guid, cargo);
                onBack();
            } else toast.error('Ошибка сохранения страховки');
        } catch (err: any) {
            toast.error('Неизвестная ошибка:' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const set_payment = async (data: any): Promise<any> => {
        setLoading(true);

        try {
            const result = await socketRequest(
                'create_payment_sbp',
                { token, ...data },
                'create_payment_sbp',
            );

            return result;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Неизвестная ошибка';
            return { success: false, data: null, message: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    const del_insurance = async (data: any): Promise<any> => {
        setLoading(true);

        try {
            const result = await socketRequest(
                'del_document',
                { token, ...data },
                'del_document',
            );

            if (result.success) {
                cargo.insurance = 0;
                updateCargo(cargo.guid, cargo);
                onBack();
            } else toast.error('Ошибка сохранения страховки');
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Неизвестная ошибка';
            return { success: false, data: null, message: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    return {
        id,
        accountData,
        isLoading,
        set_insurance,
        del_insurance,
        set_payment,
    };
};
