// src/Store/useApp.ts
import { useEffect, useRef } from 'react'
import { useLoginStore } from './loginStore'
import { useSocket } from './useSocket'
import { isExecutorRole } from './roles'
import { companyActions, CompanyData, normalizeCompany } from './companyStore'
import { transportActions, asTransportList } from './transportStore'
import { accountActions } from './accountStore'

// ============================================
// HOOK
// ============================================

export const useApp = () => {
  const { auth, token, user_type } = useLoginStore()
  const { isConnected, emit, once } = useSocket()
  const hasLoadedCompany = useRef(false)
  const loadedTransportFor = useRef<number | null>(null)
  const hasLoadedTransportTypes = useRef(false)
  const hasLoadedBalance = useRef(false)

  // Загрузка данных компании при авторизации (обе роли — нужен is_verified)
  useEffect(() => {
    if (auth && isConnected && token && !hasLoadedCompany.current) {
      
      companyActions.setLoading(true)
      hasLoadedCompany.current = true

      const handleGetCompany = (response: { success: boolean; data?: CompanyData; message?: string }) => {
        companyActions.setLoading(false)
        
        if (response.success) {
          companyActions.setData(normalizeCompany(response.data))
        } else {
          console.error('Failed to load company data:', response.message)
          // Не показываем ошибку, так как данные компании могут отсутствовать
        }
      }

      once('get_company', handleGetCompany)
      emit('get_company', { token })
    }

    // Сброс флага при выходе
    if (!auth) {
      hasLoadedCompany.current = false
      companyActions.reset()
    }
  }, [auth, isConnected, token, user_type, emit, once])

  // Транспорт исполнителя и диспетчера; при смене роли список перезапрашивается
  useEffect(() => {
    if (auth && isConnected && token && isExecutorRole(user_type) && loadedTransportFor.current !== user_type) {
      const firstLoad = loadedTransportFor.current === null
      if (firstLoad) transportActions.setLoading(true)
      loadedTransportFor.current = user_type

      const handleGetTransport = (response: { success: boolean; data?: unknown; message?: string }) => {
        if (firstLoad) transportActions.setLoading(false)
        
        if (response.success) {
          const items = asTransportList(response.data)
          transportActions.setItems(items)
        } else {
          console.error('Failed to load transport data:', response.message)
          // Не показываем ошибку, так как данные транспорта могут отсутствовать
        }
      }

      once('get_transport', handleGetTransport)
      emit('get_transport', { token })
    }

    // Сброс флага при выходе
    if (!auth) {
      loadedTransportFor.current = null
      transportActions.reset()
    }
  }, [auth, isConnected, token, user_type, emit, once])

  // Справочник типов кузова — сокет get_transport_types
  useEffect(() => {
    if (!auth || !isConnected || !token || hasLoadedTransportTypes.current) {
      if (!auth) hasLoadedTransportTypes.current = false
      return
    }

    hasLoadedTransportTypes.current = true
    emit('get_transport_types', { token })
  }, [auth, isConnected, token, emit])

  // Баланс пользователя при авторизации
  useEffect(() => {
    if (auth && isConnected && token && !hasLoadedBalance.current) {
      hasLoadedBalance.current = true
      accountActions.setLoading(true)
      emit('get_balance', { token })
    }

    // Сброс флага при выходе
    if (!auth) {
      hasLoadedBalance.current = false
      accountActions.reset()
    }
  }, [auth, isConnected, token, emit])

  return {
    // Можно добавить другие данные, которые нужно загружать при авторизации
  }
}
