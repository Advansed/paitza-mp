// src/Store/useLogin.ts
import { useCallback } from 'react'
import { useSocket } from './useSocket'
import { useToast } from '../components/Toast'
import { AuthResponse, useLoginStore, UserData } from './loginStore'
import { parseLoginPhone } from '../components/Login/phone'
import { pushLogout } from '../services/pushNotifications'

// ============================================
// HOOK
// ============================================

export function useLogin() {
  // State subscriptions
  const {
    auth, id, name, phone, email, gender, image, token, user_type,
    description, account, ratings, agreements, isLoading,
    setAuth, setLoading, setUser, updateUser, clearAuth
  } = useLoginStore()
  

  // Services
  const { isConnected, emit, once } = useSocket()
  const toast = useToast()

  // User object
  const user = {
    id, name, phone, email, gender, image, token, 
    user_type, description, account, ratings, agreements
  }

  // ============================================
  // ACTIONS
  // ============================================

  const login = useCallback(async (phoneNumber: string, password: string): Promise<boolean> => {
    if (!isConnected) {
      toast.error('Нет подключения к серверу')
      return false
    }

    const parsedPhone = parseLoginPhone(phoneNumber)
    if (!parsedPhone.ok) {
      toast.error(parsedPhone.error)
      return false
    }

    setLoading(true)
    setAuth(false)

    try {
      return await new Promise<boolean>((resolve) => {

        const handleAuthResponse = (response: { success: boolean; data?: AuthResponse; message?: string }) => {
          setLoading(false)

          localStorage.setItem('gvrs.login', parsedPhone.e164)
          localStorage.setItem('gvrs.password', password)
          
          if (response.success && response.data) {
            const envelopeTax = (response as { tax?: unknown }).tax
            setUser({
              ...response.data,
              ...(response.data.tax === undefined && envelopeTax !== undefined
                ? { tax: envelopeTax as number }
                : {}),
            })
            setAuth( true )
            toast.success('Вход выполнен успешно')
            resolve(true)
          } else {
            toast.error(response.message || 'Ошибка входа')
            resolve(false)
          }
        }

        once('authorization', handleAuthResponse)
        emit('authorization', { phone: parsedPhone.e164, password })
      })
    } catch (error) {
      setLoading(false)
      toast.error('Произошла ошибка при входе')
      return false
    }
  }, [isConnected, setLoading, setAuth, setUser, toast, emit, once])

  const logout = useCallback(() => {
    void pushLogout()
    clearAuth()
    toast.success('Выход выполнен')
  }, [clearAuth, toast])

  const updateProfile = useCallback((updates: Partial<UserData>) => {
    updateUser(updates)
  }, [updateUser])

  // ============================================
  // RETURN
  // ============================================

  return {
    // State
    auth,
    user,
    isLoading,
    
    // Actions
    login,
    logout,
    updateProfile
  }
}