import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useToken } from '../../../Store/loginStore';
import { useSocket } from '../../../Store/useSocket';
import { useToast } from '../../Toast';
import { useAccountStore, type Transaction } from '../../../Store/accountStore';
import { useLoginStore } from '../../../Store/loginStore';

export interface DueDeal {
  id: string
  /** Имя груза */
  cargoName: string
  /** Дата доставки */
  deliveryDate: string
  /** Имя исполнителя (отображение) */
  executorName: string
  /** GUID груза для set_deals_payment */
  cargoId: string
  /** GUID исполнителя для set_deals_payment */
  performer: string
  /** Сумма к доплате */
  due: number
  currency: string
}

export type SetDealsPaymentPayload = {
  cargo_id: string
  performer: string
  amount: number
  currency: string
}

function mapTransactionType(raw: unknown): Transaction['type'] {
  if (raw === 'inv' || raw === 'invoice') return 'inv';
  if (raw === 'new') return 'new';
  if (raw === 'income' || raw === 'topup') return 'income';
  if (raw === 'expense') return 'expense';
  if (typeof raw === 'number') {
    if (raw === 1) return 'income';
    if (raw === 2) return 'expense';
    if (raw === 3 || raw === 4) return 'inv';
  }
  return 'expense';
}

function normalizeTransactions(raw: unknown): Transaction[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item: any) => ({
    id: String(item.id ?? item.guid ?? ''),
    date: item.date ?? '',
    type: mapTransactionType(item.type),
    amount: Number(item.amount ?? item.summ ?? 0),
    title: item.title ?? item.description ?? item.message ?? '',
    subtitle: item.subtitle ?? item.route ?? item.details ?? ''
  }));
}

function asText(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'object' && value && 'name' in value) {
    return String((value as { name?: unknown }).name || '').trim()
  }
  return ''
}

function dealDeliveryDate(item: any): string {
  return asText(
    item.delivery_date ??
      item.deliveryDate ??
      item.date_delivery ??
      item.дата_доставки ??
      item.date
  )
}

function dealCargoName(item: any): string {
  return (
    asText(item.name ?? item.cargo_name ?? item.cargoName ?? item.title ?? item.cargo) || 'Груз'
  )
}

function dealExecutorName(item: any): string {
  const executor =
    typeof item.executor === 'string' && item.executor.length < 32 ? item.executor : ''
  return asText(
    item.executor_name ??
      item.executorName ??
      item.carrier_name ??
      item.driver_name ??
      item.исполнитель ??
      item.company?.name ??
      (executor || item.client)
  )
}

function dealCargoId(item: any): string {
  const cargo = item.cargo_id ?? item.cargoId ?? item.cargo ?? item.guid ?? item.id
  if (cargo && typeof cargo === 'object') {
    return asText((cargo as { guid?: unknown; id?: unknown }).guid ?? (cargo as { id?: unknown }).id)
  }
  return asText(cargo)
}

function dealPerformerId(item: any): string {
  const candidates = [
    item.performer,
    item.performer_id,
    item.executor_id,
    item.executorId,
    item.driver_id,
    item.driverId,
    item.recipient,
    typeof item.executor === 'string' && item.executor.length >= 32 ? item.executor : null,
    typeof item.driver === 'string' && item.driver.length >= 32 ? item.driver : null,
  ]
  for (const value of candidates) {
    const text = asText(value)
    if (text) return text
  }
  return ''
}

export function normalizeDeals(raw: unknown): DueDeal[] {
  const list = Array.isArray(raw) ? raw : Array.isArray((raw as any)?.data) ? (raw as any).data : []
  return list.map((item: any) => {
    const due = Number(item.due ?? item.amount ?? item.remainder ?? item.to_pay ?? item.dopay ?? 0) || 0
    return {
      id: String(item.guid ?? item.id ?? item.deal ?? item.cargo_id ?? ''),
      cargoName: dealCargoName(item),
      deliveryDate: dealDeliveryDate(item),
      executorName: dealExecutorName(item),
      cargoId: dealCargoId(item),
      performer: dealPerformerId(item),
      due,
      currency: asText(item.currency) || 'RUB',
    }
  })
}

export const useWallet = () => {
  const token = useToken();
  const { socket } = useSocket();
  const toast = useToast();
  const seller_id = useLoginStore((s) => s.seller);

  const accountData = useAccountStore((s) => s.accountData);
  const transactions = useAccountStore((s) => s.transactions);
  const isLoading = useAccountStore((s) => s.isLoading);

  const setLoading = useAccountStore((s) => s.setLoading);
  const setAccountData = useAccountStore((s) => s.setAccountData);
  const setTransactions = useAccountStore((s) => s.setTransactions);

  const pendingRequests = useRef<Map<string, { resolve: Function; reject: Function }>>(new Map());
  const isRefreshingRef = useRef(false);

  const socketRequest = useCallback(
    (event: string, data: any, responseEvent: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        const requestId = `${event}_${Date.now()}`;

        if (!socket) {
          resolve({ success: false, message: 'Нет подключения к серверу' });
          return;
        }

        pendingRequests.current.set(requestId, { resolve, reject });

        const onSuccess = (response: any) => {
          const pending = pendingRequests.current.get(requestId);
          if (pending) pendingRequests.current.delete(requestId);

          if (response?.success) {
            pending?.resolve({ success: true, data: response.data });
          } else {
            pending?.resolve({ success: false, error: response?.message || 'Ошибка сервера' });
          }

          socket.off(responseEvent, onSuccess);
        };

        socket.on(responseEvent, onSuccess);

        setTimeout(() => {
          const pending = pendingRequests.current.get(requestId);
          if (pending) pendingRequests.current.delete(requestId);
          socket.off(responseEvent, onSuccess);
          pending?.resolve({ success: false, error: 'Время ожидания истекло' });
        }, 10000);

        socket.emit(event, { ...data, requestId });
      });
    },
    [socket]
  );

  const get_transactions = useCallback(
    async (opts?: { silent?: boolean }): Promise<any> => {
      const silent = opts?.silent ?? false;
      if (!silent) setLoading(true);
      try {
        const result = await socketRequest('get_transactions', { token }, 'get_transactions');
        if (result?.success) setTransactions(normalizeTransactions(result.data));
        else if (!silent) toast.error('Ошибка получения транзакций');
        return result;
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [setLoading, setTransactions, socketRequest, token, toast]
  );

  const get_balanse = useCallback(
    async (opts?: { silent?: boolean }): Promise<any> => {
      const silent = opts?.silent ?? false;
      if (!silent) setLoading(true);
      try {
        if (socket) socket.emit('get_balance', { token });
        return { success: true };
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [setLoading, socket, token]
  );

  const set_payment = useCallback(
    async (data: { type: number; amount: number; description: string }) => {
      setLoading(true);
      try {
        const result = await socketRequest('create_payment_sbp', { token, ...data }, 'create_payment_sbp');
        return result;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, socketRequest, token]
  );

  const set_invoice = useCallback(
    async (invoiceData: any): Promise<any> => {
      setLoading(true);
      try {
        const result = await socketRequest('create_invoice', { token, ...invoiceData }, 'create_invoice');
        return result;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, socketRequest, token]
  );

  const get_invoice = useCallback(
    async (invoice_id: string, opts?: { silent?: boolean }): Promise<any> => {
      const silent = opts?.silent ?? false;
      if (!silent) setLoading(true);
      try {
        return await socketRequest('get_invoice', { token, invoice_id }, 'get_invoice');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [setLoading, socketRequest, token]
  );

  const get_deals = useCallback(async (): Promise<{ success: boolean; data?: DueDeal[]; error?: string }> => {
    const result = await socketRequest('get_deals', { token }, 'get_deals');
    if (!result?.success) {
      return { success: false, error: result?.error || 'Не удалось загрузить сделки' };
    }
    return { success: true, data: normalizeDeals(result.data) };
  }, [socketRequest, token]);

  const set_deals_payment = useCallback(
    async (payload: SetDealsPaymentPayload): Promise<{ success: boolean; data?: any; error?: string }> => {
      const result = await socketRequest(
        'set_deals_payment',
        {
          token,
          cargo_id: payload.cargo_id,
          performer: payload.performer,
          amount: payload.amount,
          currency: payload.currency,
        },
        'set_deals_payment'
      );
      if (!result?.success) {
        return { success: false, error: result?.error || 'Не удалось провести доплату' };
      }
      return { success: true, data: result.data };
    },
    [socketRequest, token]
  );

  // Подписка на события баланса/транзакций держится в socket handlers аккаунта,
  // но здесь просто запускаем загрузку.
  useEffect(() => {
    // не автозапускаем, вызываем руками в экране
  }, []);

  const formattedBalance = useMemo(() => {
    if (!accountData) return '—';
    try {
      return accountData.balance.toLocaleString('ru-RU', {
        style: 'currency',
        currency: accountData.currency || 'RUB',
        maximumFractionDigits: 0
      });
    } catch {
      return `${accountData.balance} ${accountData.currency || 'RUB'}`;
    }
  }, [accountData]);

  const refreshWallet = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (isRefreshingRef.current) return;
      isRefreshingRef.current = true;
      const silent = opts?.silent ?? false;
      try {
        await Promise.all([
          get_balanse({ silent }),
          get_transactions({ silent }),
        ]);
      } finally {
        isRefreshingRef.current = false;
      }
    },
    [get_balanse, get_transactions]
  );

  const load = useCallback(async () => {
    await refreshWallet({ silent: false });
  }, [refreshWallet]);

  return {
    accountData,
    transactions,
    isLoading,
    formattedBalance,
    load,
    refreshWallet,
    set_payment,
    set_invoice,
    get_invoice,
    get_deals,
    set_deals_payment,
    seller_id
  };
};

