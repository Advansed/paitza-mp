/**
 * Экспорт модуля регистрации
 */

export { useReg } from './hooks/useReg'
export { default as RegistrationForm } from './RegistrationForm'
export type * from './hooks/useReg'
export type * from './registrationPayload'
export { buildCheckRegistrationPayload, fullNameFromParts } from './registrationPayload'