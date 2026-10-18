import type { CountryCode } from 'libphonenumber-js'

export type LoginCountry = {
  iso: CountryCode
  dial: string
  name: string
  /** CIS group for dropdown section */
  group: 'cis' | 'other'
}

/** URL прямоугольного флага (flagcdn) */
export function countryFlagUrl(iso: CountryCode, w = 40): string {
  return `https://flagcdn.com/w${w}/${iso.toLowerCase()}.png`
}

/** Популярные коды: СНГ и соседние */
export const LOGIN_COUNTRIES: LoginCountry[] = [
  { iso: 'RU', dial: '7', name: 'Россия', group: 'cis' },
  { iso: 'KZ', dial: '7', name: 'Казахстан', group: 'cis' },
  { iso: 'BY', dial: '375', name: 'Беларусь', group: 'cis' },
  { iso: 'UZ', dial: '998', name: 'Узбекистан', group: 'cis' },
  { iso: 'KG', dial: '996', name: 'Кыргызстан', group: 'cis' },
  { iso: 'AM', dial: '374', name: 'Армения', group: 'cis' },
  { iso: 'AZ', dial: '994', name: 'Азербайджан', group: 'cis' },
  { iso: 'TJ', dial: '992', name: 'Таджикистан', group: 'cis' },
  { iso: 'MD', dial: '373', name: 'Молдова', group: 'cis' },
  { iso: 'TM', dial: '993', name: 'Туркменистан', group: 'cis' },
  { iso: 'UA', dial: '380', name: 'Украина', group: 'cis' },
  { iso: 'GE', dial: '995', name: 'Грузия', group: 'other' },
  { iso: 'TR', dial: '90', name: 'Турция', group: 'other' },
  { iso: 'CN', dial: '86', name: 'Китай', group: 'other' },
  { iso: 'AE', dial: '971', name: 'ОАЭ', group: 'other' },
  { iso: 'DE', dial: '49', name: 'Германия', group: 'other' },
  { iso: 'PL', dial: '48', name: 'Польша', group: 'other' },
  { iso: 'US', dial: '1', name: 'США', group: 'other' },
]

export const DEFAULT_LOGIN_COUNTRY = LOGIN_COUNTRIES[0]

export function findCountryByIso(iso: string): LoginCountry {
  return LOGIN_COUNTRIES.find((c) => c.iso === iso) ?? DEFAULT_LOGIN_COUNTRY
}

export const CIS_COUNTRIES = LOGIN_COUNTRIES.filter((c) => c.group === 'cis')
export const OTHER_COUNTRIES = LOGIN_COUNTRIES.filter((c) => c.group === 'other')
