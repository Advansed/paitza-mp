import { useCallback } from 'react'
import { useToast } from '../components/Toast'
import { useToken } from './loginStore'
import { useSocket } from './useSocket'
import { useSocketStore } from './socketStore'
import { 
  useCompanyStore, 
  companyActions, 
  CompanyData,
  toSetCompanyPayload,
  normalizeCompany,
} from './companyStore'

// ============================================
// HOOK
// ============================================

export const useCompany = () => {
  const token = useToken()
  const { once, emit } = useSocket()
  
  // Используем хуки из нового companyStore
  const companyData = useCompanyStore(state => state.data)
  const isLoading = useCompanyStore(state => state.isLoading)
  const isSaving = useCompanyStore(state => state.isSaving)
  const isConnected = useSocketStore(state => state.isConnected)

  const toast = useToast()
  
  const loadData = useCallback(() => {
    if (!isConnected) {
      toast.error('Нет подключения')
      return
    }

    if (!token) {
      toast.error('Нет токена авторизации')
      return
    }

    companyActions.setLoading(true)

    once('get_company', (response) => {
      companyActions.setLoading(false)
      
      if (response.success) {
        companyActions.setData(normalizeCompany(response.data))
      } else {
        toast.error(response.message || 'Ошибка загрузки данных')
      }
    })

    emit('get_company', { token })
    
  }, [token, isConnected, once, emit, toast])

  const saveData = useCallback((data: CompanyData) => {
    if (!isConnected) {
      toast.error('Нет подключения')
      return
    }

    if (!token) {
      toast.error('Нет токена авторизации')
      return
    }

    companyActions.setSaving(true)

    const payload = toSetCompanyPayload(data)

    once('set_company', (response) => {
      companyActions.setSaving(false)
      
      if (response.success) {
        toast.success('Данные компании сохранены')
        const current = useCompanyStore.getState().data
        const guid = response.guid || response.data?.guid || payload.guid || current?.guid
        companyActions.setData(normalizeCompany({
          ...(current || {}),
          ...payload,
          ...(response.data || {}),
          guid,
        }))
      } else {
        toast.error(response.message || 'Ошибка сохранения данных')
      }
    })

    emit('set_company', { token, ...payload })
    toast.info("Данные компании сохраняются...")
    
  }, [token, isConnected, once, emit, toast])

  return {
    companyData,
    isLoading,
    isSaving,
    loadData,
    saveData
  }
}