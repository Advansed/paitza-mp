import { useCallback } from 'react'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { useToast } from '../components/Toast'
import { useToken } from './loginStore'
import { useSocket } from './useSocket'
import { useSocketStore } from './socketStore'

export const MEMBER_STATUS = { SUSPENDED: 0, ACTIVE: 1 } as const

export interface CompanyMember {
  driver_id: string
  driver_name: string
  driver_phone: string
  member_role: string
  status: number
  joined_at?: string
}

interface MembersState {
  items: CompanyMember[]
  isLoading: boolean
  isSaving: boolean
  loaded: boolean
  setItems: (items: CompanyMember[]) => void
  setLoading: (v: boolean) => void
  setSaving: (v: boolean) => void
  patchItem: (driverId: string, patch: Partial<CompanyMember>) => void
  removeItem: (driverId: string) => void
}

export const useMembersStore = create<MembersState>()(
  devtools(
    (set) => ({
      items: [],
      isLoading: false,
      isSaving: false,
      loaded: false,
      setItems: (items) => set({ items, loaded: true }),
      setLoading: (isLoading) => set({ isLoading }),
      setSaving: (isSaving) => set({ isSaving }),
      patchItem: (driverId, patch) =>
        set((s) => ({
          items: s.items.map((m) => (m.driver_id === driverId ? { ...m, ...patch } : m)),
        })),
      removeItem: (driverId) =>
        set((s) => ({ items: s.items.filter((m) => m.driver_id !== driverId) })),
    }),
    { name: 'members-store' }
  )
)

function normalizeMember(raw: unknown): CompanyMember | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const id = r.driver_id ?? r.id
  if (id == null || id === '') return null
  return {
    driver_id: String(id),
    driver_name: String(r.driver_name ?? r.name ?? ''),
    driver_phone: String(r.driver_phone ?? r.phone ?? ''),
    member_role: String(r.member_role ?? r.role ?? 'driver'),
    status: Number(r.status ?? MEMBER_STATUS.ACTIVE) === MEMBER_STATUS.SUSPENDED ? 0 : 1,
    joined_at: r.joined_at != null ? String(r.joined_at) : undefined,
  }
}

function asMemberList(raw: unknown): CompanyMember[] {
  const list = Array.isArray(raw) ? raw : raw ? [raw] : []
  return list.map(normalizeMember).filter((m): m is CompanyMember => Boolean(m))
}

export type AddMemberInput = {
  name: string
  phone: string
  transport_id?: string | number
}

export const useCompanyMembers = () => {
  const token = useToken()
  const { once, emit } = useSocket()
  const isConnected = useSocketStore((s) => s.isConnected)
  const toast = useToast()

  const items = useMembersStore((s) => s.items)
  const isLoading = useMembersStore((s) => s.isLoading)
  const isSaving = useMembersStore((s) => s.isSaving)
  const loaded = useMembersStore((s) => s.loaded)

  const ready = useCallback(() => {
    if (!isConnected) {
      toast.error('Нет подключения')
      return false
    }
    if (!token) {
      toast.error('Нет токена авторизации')
      return false
    }
    return true
  }, [isConnected, token, toast])

  const load = useCallback(() => {
    if (!isConnected || !token) return
    const store = useMembersStore.getState()
    store.setLoading(true)
    once('get_company_members', (response: any) => {
      store.setLoading(false)
      if (response?.success) {
        store.setItems(asMemberList(response.data))
      } else {
        toast.error(response?.message || 'Не удалось загрузить водителей')
      }
    })
    emit('get_company_members', { token })
  }, [isConnected, token, once, emit, toast])

  const add = useCallback(
    (input: AddMemberInput): Promise<boolean> => {
      if (!ready()) return Promise.resolve(false)
      const store = useMembersStore.getState()
      store.setSaving(true)
      const payload: Record<string, unknown> = {
        token,
        phone: input.phone,
        name: input.name,
        role: 'driver',
      }
      if (input.transport_id != null && input.transport_id !== '') {
        payload.transport_id = input.transport_id
      }
      return new Promise((resolve) => {
        once('add_company_member', (response: any) => {
          store.setSaving(false)
          if (response?.success) {
            toast.success('Водитель добавлен')
            load()
            resolve(true)
          } else {
            toast.error(response?.message || 'Не удалось добавить водителя')
            resolve(false)
          }
        })
        emit('add_company_member', payload)
      })
    },
    [ready, token, once, emit, toast, load]
  )

  const setStatus = useCallback(
    (driverId: string, status: number) => {
      if (!ready()) return
      const store = useMembersStore.getState()
      const prev = store.items.find((m) => m.driver_id === driverId)?.status
      store.patchItem(driverId, { status })
      once('upd_company_member', (response: any) => {
        if (response?.success) {
          toast.success(status === MEMBER_STATUS.ACTIVE ? 'Водитель активирован' : 'Водитель отстранён')
        } else {
          if (prev != null) store.patchItem(driverId, { status: prev })
          toast.error(response?.message || 'Не удалось изменить статус')
        }
      })
      emit('upd_company_member', { token, driver_id: driverId, status, member_role: 'driver' })
    },
    [ready, token, once, emit, toast]
  )

  const remove = useCallback(
    (driverId: string) => {
      if (!ready()) return
      const store = useMembersStore.getState()
      once('del_company_member', (response: any) => {
        if (response?.success) {
          store.removeItem(driverId)
          toast.success('Водитель отвязан')
        } else {
          toast.error(response?.message || 'Не удалось отвязать водителя')
        }
      })
      emit('del_company_member', { token, driver_id: driverId })
    },
    [ready, token, once, emit, toast]
  )

  return { items, isLoading, isSaving, loaded, load, add, setStatus, remove }
}
