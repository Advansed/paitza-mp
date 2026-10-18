/**
 * Все утилиты для Login модуля
 */

import { parseLoginPhone, formatLoginPhoneInternational } from './phone'

// ======================
// ВАЛИДАЦИЯ
// ======================

export const validateField = (field: string, value: any): string | null => {
  switch (field) {
    case 'phone':
      if (!value || value.trim() === '') return 'Заполните телефон'
      {
        const parsed = parseLoginPhone(value)
        return parsed.ok ? null : parsed.error
      }
      
    case 'password':
      if (!value || value.trim() === '') return 'Заполните пароль'
      return value.length < 4 ? 'Пароль должен содержать минимум 4 символа' : null
      
    case 'password1':
      if (!value || value.trim() === '') return 'Подтвердите пароль'
      return null
      
    case 'name':
      if (!value || value.trim() === '') return 'Заполните ФИО'
      return value.length < 2 ? 'Имя должно содержать минимум 2 символа' : null
      
    case 'email':
      if (!value || value.trim() === '') return null // email необязательный
      const emailRegex = /\S+@\S+\.\S+/
      return emailRegex.test(value) ? null : 'Неверный формат email'
      
    default:
      return null
  }
}

export const validateForm = (formType: string, data: any): Record<string, string> => {
  const errors: Record<string, string> = {}
  
  switch (formType) {
    case 'login':
      const phoneError = validateField('phone', data.phone)
      const passwordError = validateField('password', data.password)
      if (phoneError) errors.phone = phoneError
      if (passwordError) errors.password = passwordError
      break
      
    case 'register':
      const regPhoneError = validateField('phone', data.phone)
      const nameError = validateField('name', data.name)
      const emailError = validateField('email', data.email)
      if (regPhoneError) errors.phone = regPhoneError
      if (nameError) errors.name = nameError
      if (emailError) errors.email = emailError
      break
      
    case 'password':
      const pwd1Error = validateField('password', data.password)
      const pwd2Error = validateField('password1', data.password1)
      if (pwd1Error) errors.password = pwd1Error
      if (pwd2Error) errors.password1 = pwd2Error
      if (data.password && data.password1 && data.password !== data.password1) {
        errors.password1 = 'Пароли не совпадают'
      }
      break
  }
  
  return errors
}

// ======================
// ФОРМАТИРОВАНИЕ
// ======================

export const formatPhone = (phone: string): string => {
  if (!phone) return ''
  const parsed = parseLoginPhone(phone)
  if (parsed.ok) return parsed.e164
  const digits = phone.replace(/\D/g, '')
  return digits ? `+${digits}` : ''
}

/** @deprecated Используйте parseLoginPhone; оставлено для совместимости импортов */
export const Phone = (phone: string): string => formatPhone(phone)

export const formatPhoneDisplay = (phone: string): string => {
  if (!phone?.trim()) return phone
  return formatLoginPhoneInternational(phone)
}

// ======================
// БЕЗОПАСНОЕ ХРАНЕНИЕ
// ======================

export const secureStorage = {
  set: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  },
  
  get: (key: string): string | null => {
    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return null
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Error removing from localStorage:', error)
    }
  }
}

// ======================
// КОНСТАНТЫ
// ======================

export const STORAGE_KEYS = {
  PHONE: 'serv-tm1.phone',
  TOKEN: 'serv-tm1.token'
}

export const VALIDATION_PATTERNS = {
  email: /\S+@\S+\.\S+/
}