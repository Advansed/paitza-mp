import parsePhoneNumberFromString, {
  AsYouType,
  getExampleNumber,
  type CountryCode,
} from 'libphonenumber-js'
import examples from 'libphonenumber-js/mobile/examples'
import { DEFAULT_LOGIN_COUNTRY, findCountryByIso, LOGIN_COUNTRIES } from './countries'

export const LOGIN_PHONE_DEFAULT_COUNTRY = 'RU' as const

export type ParseLoginPhoneResult =
  | { ok: true; e164: string }
  | { ok: false; error: string }

export function parseLoginPhone(
  raw: string,
  defaultCountry: CountryCode = LOGIN_PHONE_DEFAULT_COUNTRY
): ParseLoginPhoneResult {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) {
    return { ok: false, error: 'Заполните телефон' }
  }
  const parsed = parsePhoneNumberFromString(trimmed, defaultCountry)
  if (parsed?.isValid()) {
    return { ok: true, e164: parsed.number }
  }
  return { ok: false, error: 'Некорректный номер телефона' }
}

/** Сборка E.164 из выбранной страны и национального номера */
export function parseLoginPhoneParts(
  countryIso: CountryCode,
  nationalRaw: string
): ParseLoginPhoneResult {
  const digits = (nationalRaw ?? '').replace(/\D/g, '')
  if (!digits) {
    return { ok: false, error: 'Заполните телефон' }
  }
  const country = findCountryByIso(countryIso)
  const withPlus = `+${country.dial}${digits}`
  const parsed = parsePhoneNumberFromString(withPlus, countryIso)
  if (parsed?.isValid()) {
    return { ok: true, e164: parsed.number }
  }
  // Повтор с явным ISO (на случай +7 RU/KZ)
  const parsedByCountry = parsePhoneNumberFromString(digits, countryIso)
  if (parsedByCountry?.isValid()) {
    return { ok: true, e164: parsedByCountry.number }
  }
  return { ok: false, error: 'Некорректный номер телефона' }
}

/** Для `validateField`: `null` если ок, иначе текст ошибки */
export function validateLoginPhoneRaw(raw: string): string | null {
  const r = parseLoginPhone(raw)
  return r.ok ? null : r.error
}

export function validateLoginPhoneParts(
  countryIso: CountryCode,
  nationalRaw: string
): string | null {
  const r = parseLoginPhoneParts(countryIso, nationalRaw)
  return r.ok ? null : r.error
}

export function formatLoginPhoneInternational(raw: string): string {
  const parsed = parsePhoneNumberFromString(raw.trim(), LOGIN_PHONE_DEFAULT_COUNTRY)
  if (parsed?.isValid()) {
    return parsed.formatInternational()
  }
  return raw.trim()
}

/** Макс. длина национальных цифр */
function maxNationalDigits(country: CountryCode): number {
  const ex = getExampleNumber(country, examples)
  // разные страны — разная длина; чуть больше примера на запас
  if (ex?.nationalNumber) {
    return Math.min(Math.max(ex.nationalNumber.length + 1, 10), 15)
  }
  return 15
}

/**
 * Национальный номер с маской страны (AsYouType).
 * Код страны в поле не дублируется — он в селекторе.
 */
export function formatNationalPhoneInput(
  raw: string,
  country: CountryCode = LOGIN_PHONE_DEFAULT_COUNTRY
): string {
  const digits = (raw ?? '').replace(/\D/g, '').slice(0, maxNationalDigits(country))
  if (!digits) return ''
  return new AsYouType(country).input(digits)
}

/** Плейсхолдер по примеру мобильного номера страны */
export function nationalPhonePlaceholder(
  country: CountryCode = LOGIN_PHONE_DEFAULT_COUNTRY
): string {
  const ex = getExampleNumber(country, examples)
  if (!ex) return '999 000 00 00'
  return formatNationalPhoneInput(ex.nationalNumber, country) || '999 000 00 00'
}

/** Разбор сохранённого E.164 → страна + национальный номер (цифры) */
export function splitE164ToParts(e164: string): {
  countryIso: CountryCode
  national: string
} {
  const parsed = parsePhoneNumberFromString(e164.trim())
  if (parsed?.isValid() && parsed.country) {
    const known = LOGIN_COUNTRIES.find((c) => c.iso === parsed.country)
    return {
      countryIso: (known?.iso ?? parsed.country) as CountryCode,
      national: parsed.nationalNumber,
    }
  }
  return {
    countryIso: DEFAULT_LOGIN_COUNTRY.iso,
    national: e164.replace(/\D/g, ''),
  }
}

/**
 * Форматирование при вводе полного номера (скобки/пробелы; дефолт RU, после + переключается код страны).
 */
export function formatPhoneInputDisplay(
  raw: string,
  defaultCountry: CountryCode = LOGIN_PHONE_DEFAULT_COUNTRY
): string {
  if (raw == null || raw === '') return ''
  const ay = new AsYouType(defaultCountry)
  let formatted = ''
  for (const ch of raw) {
    formatted = ay.input(ch)
  }
  return formatted
}
