import { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router';
import { useSocket } from '../../../Store/useSocket';
import { useToken } from '../../../Store/loginStore';
import { CargoInfo, DriverInfo, cargoActions, cargoGetters } from '../../../Store/cargoStore';
import { chatActions } from '../../../Store/chatStore';
import { useToast } from '../../Toast';
import { resolveCargoProgressStatus } from '../cargoStatusFlow';

export interface TaskCompletion {
    delivered: boolean;
    documents: boolean;
}

export interface UseInvoicesOptions {
    /** Текущий груз из стора/навигации; без него список заявок пуст, мутации всё равно доступны */
    info?: CargoInfo | null;
}

export interface UseInvoicesReturn {
    invoices: DriverInfo[];
    isLoading: boolean;
    contract: unknown;
    setContract: (c: unknown) => void;
    get_contract: (info: DriverInfo) => Promise<unknown>;
    create_contract: (info: DriverInfo, sign: string) => Promise<boolean>;
    handleAccept: (info: DriverInfo, status: number, silent?: boolean) => Promise<void>;
    handleReject: (info: DriverInfo) => Promise<boolean>;
    handleComplete: (info: DriverInfo, rating: number, tasks: TaskCompletion) => Promise<void>;
    handleChat: (info: DriverInfo) => void;
}

const SOCKET_WAIT_MS = 10000;

function waitForSocketEvent<T>(
    once: (event: string, callback: (data: T) => void) => void,
    event: string,
    timeoutMs = SOCKET_WAIT_MS
): Promise<T | undefined> {
    return new Promise(resolve => {
        let settled = false;
        const finish = (value: T | undefined) => {
            if (settled) return;
            settled = true;
            window.clearTimeout(timer);
            resolve(value);
        };
        const timer = window.setTimeout(() => finish(undefined), timeoutMs);
        once(event, data => finish(data));
    });
}

export const useInvoices = ({ info }: UseInvoicesOptions): UseInvoicesReturn => {
    const [invoices, setInvoices] = useState<DriverInfo[]>(info?.invoices ?? []);
    const invoicesRef = useRef(invoices);
    invoicesRef.current = invoices;
    const [contract, setContract] = useState<unknown>();
    const [isLoading, setIsLoading] = useState(false);
    const history = useHistory();
    const { emit, once, socket } = useSocket();
    const token = useToken();
    const toast = useToast();

    const invoicesKey = JSON.stringify(info?.invoices ?? null);

    useEffect(() => {
        if (!info) {
            setInvoices([]);
        } else {
            setInvoices(info.invoices ?? []);
        }
    }, [info, info?.guid, invoicesKey]);

    const persistInvoices = useCallback((cargoId: string, next: DriverInfo[]) => {
        const current = cargoGetters.getCargo(cargoId);
        const status = resolveCargoProgressStatus({
            status: current?.status,
            invoices: next,
        });
        cargoActions.updateCargo(cargoId, { invoices: next, status });
    }, []);

    const applyInvoiceStatus = useCallback((infoRow: DriverInfo, status: number) => {
        const next = invoicesRef.current.map(invoice =>
            invoice.guid === infoRow.guid
                ? { ...invoice, status: setStatus(status) as DriverInfo['status'] }
                : invoice
        );
        invoicesRef.current = next;
        setInvoices(next);
        persistInvoices(infoRow.cargo, next);
    }, [persistInvoices]);

    const handleAccept = useCallback(
        async (infoRow: DriverInfo, status: number, silent = false): Promise<void> => {
            if (!silent) setIsLoading(true);
            applyInvoiceStatus(infoRow, status);
            try {
                const responsePromise = waitForSocketEvent<{ success: boolean; message?: string }>(
                    once,
                    'set_inv'
                );
                emit('set_inv', {
                    token,
                    recipient: infoRow.recipient,
                    id: infoRow.guid,
                    status,
                });
                const data = await responsePromise;
                if (data?.success === false) {
                    console.error('Ошибка при принятии заявки:', data.message);
                }
            } finally {
                if (!silent) setIsLoading(false);
            }
        },
        [once, emit, token, applyInvoiceStatus]
    );

    const get_contract = useCallback(
        async (infoRow: DriverInfo): Promise<unknown> => {
            setIsLoading(true);
            try {
                const responsePromise = waitForSocketEvent<{
                    success: boolean;
                    message?: string;
                    data: unknown;
                }>(once, 'get_contract');
                emit('get_contract', {
                    token,
                    id: infoRow.guid,
                });
                const data = await responsePromise;
                if (data?.success) {
                    setContract(data.data);
                    return data.data;
                }
                if (data) {
                    console.error('Ошибка при получении договора:', data.message);
                }
                return undefined;
            } finally {
                setIsLoading(false);
            }
        },
        [once, emit, token]
    );

    const create_contract = useCallback(
        async (infoRow: DriverInfo, sign: string): Promise<boolean> => {
            setIsLoading(true);
            try {
                const responsePromise = waitForSocketEvent<{
                    success: boolean;
                    message?: string;
                    data: unknown;
                }>(once, 'create_contract');
                emit('create_contract', {
                    token,
                    id: infoRow.guid,
                    cargo_id: infoRow.cargo,
                    driver_id: infoRow.recipient,
                    sign,
                });
                const data = await responsePromise;
                if (data?.success) {
                    toast.success('Договор создан и подписан');
                    return true;
                }
                if (data?.success === false) {
                    console.error('Ошибка при принятии заявки:', data.message);
                    toast.error(data.message || 'Не удалось подписать договор');
                    return false;
                }
                toast.success('Договор отправлен');
                return true;
            } finally {
                setIsLoading(false);
            }
        },
        [once, emit, token, toast]
    );

    const handleReject = useCallback(
        async (infoRow: DriverInfo) => {
            if (!socket) {
                toast.error('Нет соединения с сервером');
                return false;
            }

            setIsLoading(true);

            return new Promise<boolean>(resolve => {
                let settled = false;
                const timerRef: { id?: ReturnType<typeof setTimeout> } = {};

                const finish = (value: boolean) => {
                    if (settled) return;
                    settled = true;
                    if (timerRef.id !== undefined) clearTimeout(timerRef.id);
                    resolve(value);
                    setIsLoading(false);
                };

                timerRef.id = setTimeout(() => {
                    toast.error('Таймаут ожидания ответа от сервера');
                    finish(false);
                }, 10000);

                const offerData = {
                    guid: infoRow.guid,
                    status: 11,
                };

                const handleOfferResponse = (response: { success: boolean; error?: string }) => {
                    if (response.success) {
                        toast.success('Предложение успешно удалено');
                        const next = invoicesRef.current.filter(invoice => invoice.guid !== infoRow.guid);
                        invoicesRef.current = next;
                        setInvoices(next);
                        persistInvoices(infoRow.cargo, next);
                        finish(true);
                    } else {
                        toast.error(response.error || 'Ошибка удаления предложения');
                        finish(false);
                    }
                };

                try {
                    socket.once('del_offer', handleOfferResponse);
                    socket.emit('cancel_offer', { token, ...offerData });
                } catch (error) {
                    console.error('Error deleting offer:', error);
                    toast.error('Ошибка удаления предложения');
                    finish(false);
                }
            });
        },
        [socket, token, toast, persistInvoices]
    );

    const handleComplete = useCallback(
        async (infoRow: DriverInfo, rating: number, tasks: TaskCompletion) => {
            setIsLoading(true);
            try {
                emit('completed', {
                    token,
                    id: infoRow.guid,
                    recipient: infoRow.recipient,
                    rating,
                    tasks,
                });

                const next = invoicesRef.current.map(invoice =>
                    invoice.guid === infoRow.guid
                        ? { ...invoice, status: setStatus(20) as DriverInfo['status'] }
                        : invoice
                );
                invoicesRef.current = next;
                setInvoices(next);
                persistInvoices(infoRow.cargo, next);
            } catch (error) {
                console.error('Ошибка при завершении:', error);
            } finally {
                setIsLoading(false);
            }
        },
        [emit, token, persistInvoices]
    );

    const handleChat = useCallback(
        (infoRow: DriverInfo) => {
            const name = infoRow.client || 'Водитель';
            chatActions.ensureChat(infoRow.recipient, infoRow.cargo, { rec_name: name });
            chatActions.setCurrentChat(infoRow.recipient, infoRow.cargo);
            history.push(
                `/chats/${infoRow.recipient}:${infoRow.cargo}:${encodeURIComponent(name)}`
            );
        },
        [history]
    );

    return {
        invoices,
        isLoading,
        contract,
        setContract,
        get_contract,
        create_contract,
        handleAccept,
        handleReject,
        handleComplete,
        handleChat,
    };
};

export function setStatus(status: number): string {
    switch (status) {
        case 11:
            return 'Заказано';
        case 12:
            return 'Принято';
        case 13:
            return 'На погрузке';
        case 14:
            return 'Загружается';
        case 15:
            return 'Загружено';
        case 16:
            return 'В пути';
        case 17:
            return 'Прибыл';
        case 18:
            return 'Разгружается';
        case 19:
            return 'Разгружено';
        case 20:
            return 'Завершено';
        default:
            return '';
    }
}
