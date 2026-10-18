/**
 * Payload для API регистрации (сокет).
 * Поля `check_registration` совпадают с OPENJSON на бэкенде.
 */

import type { OtpTransport } from '../otpTransport'

/** UI: male / female; в API → INT (1 = муж, 2 = жен) */
export type RegistrationGender = 'male' | 'female' | ''

export type RegistrationConsents = {
  personalData: boolean
  userAgreement: boolean
  marketing: boolean
}

/**
 * Тело `check_registration` → OPENJSON:
 * name, email, birth_date, birth_place, gender, userType
 * (+ code/transport для OTP, как раньше)
 */
export type CheckRegistrationPayload = {
  name: string
  email: string
  birth_date: string
  birth_place: string
  gender: number
  userType: number
  /** Телефон E.164 (исторически поле `code`) */
  code: string
  transport: OtpTransport
  /** t_users.partner UNIQUEIDENTIFIER NOT NULL */
  partner: string
}

const GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Дефолт, если нет ?partner= / VITE_DEFAULT_PARTNER.
 * Нулевой GUID процедура часто приводит к NULL → INSERT падает.
 * Не-нулевой: если ошибка сменится на FK — SQL читает $.partner.
 */
export const DEFAULT_PARTNER_GUID = '11111111-1111-1111-1111-111111111111'

export function resolveRegistrationPartner(explicit?: string): string {
  const candidates = [
    (explicit || '').trim(),
    typeof window !== 'undefined'
      ? (new URLSearchParams(window.location.search).get('partner') || '').trim()
      : '',
    typeof window !== 'undefined' ? (localStorage.getItem('gvrs.partner') || '').trim() : '',
    String(import.meta.env.VITE_DEFAULT_PARTNER || '').trim(),
  ]
  const found = candidates.find((value) => GUID_RE.test(value))
  return found || DEFAULT_PARTNER_GUID
}

/** Шаг 2 → событие `check_sms` */
export type CheckSmsPayload = {
  phone: string
  pincode: string
  transport: OtpTransport
}

/** Шаг 3 → событие `save_password` */
export type SavePasswordPayload = {
  token: string
  password: string
  password1: string
}

export function fullNameFromParts(
  lastName: string,
  firstName: string,
  middleName: string
): string {
  return [lastName, firstName, middleName].map((s) => s.trim()).filter(Boolean).join(' ')
}

/** Разбор строки ФИО → фамилия / имя / отчество */
export function splitFioString(full: string): {
  lastName: string
  firstName: string
  middleName: string
  name: string
} {
  const nameForParts = (full || '').trim().replace(/\s+/g, ' ')
  const parts = nameForParts ? nameForParts.split(' ') : []
  return {
    lastName: parts[0] || '',
    firstName: parts[1] || '',
    middleName: parts.slice(2).join(' ') || '',
    name: nameForParts,
  }
}

/** UI gender → INT для API (1 муж, 2 жен; дефолт SQL ISNULL = 1) */
export function genderToApiInt(gender: RegistrationGender | string | undefined): number {
  if (gender === 'female' || gender === '2') return 2
  return 1
}

/** дд.мм.гггг → yyyy-MM-dd для TRY_CAST AS DATETIME2 */
export function birthDateToApi(raw: string): string {
  const s = (raw || '').trim()
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  return s
}

export function buildCheckRegistrationPayload(form: {
  phone?: string
  name?: string
  lastName?: string
  firstName?: string
  middleName?: string
  birthDate?: string
  birthPlace?: string
  gender?: RegistrationGender | string
  email?: string
  userType?: number | string
  otpTransport?: string
  partner?: string
}): CheckRegistrationPayload {
  const fromName = splitFioString(form.name || '')
  const name =
    (form.name || '').trim() ||
    fullNameFromParts(
      form.lastName || fromName.lastName,
      form.firstName || fromName.firstName,
      form.middleName || fromName.middleName
    )
  const transport: OtpTransport = form.otpTransport === 'telegram' ? 'telegram' : 'sms'
  const userTypeRaw = Number(form.userType)
  const userType = Number.isFinite(userTypeRaw) && userTypeRaw > 0 ? userTypeRaw : 1

  const partner = resolveRegistrationPartner(form.partner)
  if (typeof window !== 'undefined' && partner !== DEFAULT_PARTNER_GUID) {
    localStorage.setItem('gvrs.partner', partner)
  }

  return {
    name: name.slice(0, 24),
    email: (form.email || '').trim().slice(0, 128),
    birth_date: birthDateToApi(form.birthDate || ''),
    birth_place: (form.birthPlace || '').trim().slice(0, 64),
    gender: genderToApiInt(form.gender),
    userType,
    code: (form.phone || '').trim(),
    transport,
    partner,
  }
}
