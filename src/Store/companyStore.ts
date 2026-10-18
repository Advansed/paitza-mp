// src/Store/companyStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// ============================================
// ТИПЫ
// ============================================
export type CompanyFile = {
  file_guid?: string
  file_type?: string | number
  dataUrl?: string
  uploaded_at?: string
}

/** Схема t_company (p_get_company / p_set_company) */
export interface CompanyData {
  guid?: string
  /** 0 — юрлицо, 1 — ИП, 2 — физлицо / самозанятый */
  company_type?: number
  country_code?: string

  tax_number?: string
  tax_number_2?: string
  reg_number?: string
  duns?: string

  name?: string
  short_name?: string
  name_en?: string
  basis?: string
  address?: string
  postal_address?: string
  address_en?: string

  phone?: string
  email?: string
  description?: string

  currency?: string
  bank_beneficiary_name?: string
  bank_name?: string
  bank_address?: string
  bank_country_code?: string
  bank_account?: string
  iban?: string
  swift_bic?: string
  local_bank_code?: string

  intermediary_bank_name?: string
  intermediary_bank_swift?: string
  intermediary_bank_account?: string

  payout_type?: string
  card_number_mask?: string
  is_verified?: boolean
  created_at?: string
  updated_at?: string
  files?: CompanyFile[]

  /** Алиасы старой схемы для чтения (заполняет normalizeCompany) */
  inn?: string
  kpp?: string
  ogrn?: string
  bank_bik?: string
  bank_corr_account?: string
}

export interface CompanyState {
  data: CompanyData | null
  isLoading: boolean
  isSaving: boolean
  error: string | null
}

interface CompanyActions {
  setData: (data: CompanyData | null) => void
  setLoading: (loading: boolean) => void
  setSaving: (saving: boolean) => void
  setError: (error: string | null) => void
  updateData: (updates: Partial<CompanyData>) => void
  clearError: () => void
  reset: () => void
}

type CompanyStore = CompanyState & CompanyActions

// ============================================
// КОНСТАНТЫ
// ============================================
export const COMPANY_TYPES = {
  LEGAL: 0,
  IP: 1,
  PERSON: 2,
} as const

export const COMPANY_TYPE_LABELS: Record<number, string> = {
  [COMPANY_TYPES.LEGAL]: 'Юридическое лицо',
  [COMPANY_TYPES.IP]: 'Индивидуальный предприниматель',
  [COMPANY_TYPES.PERSON]: 'Физлицо / самозанятый',
}

export const DEFAULT_COUNTRY_CODE = 'RU'
export const DEFAULT_CURRENCY = 'RUB'
export const DEFAULT_PAYOUT_TYPE = 'BANK_ACCOUNT'

export const EMPTY_COMPANY: CompanyData = {
  guid: '',
  company_type: COMPANY_TYPES.LEGAL,
  country_code: DEFAULT_COUNTRY_CODE,
  tax_number: '',
  tax_number_2: '',
  reg_number: '',
  duns: '',
  name: '',
  short_name: '',
  name_en: '',
  basis: '',
  address: '',
  postal_address: '',
  address_en: '',
  phone: '',
  email: '',
  description: '',
  currency: DEFAULT_CURRENCY,
  bank_beneficiary_name: '',
  bank_name: '',
  bank_address: '',
  bank_country_code: '',
  bank_account: '',
  iban: '',
  swift_bic: '',
  local_bank_code: '',
  intermediary_bank_name: '',
  intermediary_bank_swift: '',
  intermediary_bank_account: '',
  payout_type: DEFAULT_PAYOUT_TYPE,
  card_number_mask: '',
  is_verified: false,
}

/** Поля JSON для p_set_company (новые имена) */
export const SET_COMPANY_FIELDS = [
  'guid',
  'country_code',
  'tax_number',
  'tax_number_2',
  'reg_number',
  'duns',
  'name',
  'short_name',
  'name_en',
  'basis',
  'address',
  'postal_address',
  'address_en',
  'phone',
  'email',
  'description',
  'currency',
  'bank_beneficiary_name',
  'bank_name',
  'bank_address',
  'bank_country_code',
  'bank_account',
  'iban',
  'swift_bic',
  'local_bank_code',
  'intermediary_bank_name',
  'intermediary_bank_swift',
  'intermediary_bank_account',
  'payout_type',
  'card_number_mask',
] as const

type SetCompanyStringField = (typeof SET_COMPANY_FIELDS)[number]

export type SetCompanyPayload = Pick<CompanyData, SetCompanyStringField> & {
  company_type: number
  country_code: string
  currency: string
  payout_type: string
  is_verified?: boolean
}

const SET_COMPANY_LIMITS: Record<SetCompanyStringField, number> = {
  guid: 36,
  country_code: 2,
  tax_number: 32,
  tax_number_2: 32,
  reg_number: 32,
  duns: 9,
  name: 500,
  short_name: 255,
  name_en: 500,
  basis: 256,
  address: 500,
  postal_address: 500,
  address_en: 500,
  phone: 20,
  email: 255,
  description: 1000,
  currency: 3,
  bank_beneficiary_name: 500,
  bank_name: 255,
  bank_address: 500,
  bank_country_code: 2,
  bank_account: 50,
  iban: 34,
  swift_bic: 11,
  local_bank_code: 32,
  intermediary_bank_name: 255,
  intermediary_bank_swift: 11,
  intermediary_bank_account: 50,
  payout_type: 16,
  card_number_mask: 19,
}

const UPPERCASE_FIELDS = new Set<SetCompanyStringField>([
  'country_code',
  'currency',
  'bank_country_code',
  'iban',
  'swift_bic',
  'intermediary_bank_swift',
  'payout_type',
])

const COMPACT_FIELDS = new Set<SetCompanyStringField>(['iban', 'swift_bic', 'intermediary_bank_swift'])

function str(value: unknown): string {
  return value == null ? '' : String(value).trim()
}

function companyTypeOf(value: unknown): number {
  const n = Number(value)
  return n === COMPANY_TYPES.IP || n === COMPANY_TYPES.PERSON ? n : COMPANY_TYPES.LEGAL
}

/** Ответ get_company → CompanyData; принимает и старые имена полей */
export function normalizeCompany(raw: any): CompanyData | null {
  if (!raw || typeof raw !== 'object') return null

  const tax_number = str(raw.tax_number ?? raw.inn)
  const tax_number_2 = str(raw.tax_number_2 ?? raw.kpp)
  const reg_number = str(raw.reg_number ?? raw.ogrn)
  const local_bank_code = str(raw.local_bank_code ?? raw.bank_bik)
  const intermediary_bank_account = str(raw.intermediary_bank_account ?? raw.bank_corr_account)

  const data: CompanyData = {
    ...EMPTY_COMPANY,
    ...raw,
    guid: str(raw.guid),
    company_type: companyTypeOf(raw.company_type),
    country_code: str(raw.country_code).toUpperCase() || DEFAULT_COUNTRY_CODE,
    currency: str(raw.currency).toUpperCase() || DEFAULT_CURRENCY,
    payout_type: str(raw.payout_type) || DEFAULT_PAYOUT_TYPE,
    tax_number,
    tax_number_2,
    reg_number,
    local_bank_code,
    intermediary_bank_account,
    is_verified: Boolean(raw.is_verified),
    files: Array.isArray(raw.files) ? raw.files : [],
    inn: tax_number,
    kpp: tax_number_2,
    ogrn: reg_number,
    bank_bik: local_bank_code,
    bank_corr_account: intermediary_bank_account,
  }
  return data
}

export function toSetCompanyPayload(data: Partial<CompanyData>): SetCompanyPayload {
  const merged: Partial<CompanyData> = {
    ...data,
    tax_number: data.tax_number ?? data.inn,
    tax_number_2: data.tax_number_2 ?? data.kpp,
    reg_number: data.reg_number ?? data.ogrn,
    local_bank_code: data.local_bank_code ?? data.bank_bik,
    intermediary_bank_account: data.intermediary_bank_account ?? data.bank_corr_account,
  }

  const payload = {
    company_type: companyTypeOf(merged.company_type),
    country_code: DEFAULT_COUNTRY_CODE,
    currency: DEFAULT_CURRENCY,
    payout_type: DEFAULT_PAYOUT_TYPE,
  } as SetCompanyPayload

  for (const key of SET_COMPANY_FIELDS) {
    let value = str(merged[key])
    if (!value) continue
    if (COMPACT_FIELDS.has(key)) value = value.replace(/\s+/g, '')
    if (UPPERCASE_FIELDS.has(key)) value = value.toUpperCase()
    ;(payload as Record<string, unknown>)[key] = value.slice(0, SET_COMPANY_LIMITS[key])
  }

  if (typeof data.is_verified === 'boolean') {
    payload.is_verified = data.is_verified
  }
  return payload
}

export function isRussianCompany(data: Partial<CompanyData> | null | undefined): boolean {
  return (str(data?.country_code).toUpperCase() || DEFAULT_COUNTRY_CODE) === 'RU'
}

export function companyFromPartySuggestion(suggestion: {
  value?: string
  data?: {
    inn?: string
    kpp?: string
    ogrn?: string
    type?: string
    name?: { short_with_opf?: string; full_with_opf?: string }
    address?: { value?: string }
  }
}): Partial<CompanyData> {
  const d = suggestion.data
  return {
    country_code: 'RU',
    company_type: d?.type === 'INDIVIDUAL' ? COMPANY_TYPES.IP : COMPANY_TYPES.LEGAL,
    tax_number: d?.inn,
    tax_number_2: d?.kpp,
    reg_number: d?.ogrn,
    inn: d?.inn,
    kpp: d?.kpp,
    ogrn: d?.ogrn,
    name: suggestion.value || d?.name?.full_with_opf,
    short_name: d?.name?.short_with_opf,
    address: d?.address?.value,
  }
}

export function buildOrganizationSave(params: {
  company?: CompanyData | null
  party?: { value?: string; data?: any } | null
  innOrName?: string
  basis?: string
  description?: string
  bank_bik?: string
  bank_name?: string
  bank_account?: string
  bank_corr_account?: string
}): SetCompanyPayload {
  const company = params.company
  const party = params.party?.data
    ? companyFromPartySuggestion(params.party)
    : {}
  const innOrName = (params.innOrName || '').trim()
  const isInn = /^\d{10,12}$/.test(innOrName)

  return toSetCompanyPayload({
    ...(company || {}),
    guid: company?.guid,
    company_type: party.company_type ?? company?.company_type,
    country_code: party.country_code || company?.country_code,
    tax_number: party.tax_number || (isInn ? innOrName : company?.tax_number),
    name: party.name || (!isInn && innOrName ? innOrName : company?.name),
    short_name: party.short_name || company?.short_name,
    tax_number_2: party.tax_number_2 || company?.tax_number_2,
    reg_number: party.reg_number || company?.reg_number,
    address: party.address || company?.address,
    basis: params.basis || company?.basis,
    description: params.description || company?.description,
    local_bank_code: params.bank_bik || company?.local_bank_code,
    bank_name: params.bank_name || company?.bank_name,
    bank_account: params.bank_account || company?.bank_account,
    intermediary_bank_account: params.bank_corr_account || company?.intermediary_bank_account,
  })
}

// ============================================
// ZUSTAND STORE
// ============================================
export const useCompanyStore = create<CompanyStore>()(
  devtools(
    (set) => ({
      // STATE
      data: null,
      isLoading: false,
      isSaving: false,
      error: null,

      // ACTIONS
      setData: (data) => set({ data: data ? normalizeCompany(data) : null }),
      setLoading: (isLoading) => set({ isLoading }),
      setSaving: (isSaving) => set({ isSaving }),
      setError: (error) => set({ error }),
      
      updateData: (updates) => 
        set((state) => ({ 
          data: normalizeCompany(state.data ? { ...state.data, ...updates } : { ...EMPTY_COMPANY, ...updates })
        })),
      
      clearError: () => set({ error: null }),
      
      reset: () => set({
        data: null,
        isLoading: false,
        isSaving: false,
        error: null
      })
    }),
    { name: 'company-store' }
  )
)

// ============================================
// СЕЛЕКТИВНЫЕ ХУКИ
// ============================================
export const useCompanyData = () => useCompanyStore(state => state.data)
export const useCompanyLoading = () => useCompanyStore(state => state.isLoading)
export const useCompanySaving = () => useCompanyStore(state => state.isSaving)
export const useCompanyError = () => useCompanyStore(state => state.error)

// ============================================
// GETTERS (совместимость)
// ============================================
export const companyGetters = {
  getData: (): CompanyData | null => useCompanyStore.getState().data,
  isLoading: (): boolean => useCompanyStore.getState().isLoading,
  isSaving: (): boolean => useCompanyStore.getState().isSaving,
  getError: (): string | null => useCompanyStore.getState().error,

  getCompletionPercentage: (): number => {
    const data = useCompanyStore.getState().data
    if (!data) return 0

    const checks: boolean[] = [Boolean(data.tax_number), Boolean(data.name)]
    if (isRussianCompany(data)) {
      checks.push(Boolean(data.local_bank_code), Boolean(data.bank_account))
    } else {
      checks.push(Boolean(data.swift_bic), Boolean(data.iban || data.bank_account))
    }

    const filled = checks.filter(Boolean).length
    return Math.round((filled / checks.length) * 100)
  }
}

// ============================================
// ACTIONS (совместимость)
// ============================================
export const companyActions = {
  setData:      (data: CompanyData | null) => useCompanyStore.getState().setData(data),
  setLoading:   (loading: boolean) => useCompanyStore.getState().setLoading(loading),
  setSaving:    (saving: boolean) => useCompanyStore.getState().setSaving(saving),
  setError:     (error: string | null) => useCompanyStore.getState().setError(error),
  updateData:   (updates: Partial<CompanyData>) => useCompanyStore.getState().updateData(updates),
  clearError:   () => useCompanyStore.getState().clearError(),
  reset:        () => useCompanyStore.getState().reset()
}

// ============================================
// SOCKET ОБРАБОТЧИКИ
// ============================================
export const companySocketHandlers = {
  onGetCompany: (response: any) => {
    
    companyActions.setLoading(false)
    
    if (response.success) {
      companyActions.setData(normalizeCompany(response.data))
    } else {
      console.error('Invalid company response:', response)
      companyActions.setError(response.message || 'Failed to load company data')
    }
  },

  onSaveCompany: (response: any) => {
    
    companyActions.setSaving(false)
    
    if (response.success && response.data) {
      companyActions.setData(normalizeCompany(response.data))
    } else if (!response.success) {
      companyActions.setError(response.message || 'Failed to save company data')
    }
  }
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ SOCKET ОБРАБОТЧИКОВ
// ============================================
export const initCompanySocketHandlers = (socket: any) => {
  if (!socket) return
  
  socket.on('get_company', companySocketHandlers.onGetCompany)
  socket.on('set_company', companySocketHandlers.onSaveCompany)
  
}

export const destroyCompanySocketHandlers = (socket: any) => {
  if (!socket) return
  
  socket.off('get_company', companySocketHandlers.onGetCompany)
  socket.off('set_company', companySocketHandlers.onSaveCompany)

}
