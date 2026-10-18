import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigation } from './useNavigation'
import { useValidate } from './useValidate'
import { useSocket } from '../../../../Store/useSocket'
import { loginActions, useLoginStore } from '../../../../Store/loginStore'
import { useToast } from '../../../Toast'
import type { OtpTransport } from '../../otpTransport'
import { normalizeOtpTransport } from '../../otpTransport'
import { parseLoginPhone } from '../../phone'
import { tokenFromCheckSmsResponse } from '../../tokenFromOtpResponse'
import {
  buildCheckRegistrationPayload,
  type CheckRegistrationPayload,
} from '../registrationPayload'

export type RegistrationData = CheckRegistrationPayload

export interface RegistrationLocalState {
  formData: Record<string, any>
  isLoading: boolean
  error: string
}

export interface UseRegReturn extends RegistrationLocalState {
  registrationStep: number
  nextStep: () => void
  prevStep: () => void

  formErrors: Record<string, string>
  validateField: (field: string, value: any) => string | null
  clearErrors: () => void

  register: (data: RegistrationData) => Promise<void>
  submitStep: () => Promise<void>

  updateFormData: (field: string, value: any) => void
}

export interface SocketResponse {
  success: boolean
  data?: any
  message?: string
}

export interface PasswordData {
  token: string
  password: string
  password1: string
}

const INITIAL_REG_STATE: RegistrationLocalState = {
  formData: {
    otpTransport: 'sms',
    consentPersonalData: false,
    consentUserAgreement: false,
    consentMarketing: false,
    gender: '',
  },
  isLoading: false,
  error: '',
}

/** 0 — данные, 1 — SMS, 2 — пароль */
const TOTAL_STEPS = 3

export const useReg = (opts?: { onRegistered?: () => void }): UseRegReturn => {
  const navigation = useNavigation(TOTAL_STEPS)
  const validation = useValidate()
  const onRegisteredRef = useRef(opts?.onRegistered)
  onRegisteredRef.current = opts?.onRegistered

  const [state, setState] = useState<RegistrationLocalState>(INITIAL_REG_STATE)
  const isMountedRef = useRef(true)
  const { socket, emit } = useSocket()
  const toast = useToast()

  const updateState = useCallback((updates: Partial<RegistrationLocalState>) => {
    if (isMountedRef.current) {
      setState((prev) => ({ ...prev, ...updates }))
    }
  }, [])

  const updateFormData = useCallback(
    (field: string, value: any) => {
      setState((prev) => ({
        ...prev,
        formData: { ...prev.formData, [field]: value },
      }))
      validation.clearFieldError(field)
    },
    [validation]
  )

  const register = useCallback(
    async (payload: CheckRegistrationPayload) => {
      updateState({ isLoading: true, error: '' })
      validation.clearErrors()

      try {
        const parsedPhone = parseLoginPhone(payload.code)
        if (!parsedPhone.ok) {
          updateState({ error: parsedPhone.error, isLoading: false })
          return
        }
        if (!payload.name) {
          updateState({ error: 'Заполните ФИО', isLoading: false })
          return
        }

        const body: CheckRegistrationPayload = {
          ...payload,
          code: parsedPhone.e164,
        }

        loginActions.updateUser({
          phone: body.code,
          name: body.name,
          email: body.email || '',
          user_type: body.userType,
          transport: body.transport,
        })

        const success = emit('check_registration', body)

        if (!success) {
          throw new Error('Нет подключения к серверу')
        }
      } catch (error) {
        console.error('Registration error:', error)
        updateState({
          error: error instanceof Error ? error.message : 'Ошибка регистрации',
          isLoading: false,
        })
      }
    },
    [updateState, validation, emit]
  )

  const checkSMS = useCallback(
    async (data: { phone: string; pincode?: string; transport?: OtpTransport }) => {
      updateState({ isLoading: true, error: '' })
      validation.clearErrors()

      try {
        const transport = normalizeOtpTransport(data.transport)
        const body = {
          phone: data.phone,
          pincode: data.pincode,
          transport,
        }
        const success = emit('check_sms', body)

        if (!success) {
          throw new Error('Нет подключения к серверу')
        }
      } catch (error) {
        console.error('SMS check error:', error)
        updateState({
          error: error instanceof Error ? error.message : 'Ошибка проверки SMS',
          isLoading: false,
        })
      }
    },
    [updateState, validation, emit]
  )

  const submitStep = useCallback(async () => {
    const login = useLoginStore.getState()

    switch (navigation.currentStep) {
      case 0: {
        if (!validation.validateForm('register', state.formData)) {
          return
        }
        const payload = buildCheckRegistrationPayload(state.formData)
        await register(payload)
        break
      }

      case 1:
        await checkSMS({
          phone: login.phone,
          pincode: state.formData.pincode,
          transport: login.transport as OtpTransport | undefined,
        })
        break

      case 2: {
        const token = (login.token || '').trim()
        if (!token) {
          toast.error('Сессия истекла или код не подтверждён. Пройдите проверку SMS снова.')
          return
        }
        const passwordData: PasswordData = {
          token,
          password: state.formData.password || '',
          password1: state.formData.password1 || '',
        }

        if (validation.validateForm('password', passwordData)) {
          emit('save_password', passwordData)
        }
        break
      }
    }
  }, [navigation, validation, state.formData, register, checkSMS, emit, toast])

  useEffect(() => {
    isMountedRef.current = true

    if (!socket) return

    const handleRegistration = (response: SocketResponse) => {
      if (!isMountedRef.current) return

      updateState({ isLoading: false })

      const message = response.message || ''
      const alreadyExists = /уже зарегистрирован|already registered/i.test(message)

      if (response.success || alreadyExists) {
        if (alreadyExists) {
          toast.info('Аккаунт уже создан. Подтвердите телефон, чтобы задать пароль.')
        }
        navigation.nextStep()
      } else {
        updateState({ error: message || 'Ошибка регистрации' })
        toast.error(message || 'Ошибка регистрации')
      }
    }

    const handleSMSCheck = (response: SocketResponse) => {
      if (!isMountedRef.current) return

      updateState({ isLoading: false })

      if (response.success) {
        const token = tokenFromCheckSmsResponse(response.data)
        if (token) {
          loginActions.setToken(token)
        }
        navigation.nextStep()
      } else {
        updateState({ error: response.message || 'Неверный код' })
        toast.error(response.message || 'Неверный код')
      }
    }

    const handleSavePassword = (response: SocketResponse) => {
      if (!isMountedRef.current) return

      updateState({ isLoading: false })

      if (response.success) {
        updateState({ error: '' })
        toast.success('Регистрация завершена')
        navigation.reset()
        onRegisteredRef.current?.()
      } else {
        updateState({ error: response.message || 'Ошибка сохранения пароля' })
        toast.error(response.message || 'Ошибка сохранения пароля')
      }
    }

    socket.on('check_registration', handleRegistration)
    socket.on('check_sms', handleSMSCheck)
    socket.on('save_password', handleSavePassword)

    return () => {
      isMountedRef.current = false

      if (socket) {
        socket.off('check_registration', handleRegistration)
        socket.off('check_sms', handleSMSCheck)
        socket.off('save_password', handleSavePassword)
      }
    }
  }, [socket, updateState, navigation, toast])

  return {
    ...state,
    registrationStep: navigation.currentStep,
    nextStep: navigation.nextStep,
    prevStep: navigation.prevStep,
    formErrors: validation.errors,
    validateField: validation.validateField,
    clearErrors: validation.clearErrors,
    register,
    submitStep,
    updateFormData,
  }
}
