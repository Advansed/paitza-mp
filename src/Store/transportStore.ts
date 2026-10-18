// src/Store/transportStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface TransportType {
  id: string
  name: string
  description?: string
  formula?: number
  min_tarif?: number
  max_tarif?: number
}

export type TransportTypeField = TransportType | TransportType[] | string | number | null | undefined

export interface TransportData {
  id?: string | number
  guid?: string
  name?: string
  license_plate?: string
  vin?: string
  manufacture_year?: number
  image?: string
  sts?: string
  transport_type?: TransportTypeField
  experience?: number
  load_capacity?: number
  volume?: number
  driver?: string | { phone?: string; fio?: string }
  driver_phone?: string
  driver_fio?: string
  mileage?: number
  verified?: boolean
  status?: 'free' | 'trip' | 'service'
  type?: string
  capacity?: number
  year?: number
  number?: string
  exp?: number
}

export interface TransportState {
  data: TransportData | null
  items: TransportData[]
  types: TransportType[]
  isLoading: boolean
  isSaving: boolean
  error: string | null
}

interface TransportActions {
  setData: (data: TransportData | null) => void
  setItems: (items: TransportData[]) => void
  setTypes: (types: TransportType[]) => void
  setLoading: (loading: boolean) => void
  setSaving: (saving: boolean) => void
  setError: (error: string | null) => void
  updateData: (updates: Partial<TransportData>) => void
  clearError: () => void
  reset: () => void
}

type TransportStore = TransportState & TransportActions

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const text = value.trim()
  if (!text || (text[0] !== '{' && text[0] !== '[')) return value
  try {
    return JSON.parse(text)
  } catch {
    return value
  }
}

function optionalNumber(rec: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = rec[key]
    if (value == null || value === '') continue
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

export function asTransportType(value: unknown): TransportType | undefined {
  const parsed = parseMaybeJson(value)
  const item = Array.isArray(parsed) ? parsed[0] : parsed
  if (item == null || item === '') return undefined
  if (typeof item === 'string' || typeof item === 'number') {
    return { id: String(item), name: String(item) }
  }
  if (typeof item !== 'object') return undefined
  const rec = item as Record<string, unknown>
  const id = rec.id ?? rec.guid ?? rec._id
  const name = rec.name ?? rec.title ?? rec.label
  if (id == null && (name == null || name === '')) return undefined
  return {
    id: id != null ? String(id) : '',
    name: name != null && name !== '' ? String(name) : String(id ?? ''),
    description: rec.description != null && rec.description !== '' ? String(rec.description) : undefined,
    formula: optionalNumber(rec, ['formula']),
    min_tarif: optionalNumber(rec, ['min_tarif', 'minTarif', 'min_tariff']),
    max_tarif: optionalNumber(rec, ['max_tarif', 'maxTarif', 'max_tariff']),
  }
}

export function haulPriceRange(
  weight: number | null | undefined,
  km: number | null | undefined,
  type: Pick<TransportType, 'formula' | 'min_tarif' | 'max_tarif'> | undefined
): { min: number; max: number } | null {
  if (!type) return null
  const formula = Number(type.formula)
  const minTarif = Number(type.min_tarif)
  const maxTarif = Number(type.max_tarif)
  if (!Number.isFinite(km) || (km as number) <= 0) return null
  if (!Number.isFinite(minTarif) || !Number.isFinite(maxTarif)) return null
  if (formula === 1) {
    const tons = Number(weight)
    if (!Number.isFinite(tons) || tons <= 0) return null
    return { min: tons * (km as number) * minTarif, max: tons * (km as number) * maxTarif }
  }
  if (formula === 2) {
    return { min: (km as number) * minTarif, max: (km as number) * maxTarif }
  }
  return null
}

export function formatHaulPriceRange(range: { min: number; max: number }): string {
  const minK = Math.round(range.min / 1000)
  const maxK = Math.round(range.max / 1000)
  if (minK === maxK) return `${minK} т.р`
  return `${Math.min(minK, maxK)}~${Math.max(minK, maxK)} т.р`
}

export function asTransportList(raw: unknown): TransportData[] {
  const list = Array.isArray(raw)
    ? raw.filter(Boolean)
    : raw && typeof raw === 'object'
      ? [raw]
      : []

  return list.map((item) => {
    const transport = { ...(item as TransportData) }
    if (!transport.guid && transport.id != null && transport.id !== '') {
      transport.guid = String(transport.id)
    }
    const type = asTransportType(transport.transport_type)
    if (type) transport.transport_type = type

    const driver = transport.driver
    if (driver && typeof driver === 'object' && !Array.isArray(driver)) {
      if (driver.phone && !transport.driver_phone) transport.driver_phone = String(driver.phone)
      if (driver.fio && !transport.driver_fio) transport.driver_fio = String(driver.fio)
    }

    if (transport.verified == null && transport.sts) {
      transport.verified = true
    }

    return transport
  })
}

function unwrapList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  if (!raw || typeof raw !== 'object') return []
  const rec = raw as Record<string, unknown>
  for (const key of ['data', 'items', 'types', 'result']) {
    if (Array.isArray(rec[key])) return rec[key] as unknown[]
  }
  return []
}

export function asTransportTypes(raw: unknown): TransportType[] {
  return unwrapList(raw)
    .map((item) => asTransportType(item))
    .filter((item): item is TransportType => Boolean(item))
}

export function transportDriverName(transport?: TransportData | null): string {
  const fio = String(transport?.driver_fio ?? '').trim()
  if (fio) return fio
  const driver = transport?.driver
  if (driver && typeof driver === 'object' && !Array.isArray(driver)) {
    return String(driver.fio ?? '').trim()
  }
  if (typeof driver === 'string') return driver.trim()
  return ''
}

export function transportDisplayName(transport?: TransportData | null): string {
  const name = String(transport?.name ?? '').trim()
  const guid = String(transport?.guid ?? '').trim()
  if (!name || (guid && name === guid)) return ''
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(name)) return ''
  if (/^[0-9a-f-]{16,}$/i.test(name)) return ''
  return name
}

export function transportTypeName(
  value: unknown,
  types: TransportType[] = [],
  fallback = ''
): string {
  const parsed = asTransportType(value)
  if (parsed?.name && parsed.name !== parsed.id) return parsed.name
  if (parsed?.id) {
    const fromDict = types.find((type) => type.id === parsed.id)?.name
    if (fromDict) return fromDict
    if (parsed.name) return parsed.name
  }
  return fallback
}

export function resolveTransportTypeId(
  value: unknown,
  types: TransportType[] = [],
  fallbackName?: string
): string {
  const parsed = asTransportType(value)
  if (parsed?.id) {
    if (types.some((type) => type.id === parsed.id)) return parsed.id
    return parsed.id
  }
  if (fallbackName) {
    return types.find((type) => type.name === fallbackName)?.id || ''
  }
  return ''
}

export function toTransportTypeId(value: string): string | number {
  const id = value.trim()
  return /^\d+$/.test(id) ? Number(id) : id
}

function sameTransport(a: TransportData, b: TransportData): boolean {
  if (a.guid && b.guid) return a.guid === b.guid
  const plateA = a.license_plate || a.number
  const plateB = b.license_plate || b.number
  return Boolean(plateA && plateB && plateA === plateB)
}

function mergeItems(items: TransportData[], data: TransportData): TransportData[] {
  const idx = items.findIndex((item) => sameTransport(item, data))
  if (idx >= 0) return items.map((item, i) => (i === idx ? { ...item, ...data } : item))
  return items.length ? [...items, data] : [data]
}

export const useTransportData = () => useTransportStore((state) => state.data)
export const useTransportItems = () => useTransportStore((state) => state.items)
export const useTransportTypes = () => useTransportStore((state) => state.types)

export const useTransportStore = create<TransportStore>()(
  devtools(
    (set) => ({
      data: null,
      items: [],
      types: [],
      isLoading: false,
      isSaving: false,
      error: null,

      setData: (data) =>
        set((state) => {
          if (!data) return { data: null, items: [] }
          return { data, items: mergeItems(state.items, data) }
        }),
      setItems: (items) => set({ items, data: items[0] ?? null }),
      setTypes: (types) => set({ types }),
      setLoading: (isLoading) => set({ isLoading }),
      setSaving: (isSaving) => set({ isSaving }),
      setError: (error) => set({ error }),

      updateData: (updates) =>
        set((state) => {
          const next = state.data ? { ...state.data, ...updates } : { ...updates }
          return { data: next, items: mergeItems(state.items, next) }
        }),

      clearError: () => set({ error: null }),

      reset: () =>
        set({
          data: null,
          items: [],
          types: [],
          isLoading: false,
          isSaving: false,
          error: null,
        }),
    }),
    { name: 'transport-store' }
  )
)

export const transportGetters = {
  getData: (): TransportData | null => useTransportStore.getState().data,
  getItems: (): TransportData[] => useTransportStore.getState().items,
  getTypes: (): TransportType[] => useTransportStore.getState().types,
  isLoading: (): boolean => useTransportStore.getState().isLoading,
  isSaving: (): boolean => useTransportStore.getState().isSaving,
  getError: (): string | null => useTransportStore.getState().error,

  getCompletionPercentage: (): number => {
    const data = useTransportStore.getState().data
    if (!data) return 0

    const requiredFields = ['name', 'license_plate', 'transport_type'] as const
    const optionalFields = ['vin', 'manufacture_year', 'image', 'experience', 'load_capacity'] as const
    const totalFields = requiredFields.length + optionalFields.length
    let filledCount = 0

    requiredFields.forEach((field) => {
      if (data[field]) filledCount++
    })
    optionalFields.forEach((field) => {
      if (data[field]) filledCount++
    })

    return Math.round((filledCount / totalFields) * 100)
  },
}

export const transportActions = {
  setData: (data: TransportData | null) => useTransportStore.getState().setData(data),
  setItems: (items: TransportData[]) => useTransportStore.getState().setItems(items),
  setTypes: (types: TransportType[]) => useTransportStore.getState().setTypes(types),
  setLoading: (loading: boolean) => useTransportStore.getState().setLoading(loading),
  setSaving: (saving: boolean) => useTransportStore.getState().setSaving(saving),
  setError: (error: string | null) => useTransportStore.getState().setError(error),
  updateData: (updates: Partial<TransportData>) => useTransportStore.getState().updateData(updates),
  clearError: () => useTransportStore.getState().clearError(),
  reset: () => useTransportStore.getState().reset(),
}

export const transportSocketHandlers = {
  onGetTransport: (response: any) => {
    transportActions.setLoading(false)

    if (response.success) {
      transportActions.setItems(asTransportList(response.data))
    } else {
      console.error('Invalid transport response:', response)
      transportActions.setError(response.message || 'Failed to load transport data')
    }
  },

  onGetTransportTypes: (response: any) => {
    if (response?.success === false) {
      console.error('Invalid transport types response:', response)
      return
    }
    transportActions.setTypes(asTransportTypes(response?.data ?? response))
  },

  onSaveTransport: (response: any) => {
    transportActions.setSaving(false)

    if (response.success && response.data) {
      const list = asTransportList(response.data)
      if (list.length > 1) transportActions.setItems(list)
      else transportActions.setData(list[0] || response.data)
    } else {
      transportActions.setError(response.message || 'Failed to save transport data')
    }
  },
}

export const initTransportSocketHandlers = (socket: any) => {
  if (!socket) return
  socket.on('get_transport', transportSocketHandlers.onGetTransport)
  socket.on('get_transport_types', transportSocketHandlers.onGetTransportTypes)
  socket.on('set_transport', transportSocketHandlers.onSaveTransport)
}

export const destroyTransportSocketHandlers = (socket: any) => {
  if (!socket) return
  socket.off('get_transport', transportSocketHandlers.onGetTransport)
  socket.off('get_transport_types', transportSocketHandlers.onGetTransportTypes)
  socket.off('set_transport', transportSocketHandlers.onSaveTransport)
}
