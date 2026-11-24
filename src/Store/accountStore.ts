// src/Store/accountStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export const TRANSACTION_ICONS = {
  TOPUP:                  '💰',
  EXPENSE:                '📤', 
  PAYMENT:                '💳'
} as const

// src/components/Profile/components/Account/types.ts

export interface AccountProps {
  onBack: () => void
}

export interface UseAccountReturn {
  balance: number | null
  transactions: Transaction[]
  loading: boolean
  error: string | null
  topUpAccount: (amount: number, method: string) => Promise<void>
  loadBalance: () => Promise<void>
  loadTransactions: () => Promise<void>
}

export type PaymentMethod = 'card' | 'sbp' | 'bank'
export type TransactionType = 'income' | 'expense' | 'new' | 'inv'
export type TransactionStatus = 'completed' | 'pending' | 'failed'


// ============================================
// ТИПЫ
// ============================================

export interface CurrencyBalance {
  currency: string
  balance: number
}

export interface Transaction {
  id: string
  date: string
  type: 'income' | 'expense' | 'new' | 'inv'
  amount: number
  currency?: string
  title: string
  subtitle?: string
}

export interface PaymentData {
  type: number
  summ: number
  date?: string
  orderId?: string
  description?: string
}

export interface AccountData {
  balance: number
  currency: string
  /** Остатки по всем валютам — источник истины */
  balances: CurrencyBalance[]
  deposit?: number
  /** Резерв под заявки — advance1 из p_get_balance */
  advanceReserve?: number
  /** Авансы в работе — advance2 из p_get_balance */
  advanceInWork?: number
  /** Остаток к доплате — due из p_get_balance */
  remainingToPay?: number
  /** Доход за период — month_income из p_get_balance (исполнитель) */
  monthIncome?: number
  /** Предстоящие / ожидаемые выплаты — upcoming_income из p_get_balance (исполнитель) */
  upcomingIncome?: number
  /** Получено авансов — hold_advance из p_get_balance (исполнитель) */
  holdAdvance?: number
  lastUpdated?: string
}

/** Остаток в конкретной валюте */
export function balanceOf(data: AccountData | null | undefined, currency?: string | null): number {
  if (!data) return 0
  const code = (currency || data.currency || 'RUB').trim().toUpperCase() || 'RUB'
  const row = data.balances?.find((b) => (b.currency || '').toUpperCase() === code)
  if (row) return row.balance
  if ((data.currency || '').toUpperCase() === code) return data.balance || 0
  return 0
}

function parseBalances(data: any): CurrencyBalance[] {
  const raw = data?.balances
  if (Array.isArray(raw) && raw.length) {
    return raw
      .map((row: any) => ({
        currency: String(row?.currency || 'RUB').trim().toUpperCase() || 'RUB',
        balance: num(row?.balance),
      }))
      .filter((row: CurrencyBalance) => row.currency)
  }
  const currency = String(data?.currency || 'RUB').trim().toUpperCase() || 'RUB'
  return [{ currency, balance: num(data?.balance) }]
}

function num(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/** Достаёт доп. поля из ответа get_balance (p_get_balance) */
export function parseBalanceExtras(data: any): Pick<
  AccountData,
  | 'advanceReserve'
  | 'advanceInWork'
  | 'remainingToPay'
  | 'deposit'
  | 'monthIncome'
  | 'upcomingIncome'
  | 'holdAdvance'
> {
  return {
    deposit: num(data?.deposit ?? data?.guarantee),
    advanceReserve: num(data?.advance1),
    advanceInWork: num(data?.advance2),
    remainingToPay: num(data?.due),
    monthIncome: num(data?.month_income),
    upcomingIncome: num(data?.upcoming_income),
    holdAdvance: num(data?.hold_advance),
  }
}

export interface AccountState {
  accountData: AccountData | null
  transactions: Transaction[]
  isLoading: boolean
  isSaving: boolean
  isLoadingTransactions: boolean
  error: string | null
}

interface AccountActions {
  setAccountData: (data: AccountData | null) => void
  setTransactions: (transactions: Transaction[]) => void
  setLoading: (loading: boolean) => void
  setSaving: (saving: boolean) => void
  setLoadingTransactions: (loading: boolean) => void
  setError: (error: string | null) => void
  updateAccountData: (updates: Partial<AccountData>) => void
  addTransaction: (transaction: Transaction) => void
  clearError: () => void
  reset: () => void
}

type AccountStore = AccountState & AccountActions

// ============================================
// КОНСТАНТЫ
// ============================================

export const EMPTY_ACCOUNT: AccountData = {
  balance:          0,
  currency:         'RUB',
  balances:         [{ currency: 'RUB', balance: 0 }],
  deposit:          0,
  advanceReserve:   0,
  advanceInWork:    0,
  remainingToPay:   0,
  monthIncome:      0,
  upcomingIncome:   0,
  holdAdvance:      0,
  lastUpdated:      ''
}

// ============================================
// ZUSTAND STORE
// ============================================

export const useAccountStore = create<AccountStore>()(
  devtools(
    (set) => ({
      // STATE
      accountData:            EMPTY_ACCOUNT,
      transactions:           [],
      isLoading:              false,
      isSaving:               false,
      isLoadingTransactions:  false,
      error:                  null,

      // ACTIONS
      setAccountData: (accountData) => set({ accountData }),
      setTransactions: (transactions) => set({ transactions }),
      setLoading: (isLoading) => set({ isLoading }),
      setSaving: (isSaving) => set({ isSaving }),
      setLoadingTransactions: (isLoadingTransactions) => set({ isLoadingTransactions }),
      setError: (error) => set({ error }),
      
      updateAccountData: (updates) => 
        set((state) => ({ 
          accountData: state.accountData 
            ? { ...state.accountData, ...updates } 
            : { ...EMPTY_ACCOUNT, ...updates }
        })),
      
      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [transaction, ...state.transactions]
        })),
            
      clearError: () => set({ error: null }),
      
      reset: () => set({
        accountData: null,
        transactions: [],
        isLoading: false,
        isSaving: false,
        isLoadingTransactions: false,
        error: null
      })
    }),
    { name: 'account-store' }
  )
)

// ============================================
// СЕЛЕКТИВНЫЕ ХУКИ
// ============================================

export const useAccountData = () => useAccountStore(state => state.accountData)
export const useTransactions = () => useAccountStore(state => state.transactions)
export const setTransactions = () => useAccountStore(state => state.setTransactions)
export const useAccountLoading = () => useAccountStore(state => state.isLoading)
export const useAccountSaving = () => useAccountStore(state => state.isSaving)
export const useAccountLoadingTransactions = () => useAccountStore(state => state.isLoadingTransactions)
export const useAccountError = () => useAccountStore(state => state.error)

// ============================================
// GETTERS
// ============================================

export const accountGetters = {
  getAccountData: (): AccountData | null => useAccountStore.getState().accountData,
  getTransactions: (): Transaction[] => useAccountStore.getState().transactions,
  isLoading: (): boolean => useAccountStore.getState().isLoading,
  isSaving: (): boolean => useAccountStore.getState().isSaving,
  isLoadingTransactions: (): boolean => useAccountStore.getState().isLoadingTransactions,
  getError: (): string | null => useAccountStore.getState().error,
  getBalance: (): number => useAccountStore.getState().accountData?.balance || 0,
  balanceOf: (currency?: string | null): number =>
    balanceOf(useAccountStore.getState().accountData, currency),
}

// ============================================
// ACTIONS
// ============================================

export const accountActions = {
  setAccountData: (data: AccountData | null) => useAccountStore.getState().setAccountData(data),
  setTransactions: (transactions: Transaction[]) => useAccountStore.getState().setTransactions(transactions),
  setLoading: (loading: boolean) => useAccountStore.getState().setLoading(loading),
  setSaving: (saving: boolean) => useAccountStore.getState().setSaving(saving),
  setLoadingTransactions: (loading: boolean) => useAccountStore.getState().setLoadingTransactions(loading),
  setError: (error: string | null) => useAccountStore.getState().setError(error),
  updateAccountData: (updates: Partial<AccountData>) => useAccountStore.getState().updateAccountData(updates),
  addTransaction: (transaction: Transaction) => useAccountStore.getState().addTransaction(transaction),
  clearError: () => useAccountStore.getState().clearError(),
  reset: () => useAccountStore.getState().reset()
}

// ============================================
// SOCKET ОБРАБОТЧИКИ
// ============================================

export const accountSocketHandlers = {

  onGetBalance:       (response: any) => {
    accountActions.setLoading(false)
    
    if (response.success) {
      const extras = parseBalanceExtras(response.data)
      const balances = parseBalances(response.data)
      const currency = String(response.data?.currency || balances[0]?.currency || 'RUB')
        .trim()
        .toUpperCase() || 'RUB'
      const home = balances.find((b) => b.currency === currency) ?? balances[0]
      const accountData: AccountData = {
        balance: home?.balance ?? num(response.data?.balance),
        currency,
        balances,
        deposit: extras.deposit,
        advanceReserve: extras.advanceReserve,
        advanceInWork: extras.advanceInWork,
        remainingToPay: extras.remainingToPay,
        monthIncome: extras.monthIncome,
        upcomingIncome: extras.upcomingIncome,
        holdAdvance: extras.holdAdvance,
        lastUpdated: new Date().toISOString()
      }
      accountActions.setAccountData(accountData)
    } else {
      console.error('Invalid balance response:', response)
      accountActions.setError(response.message || 'Failed to load balance')
    }
  },

  onGetTransactions:  (response: any) => {
    
    accountActions.setLoadingTransactions(false)
    
    if (response.success) {
      const transactions: Transaction[] = (response.data || []).map((item: any) => ({
        id: item.id || item.guid,
        date: item.date,
        type: item.type === 1 ? 'topup' : item.type === 2 ? 'expense' : 'payment',
        amount: item.amount || item.summ,
        description: item.description || item.message || '',
        status: item.status === 1 ? 'completed' : item.status === 0 ? 'pending' : 'failed',
        orderId: item.orderId
      }))
      
      accountActions.setTransactions(transactions)
    } else {
      console.error('Invalid transactions response:', response)
      accountActions.setError(response.message || 'Failed to load transactions')
    }
  },

  onSetPayment:       (response: any) => {
    
    accountActions.setSaving(false)
    
    if (response.success) {
      // Обновляем баланс после успешного платежа
      if (response.data?.balance !== undefined) {
        accountActions.updateAccountData({ balance: response.data.balance })
      }
    } else {
      console.error('Invalid payment response:', response)
      accountActions.setError(response.message || 'Failed to process payment')
    }
  }

}

// ============================================
// ИНИЦИАЛИЗАЦИЯ SOCKET ОБРАБОТЧИКОВ
// ============================================

export const initAccountSocketHandlers = (socket: any) => {
  if (!socket) return

  socket.on("get_balance", accountSocketHandlers.onGetBalance )
    
}

export const destroyAccountSocketHandlers = (socket: any) => {
  if (!socket) return

  socket.off("get_balance", accountSocketHandlers.onGetBalance )
  
}