import { useState, useCallback } from 'react'
import { validateLoginPhoneRaw } from '../../phone'
import { fullNameFromParts } from '../registrationPayload'

export interface UseValidateReturn {
  errors: Record<string, string>
  validateField: (field: string, value: any) => string | null
  validateForm: (formType: string, data: any) => boolean
  clearErrors: () => void
  clearFieldError: (field: string) => void
}

const dateRe = /^\d{2}\.\d{2}\.\d{4}$/

export const validateRegistrationField = (field: string, value: any): string | null => {
  switch (field) {
    case 'phone':
      if (!value || String(value).trim() === '') return 'Заполните телефон'
      return validateLoginPhoneRaw(value)
    case 'lastName':
      if (!value || String(value).trim() === '') return 'Заполните фамилию'
      return null
    case 'firstName':
      if (!value || String(value).trim() === '') return 'Заполните имя'
      return null
    case 'middleName':
      return null
    case 'name': {
      const n = String(value || '').trim().replace(/\s+/g, ' ')
      if (!n) return 'Заполните ФИО'
      if (n.length < 2) return 'Имя должно содержать минимум 2 символа'
      if (n.split(' ').length < 2) return 'Укажите фамилию и имя'
      return null
    }
    case 'birthDate':
      if (!value || String(value).trim() === '') return 'Укажите дату рождения'
      if (!dateRe.test(String(value).trim())) return 'Формат: дд.мм.гггг'
      return null
    case 'birthPlace':
      if (!value || String(value).trim() === '') return 'Укажите место рождения'
      return null
    case 'gender':
      if (value !== 'male' && value !== 'female') return 'Выберите пол'
      return null
    case 'email':
      if (!value || String(value).trim() === '') return null
      return /\S+@\S+\.\S+/.test(value) ? null : 'Неверный формат email'
    case 'password':
      if (!value || String(value).trim() === '') return 'Заполните пароль'
      return String(value).length < 4 ? 'Пароль должен содержать минимум 4 символа' : null
    case 'password1':
      if (!value || String(value).trim() === '') return 'Подтвердите пароль'
      return null
    case 'consentPersonalData':
    case 'consentUserAgreement':
      if (!value) return 'Необходимо согласие'
      return null
    case 'pincode':
    case 'sms':
      if (!value || String(value).trim() === '') return 'Введите код подтверждения'
      return String(value).length !== 4 ? 'Код должен содержать 4 цифры' : null
    default:
      return null
  }
}

export const validateRegistrationForm = (formType: string, data: any): Record<string, string> => {
  const errors: Record<string, string> = {}

  switch (formType) {
    case 'register': {
      const phoneError = validateRegistrationField('phone', data.phone)
      const nameValue =
        (data.name || '').trim() ||
        fullNameFromParts(data.lastName || '', data.firstName || '', data.middleName || '')
      const nameError = validateRegistrationField('name', nameValue)
      const birthDateError = validateRegistrationField('birthDate', data.birthDate)
      const birthPlaceError = validateRegistrationField('birthPlace', data.birthPlace)
      const genderError = validateRegistrationField('gender', data.gender)
      const emailError = validateRegistrationField('email', data.email)
      const personalErr = validateRegistrationField('consentPersonalData', data.consentPersonalData)
      const agreeErr = validateRegistrationField('consentUserAgreement', data.consentUserAgreement)

      if (phoneError) errors.phone = phoneError
      if (nameError) errors.name = nameError
      if (birthDateError) errors.birthDate = birthDateError
      if (birthPlaceError) errors.birthPlace = birthPlaceError
      if (genderError) errors.gender = genderError
      if (emailError) errors.email = emailError
      if (personalErr) errors.consentPersonalData = personalErr
      if (agreeErr) errors.consentUserAgreement = agreeErr
      break
    }

    case 'password': {
      const pwd1Error = validateRegistrationField('password', data.password)
      const pwd2Error = validateRegistrationField('password1', data.password1)
      if (pwd1Error) errors.password = pwd1Error
      if (pwd2Error) errors.password1 = pwd2Error
      if (data.password && data.password1 && data.password !== data.password1) {
        errors.password1 = 'Пароли не совпадают'
      }
      break
    }

    case 'recovery_phone': {
      const phoneError1 = validateRegistrationField('phone', data.phone)
      if (phoneError1) errors.phone = phoneError1
      break
    }

    case 'recovery_sms': {
      const smsError = validateRegistrationField('sms', data.sms)
      if (smsError) errors.sms = smsError
      break
    }
  }

  return errors
}

export const useValidate = (): UseValidateReturn => {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateField = useCallback((field: string, value: any): string | null => {
    const error = validateRegistrationField(field, value)
    setErrors((prev) => ({ ...prev, [field]: error || '' }))
    return error
  }, [])

  const validateForm = useCallback((formType: string, data: any): boolean => {
    const newErrors = validateRegistrationForm(formType, data)
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [])

  const clearErrors = useCallback(() => setErrors({}), [])
  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }, [])

  return {
    errors,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError,
  }
}
