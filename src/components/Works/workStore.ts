// src/Store/workStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import {
  WorkInfo,
  WorkStatus,
  WorkPageType,
  WorkFilters,
  OfferInfo,
  WorkPriority
} from './types'
import { normalizeCargoRoute } from '../../Store/cargoStore'
import { resolvePublishedAt } from './feedFormat'
import { normalizeWorkStatus, findWorkByRef, workIdsMatch } from './statusFlow'

// ============================================
// ТИПЫ
// ============================================
export interface WorkState {
  works: WorkInfo[]
  archiveWorks: WorkInfo[]
  isLoading: boolean
  currentPage: WorkPageType
  filters: WorkFilters
  searchQuery: string
  navigationHistory: WorkPageType[]
  error: string | null
}

interface WorkActions {
  setWorks: (works: WorkInfo[]) => void
  setArchiveWorks: (archiveWorks: WorkInfo[]) => void
  setLoading: (loading: boolean) => void
  setCurrentPage: (page: WorkPageType) => void
  replaceCurrentPage: (page: WorkPageType) => void
  setFilters: (filters: WorkFilters) => void
  setSearchQuery: (query: string) => void
  setNavigationHistory: (history: WorkPageType[]) => void
  setError: (error: string | null) => void
  updateWork: (guid: string | { guid?: string; cargo?: string }, data: Partial<WorkInfo>) => void
  addToArchive: (guid: string) => void
  markCompleted: (guid: string) => void
  clearError: () => void
  reset: () => void
}

type WorkStore = WorkState & WorkActions

// ============================================
// КОНСТАНТЫ
// ============================================

export const EMPTY_WORK: WorkInfo = {
  guid: '',
  cargo: '',
  recipient: '',
  client: '',
  name: '',
  transport: '',
  description: '',
  address: {
    city: { city: '', fias: '' },
    address: '',
    fias: '',
    lat: 0,
    lon: 0
  },
  destiny: {
    city: { city: '', fias: '' },
    address: '',
    fias: '',
    lat: 0,
    lon: 0
  },
  weight: 0,
  volume: 0,
  price: 0,
  advance: 0,
  insurance: 0,

  pickup_date: '',
  delivery_date: '',

  phone: '',
  face: '',

  status: WorkStatus.NEW,

  signed: false

}

// ============================================
// ZUSTAND STORE
// ============================================
export const useWorkStore = create<WorkStore>()(
  devtools(
    (set, get) => ({
      // STATE
      works: [],
      archiveWorks: [],
      isLoading: false,
      currentPage: { type: 'list' },
      filters: {},
      searchQuery: '',
      navigationHistory: [{ type: 'list' }],
      error: null,

      // ACTIONS
      setWorks: (works) => set({ works: works.map((item) => withLocalOffer(item)) }),
      setArchiveWorks: (archiveWorks) => set({ archiveWorks }),
      setLoading: (isLoading) => set({ isLoading }),
      setCurrentPage: (currentPage) => set({ currentPage }),
      /** Обновить текущий экран без записи в history (sync из стора) */
      replaceCurrentPage: (page) => {
        const { navigationHistory } = get()
        const nextHistory =
          navigationHistory.length > 0
            ? [...navigationHistory.slice(0, -1), page]
            : [page]
        set({
          currentPage: page,
          navigationHistory: nextHistory,
        })
      },
      setFilters: (filters) => set({ filters }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setNavigationHistory: (navigationHistory) => set({ navigationHistory }),
      setError: (error) => set({ error }),

      updateWork: (guid, data) => {
        const { works } = get()
        const updated = works.map(w => {
          if (!workIdsMatch(w, guid)) return w
          const next = { ...w, ...data }
          if (data.status !== undefined) {
            next.status = normalizeWorkStatus(data.status)
          }
          if (data.signed !== undefined) {
            next.signed = Boolean(data.signed)
          }
          return next
        })
        set({ works: updated })
      },

      addToArchive: (guid) => {
        const { works, archiveWorks } = get()
        const work = works.find(w => w.guid === guid)

        if (work) {
          const updatedWorks = works.filter(w => w.guid !== guid)
          const updatedArchive = [...archiveWorks, { ...work, status: WorkStatus.COMPLETED }]

          set({
            works: updatedWorks,
            archiveWorks: updatedArchive
          })
        }
      },

      markCompleted: (guid) => {
        const { updateWork, addToArchive } = get()
        updateWork(guid, { status: WorkStatus.COMPLETED })
        addToArchive(guid)
      },

      clearError: () => set({ error: null }),


      reset: () => set({
        works: [],
        archiveWorks: [],
        isLoading: false,
        currentPage: { type: 'list' },
        filters: {},
        searchQuery: '',
        navigationHistory: [{ type: 'list' }],
        error: null
      })

    }),
    { name: 'work-store' }
  )
)

// ============================================
// GETTERS
// ============================================
export const workGetters = {
  getWorks: (): WorkInfo[] => useWorkStore.getState().works,
  getArchiveWorks: (): WorkInfo[] => useWorkStore.getState().archiveWorks,
  isLoading: (): boolean => useWorkStore.getState().isLoading,
  getError: (): string | null => useWorkStore.getState().error,

  getWork: (guid: string): WorkInfo | undefined => {
    return useWorkStore.getState().works.find(w => w.guid === guid)
  },

  getArchiveWork: (guid: string): WorkInfo | undefined => {
    return useWorkStore.getState().archiveWorks.find(w => w.guid === guid)
  },

  getCurrentWork: (): WorkInfo | undefined => {
    const currentPage = useWorkStore.getState().currentPage
    return currentPage.type === 'view' || currentPage.type === 'offer' || currentPage.type === 'map'
      ? currentPage.work
      : undefined
  },

  getOffer: (workId: string): OfferInfo | undefined => {
    const work = workGetters.getWork(workId)
    return work?.currentOffer
  }
}

// ============================================
// ACTIONS
// ============================================
export const workActions = {
  setWorks: (works: WorkInfo[]) => useWorkStore.getState().setWorks(works),
  setArchiveWorks: (archiveWorks: WorkInfo[]) => useWorkStore.getState().setArchiveWorks(archiveWorks),
  setLoading: (loading: boolean) => useWorkStore.getState().setLoading(loading),
  setCurrentPage: (page: WorkPageType) => useWorkStore.getState().setCurrentPage(page),
  replaceCurrentPage: (page: WorkPageType) => useWorkStore.getState().replaceCurrentPage(page),
  setFilters: (filters: WorkFilters) => useWorkStore.getState().setFilters(filters),
  setSearchQuery: (query: string) => useWorkStore.getState().setSearchQuery(query),
  setNavigationHistory: (history: WorkPageType[]) => useWorkStore.getState().setNavigationHistory(history),
  setError: (error: string | null) => useWorkStore.getState().setError(error),
  updateWork: (guid: string | { guid?: string; cargo?: string }, data: Partial<WorkInfo>) =>
    useWorkStore.getState().updateWork(guid, data),
  addToArchive: (guid: string) => useWorkStore.getState().addToArchive(guid),
  markCompleted: (guid: string) => useWorkStore.getState().markCompleted(guid),
  clearError: () => useWorkStore.getState().clearError(),
  reset: () => useWorkStore.getState().reset()
}

// ============================================
// SOCKET ОБРАБОТЧИКИ
// ============================================
const normalizeWorkCompany = (company: WorkInfo['company'] | Record<string, unknown> | null | undefined): WorkInfo['company'] => {
  if (!company || typeof company !== 'object') return undefined
  const raw = company as { id?: unknown; name?: unknown; verified?: unknown; is_verified?: unknown }
  const id = String(raw.id ?? '').trim()
  const name = String(raw.name ?? '').trim()
  if (!id && !name) return undefined
  const verified = raw.verified ?? raw.is_verified
  const rating = Number((raw as { rating?: unknown }).rating)
  const deals = Number((raw as { deals?: unknown; orders?: unknown }).deals
    ?? (raw as { orders?: unknown }).orders)
  return {
    id,
    name,
    ...(typeof verified === 'boolean' ? { verified } : {}),
    ...(Number.isFinite(rating) && rating > 0 ? { rating } : {}),
    ...(Number.isFinite(deals) && deals > 0 ? { deals: Math.round(deals) } : {}),
  }
}

const locallyOfferedIds = new Set<string>()

export function rememberOfferedWork(ref: { guid?: string; cargo?: string } | string) {
  const found = typeof ref === 'string' ? undefined : findWorkByRef(useWorkStore.getState().works, ref)
  const ids = [
    typeof ref === 'string' ? ref : ref.guid,
    typeof ref === 'string' ? undefined : ref.cargo,
    found?.guid,
    found?.cargo,
  ]
  ids.filter(Boolean).forEach((id) => locallyOfferedIds.add(String(id)))
}

export function forgetOfferedWork(ref: { guid?: string; cargo?: string } | string) {
  const found = findWorkByRef(useWorkStore.getState().works, ref)
  const ids = [
    typeof ref === 'string' ? ref : ref.guid,
    typeof ref === 'string' ? undefined : ref.cargo,
    found?.guid,
    found?.cargo,
  ]
  ids.filter(Boolean).forEach((id) => locallyOfferedIds.delete(String(id)))
}

export function isLocallyOffered(work: { guid?: string; cargo?: string }): boolean {
  const ids = [work.guid, work.cargo].filter(Boolean).map(String)
  return ids.some((id) => locallyOfferedIds.has(id))
}

function withLocalOffer(work: WorkInfo): WorkInfo {
  if (!isLocallyOffered(work)) return work
  const status = normalizeWorkStatus(work.status)
  if (status === WorkStatus.NEW || status === WorkStatus.OFFERED) {
    return { ...work, status: WorkStatus.OFFERED }
  }
  ;[work.guid, work.cargo].filter(Boolean).forEach((id) => locallyOfferedIds.delete(String(id)))
  return work
}

const normalizeWork = (w: WorkInfo): WorkInfo => {
  const docs = (w as WorkInfo & { documents?: unknown }).documents
  const documents = Array.isArray(docs)
    ? docs.map((item) => String(item).trim()).filter(Boolean)
    : undefined
  return normalizeCargoRoute({
    ...w,
    status: normalizeWorkStatus(w.status),
    signed: Boolean(w.signed),
    company: normalizeWorkCompany(w.company),
    publish_date: resolvePublishedAt(w) || w.publish_date,
    ...(documents && documents.length > 0 ? { documents } : {}),
  })
}

export const workSocketHandlers = {
  onGetWorks: (response: any) => {

    workActions.setLoading(false)

    const ok = response?.success !== false

    // Полный список
    if (Array.isArray(response)) {
      if (!ok) {
        console.error('Invalid works response:', response)
        workActions.setError('Failed to load works')
        return
      }
      workActions.setWorks(response.map((item: WorkInfo) => withLocalOffer(normalizeWork(item))))
      return
    }

    if (Array.isArray(response?.data)) {
      if (!ok) {
        console.error('Invalid works response:', response)
        workActions.setError(response?.message || 'Failed to load works')
        return
      }
      workActions.setWorks(response.data.map((item: WorkInfo) => withLocalOffer(normalizeWork(item))))
      return
    }

    // Одиночный work — upsert по guid, не затирая список
    const single =
      response?.data && typeof response.data === 'object' && response.data.guid
        ? response.data
        : response && typeof response === 'object' && response.guid
          ? response
          : null

    if (ok && single) {
      const normalized = normalizeWork(single as WorkInfo)
      const { works } = useWorkStore.getState()
      const idx = works.findIndex((w) => workIdsMatch(w, normalized))
      if (idx >= 0) {
        const next = [...works]
        // Сохраняем исходный guid из стора, чтобы открытый экран не «терял» запись
        next[idx] = withLocalOffer({
          ...works[idx],
          ...normalized,
          guid: works[idx].guid || normalized.guid,
          cargo: normalized.cargo || works[idx].cargo,
        })
        workActions.setWorks(next)
      } else {
        workActions.setWorks([...works, normalized])
      }
      return
    }

    console.error('Invalid works response:', response)
    workActions.setError(response?.message || 'Failed to load works')
  },
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ SOCKET ОБРАБОТЧИКОВ
// ============================================
export const initWorkSocketHandlers = (socket: any) => {
  if (!socket) return

  socket.off('get_works')
  socket.on('get_works', workSocketHandlers.onGetWorks)

}

export const destroyWorkSocketHandlers = (socket: any) => {
  if (!socket) return

  socket.off('get_works', workSocketHandlers.onGetWorks)

}