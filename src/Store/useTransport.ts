// src/Store/useTransport.ts
import { useCallback } from 'react'
import { useToast } from '../components/Toast'
import { loginGetters } from './loginStore'
import { useSocket } from './useSocket'
import { useSocketStore } from './socketStore'
import { 
  useTransportStore, 
  transportActions, 
  asTransportList,
  TransportData 
} from './transportStore'

// ============================================
// HOOK
// ============================================

export const useTransport = () => {
  const { emit, once } = useSocket()
  const token = loginGetters.getToken()
  
  // Используем хуки из нового transportStore
  const transportData = useTransportStore(state => state.data)
  const types = useTransportStore(state => state.types)
  const isLoading = useTransportStore(state => state.isLoading)
  const isSaving = useTransportStore(state => state.isSaving)
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

    transportActions.setLoading(true)

    once('get_transport', (response) => {
      transportActions.setLoading(false)
      
      if (response.success) {
        transportActions.setItems(asTransportList(response.data))
      } else {
        toast.error(response.message || 'Ошибка загрузки данных транспорта')
      }
    })

    emit('get_transport', { token })
    
  }, [token, isConnected, once, emit, toast])

  const refresh = useCallback(() => {
    if (!isConnected || !token) return

    once('get_transport', (response) => {
      if (response?.success) {
        transportActions.setItems(asTransportList(response.data))
      }
    })

    emit('get_transport', { token })
  }, [token, isConnected, once, emit])

  const loadTypes = useCallback(() => {
    if (!isConnected || !token) return
    emit('get_transport_types', { token })
  }, [token, isConnected, emit])

  const saveData = useCallback((data: TransportData) => {
    if (!isConnected) {
      toast.error('Нет подключения')
      return
    }

    if (!token) {
      toast.error('Нет токена авторизации')
      return
    }

    transportActions.setSaving(true)

    once('set_transport', (response) => {
      transportActions.setSaving(false)
      
      if (response.success) {
        toast.success('Данные транспорта сохранены')
        const list = asTransportList(response.data)
        if (list.length > 1) transportActions.setItems(list)
        else transportActions.setData(list[0] || response.data || data)
      } else {
        toast.error(response.message || 'Ошибка сохранения данных транспорта')
      }
    })

    const payload = { token, guid: transportData?.guid, ...data }
    emit('set_transport', payload)
    toast.info("Данные транспорта сохраняются...")
    
  }, [token, transportData?.guid, isConnected, once, emit, toast])

  // Алиасы для совместимости
  const load = useCallback(() => { loadData() }, [loadData])
  const save = useCallback((data: TransportData) => { saveData(data) }, [saveData])

  return {
    transportData,
    types,
    isLoading,
    isSaving,
    loadData,
    refresh,
    loadTypes,
    saveData,
    // Для совместимости со старым API
    load,
    save
  }
}