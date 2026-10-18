import { useCallback } from 'react';
import { useLoginStore, AuthResponse } from '../../Store/loginStore';
import { useToast } from '../Toast';
import { useSocket } from '../../Store/useSocket';
import { useCompanyStore, companyActions, CompanyData, toSetCompanyPayload } from '../../Store/companyStore';
import { useTransportStore, transportActions, TransportData } from '../../Store/transportStore';


export const useProfile = () => {
  const { setUser, token, user_type, image, name, phone, email } = useLoginStore()
  const toast = useToast()
  const { isConnected, emit, once } = useSocket()
  
  // Данные компании из store
  const companyData       = useCompanyStore(state => state.data)
  const isCompanyLoading  = useCompanyStore(state => state.isLoading)
  const isCompanySaving   = useCompanyStore(state => state.isSaving)
  
  // Данные транспорта из store
  const transportData     = useTransportStore(state => state.data)
  const isTransportLoading = useTransportStore(state => state.isLoading)
  const isTransportSaving  = useTransportStore(state => state.isSaving)

  const updateUser        = useCallback( async( userData: any ) => {
    if (!isConnected) {
      toast.error('Нет подключения к серверу')
      return false
    }

    try {
      return await new Promise<boolean>((resolve) => {
        const timeoutId = setTimeout(() => {
          toast.error('Превышено время ожидания ответа от сервера')
          resolve(false)
        }, 10000)

        const handleOnce = (response: { success: boolean; data?: AuthResponse; message?: string }) => {
          clearTimeout(timeoutId)
          
          if ( response.success ) {
            setUser( userData )
            toast.success('Данные пользователя обновлены')
            resolve(true)
          } else {
            toast.error(response.message || 'Ошибка обновления данных пользователя')
            resolve(false)
          }
        }
        
        once("set_user", handleOnce)
        emit("set_user", { token, ...userData })
      })
    } catch (error) {
      console.error('Ошибка при обновлении пользователя:', error)
      toast.error('Произошла ошибка при обновлении данных')
      return false
    }
  }, [setUser, token, isConnected, toast, emit, once]);

  const updateCompany     = useCallback( async( companyData: Partial<CompanyData> ) => {
    if (!isConnected) {
      toast.error('Нет подключения к серверу')
      return false
    }

    if (!token) {
      toast.error('Нет токена авторизации')
      return false
    }

    try {
      return await new Promise<boolean>((resolve) => {
        const timeoutId = setTimeout(() => {
          toast.error('Превышено время ожидания ответа от сервера')
          companyActions.setSaving(false)
          resolve(false)
        }, 10000)

        companyActions.setSaving(true)

        const payload = toSetCompanyPayload(companyData)
        const handleOnce = (response: { success: boolean; data?: CompanyData; message?: string; guid?: string }) => {
          clearTimeout(timeoutId)
          companyActions.setSaving(false)
          
          if ( response.success ) {
            const current = useCompanyStore.getState().data
            const guid = response.guid || response.data?.guid || payload.guid || current?.guid
            companyActions.setData({
              ...(current || {}),
              ...payload,
              ...(response.data || {}),
              guid,
            })
            toast.success('Данные компании обновлены')
            resolve(true)
          } else {
            toast.error(response.message || 'Ошибка обновления данных компании')
            resolve(false)
          }
        }
        
        once("set_company", handleOnce)
        emit("set_company", { token, ...payload })
      })
    } catch (error) {
      console.error('Ошибка при обновлении компании:', error)
      companyActions.setSaving(false)
      toast.error('Произошла ошибка при обновлении данных компании')
      return false
    }
  }, [token, isConnected, toast, emit, once]);

  const updateTransport = useCallback( async( transportData: Partial<TransportData> ) => {
    if (!isConnected) {
      toast.error('Нет подключения к серверу')
      return false
    }

    if (!token) {
      toast.error('Нет токена авторизации')
      return false
    }

    try {
      return await new Promise<boolean>((resolve) => {
        const timeoutId = setTimeout(() => {
          toast.error('Превышено время ожидания ответа от сервера')
          transportActions.setSaving(false)
          resolve(false)
        }, 10000)

        transportActions.setSaving(true)

        const handleOnce = (response: { success: boolean; data?: TransportData; message?: string }) => {
          clearTimeout(timeoutId)
          transportActions.setSaving(false)
          
          if ( response.success ) {
            const data = Array.isArray(response.data) ? response.data[0] : response.data
            transportActions.setData(data || transportData as TransportData)
            toast.success('Данные транспорта обновлены')
            resolve(true)
          } else {
            toast.error(response.message || 'Ошибка обновления данных транспорта')
            resolve(false)
          }
        }
        
        once("set_transport", handleOnce)
        emit("set_transport", { token, ...transportData })
      })
    } catch (error) {
      console.error('Ошибка при обновлении транспорта:', error)
      transportActions.setSaving(false)
      toast.error('Произошла ошибка при обновлении данных транспорта')
      return false
    }
  }, [token, isConnected, toast, emit, once]);

  return {
      setUser: updateUser
    , user_type
    , image
    , name
    , phone
    , email
    , companyData
    , isCompanyLoading
    , isCompanySaving
    , updateCompany
    , transportData
    , isTransportLoading
    , isTransportSaving
    , updateTransport
  };
};
