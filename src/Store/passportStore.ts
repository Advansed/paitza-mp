// src/Store/passportStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// ============================================
// ТИПЫ
// ============================================
export interface PassportAddress {
  address: string;
  fias: string;
  lat: number;
  lon: number;
}

export interface PassportData {
  series?: string
  number?: string
  issue_date?: string
  issued_by?: string
  birth_date?: string
  birth_place?: string
  reg_address?: PassportAddress
  act_address?: PassportAddress
  /** Путь в приватном бакете (сохраняется в set_passport) */
  main_photo?: string
  reg_photo?: string
  /** Временная signed-ссылка для просмотра (только UI, не сохранять) */
  main_photo_url?: string
  reg_photo_url?: string
  isVerified?: boolean
  createdDate?: string
  updatedDate?: string
}

export interface PassportState {
  data: PassportData | null
  isLoading: boolean
  isSaving: boolean
  error: string | null
}

interface PassportActions {
  setData: (data: PassportData | null) => void
  setLoading: (loading: boolean) => void
  setSaving: (saving: boolean) => void
  setError: (error: string | null) => void
  updateData: (updates: Partial<PassportData>) => void
  clearError: () => void
  reset: () => void
}

type PassportStore = PassportState & PassportActions

// ============================================
// ZUSTAND STORE
// ============================================
export const usePassportData = () => usePassportStore(state => state.data)

export const usePassportStore = create<PassportStore>()(
  devtools(
    (set) => ({
      // STATE
      data: null,
      isLoading: false,
      isSaving: false,
      error: null,

      // ACTIONS
      setData: (data) => set({ data }),
      setLoading: (isLoading) => set({ isLoading }),
      setSaving: (isSaving) => set({ isSaving }),
      setError: (error) => set({ error }),
      
      updateData: (updates) => 
        set((state) => ({ 
          data: state.data ? { ...state.data, ...updates } : updates
        })),
      
      clearError: () => set({ error: null }),
      
      reset: () => set({
        data: null,
        isLoading: false,
        isSaving: false,
        error: null
      })
    }),
    { name: 'passport-store' }
  )
)

// ============================================
// GETTERS
// ============================================
export const passportGetters = {
  getData: (): PassportData | null => usePassportStore.getState().data,
  isLoading: (): boolean => usePassportStore.getState().isLoading,
  isSaving: (): boolean => usePassportStore.getState().isSaving,
  getError: (): string | null => usePassportStore.getState().error,

  isVerified: (): boolean => {
    const data = usePassportStore.getState().data
    return data?.isVerified || false
  },

  getCompletionPercentage: (): number => {
    const data = usePassportStore.getState().data
    if (!data) return 0
    
    const requiredFields = ['series', 'number', 'issue_date', 'issued_by', 'birth_date', 'birth_place'] as const
    const optionalFields = ['reg_address', 'act_address', 'main_photo', 'reg_photo'] as const
    
    const totalFields = requiredFields.length + optionalFields.length
    let filledCount = 0
    
    // Обязательные поля
    requiredFields.forEach(field => {
      if (data[field]) filledCount++
    })
    
    // Опциональные поля  
    optionalFields.forEach(field => {
      const value = data[field]
      if (value && (typeof value === 'object' ? Object.keys(value).length > 0 : true)) filledCount++
    })
    
    return Math.round((filledCount / totalFields) * 100)
  }
}

// ============================================
// ACTIONS
// ============================================
export const passportActions = {
  setData: (data: PassportData | null) => usePassportStore.getState().setData(data),
  setLoading: (loading: boolean) => usePassportStore.getState().setLoading(loading),
  setSaving: (saving: boolean) => usePassportStore.getState().setSaving(saving),
  setError: (error: string | null) => usePassportStore.getState().setError(error),
  updateData: (updates: Partial<PassportData>) => usePassportStore.getState().updateData(updates),
  clearError: () => usePassportStore.getState().clearError(),
  reset: () => usePassportStore.getState().reset()
}

// ============================================
// SOCKET ОБРАБОТЧИКИ
// ============================================
export const passportSocketHandlers = {
  onGetPassport: (response: any) => {
    
    passportActions.setLoading(false)
    
    if (response.success) {
      passportActions.setData(response.data)
    } else {
      console.error('Invalid passport response:', response)
      passportActions.setError(response.message || 'Failed to load passport data')
    }
  },

  onSavePassport: (response: any) => {
    
    passportActions.setSaving(false)
    
    if (response.success && response.data) {
      passportActions.setData(response.data)
    } else {
      passportActions.setError(response.message || 'Failed to save passport data')
    }
  }
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ SOCKET ОБРАБОТЧИКОВ
// ============================================
export const initPassportSocketHandlers = (socket: any) => {
  if (!socket) return
  
  socket.on('get_passport', passportSocketHandlers.onGetPassport)
  
}

export const destroyPassportSocketHandlers = (socket: any) => {
  if (!socket) return
  
  socket.off('get_passport', passportSocketHandlers.onGetPassport)

}