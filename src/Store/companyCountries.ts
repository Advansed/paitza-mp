export type CompanyCountry = {
  code: string
  name: string
  taxLabel: string
  tax2Label: string
  regLabel: string
  currency: string
}

export const COMPANY_COUNTRIES: CompanyCountry[] = [
  { code: 'RU', name: 'Россия', taxLabel: 'ИНН', tax2Label: 'КПП', regLabel: 'ОГРН / ОГРНИП', currency: 'RUB' },
  { code: 'KZ', name: 'Казахстан', taxLabel: 'БИН / ИИН', tax2Label: 'Доп. налоговый номер', regLabel: 'Рег. номер', currency: 'KZT' },
  { code: 'KG', name: 'Кыргызстан', taxLabel: 'ИНН', tax2Label: 'Доп. налоговый номер', regLabel: 'ОКПО / рег. номер', currency: 'KGS' },
  { code: 'UZ', name: 'Узбекистан', taxLabel: 'ИНН (СТИР)', tax2Label: 'Доп. налоговый номер', regLabel: 'Рег. номер', currency: 'UZS' },
  { code: 'BY', name: 'Беларусь', taxLabel: 'УНП', tax2Label: 'Доп. налоговый номер', regLabel: 'Рег. номер', currency: 'BYN' },
  { code: 'AM', name: 'Армения', taxLabel: 'ИНН (ՀՎՀՀ)', tax2Label: 'Доп. налоговый номер', regLabel: 'Рег. номер', currency: 'AMD' },
  { code: 'TJ', name: 'Таджикистан', taxLabel: 'ИНН', tax2Label: 'Доп. налоговый номер', regLabel: 'Рег. номер', currency: 'TJS' },
  { code: 'CN', name: 'Китай', taxLabel: 'USCC', tax2Label: 'VAT No.', regLabel: 'Business License No.', currency: 'CNY' },
  { code: 'TR', name: 'Турция', taxLabel: 'VKN', tax2Label: 'Tax Office', regLabel: 'MERSIS No.', currency: 'TRY' },
  { code: 'AE', name: 'ОАЭ', taxLabel: 'TRN', tax2Label: 'Доп. налоговый номер', regLabel: 'Trade License No.', currency: 'AED' },
  { code: 'DE', name: 'Германия', taxLabel: 'Steuernummer', tax2Label: 'USt-IdNr. (VAT)', regLabel: 'Handelsregister No.', currency: 'EUR' },
]

export const OTHER_COUNTRY: CompanyCountry = {
  code: 'XX',
  name: 'Другая страна',
  taxLabel: 'Tax ID',
  tax2Label: 'VAT / доп. налоговый номер',
  regLabel: 'Registration No.',
  currency: 'USD',
}

export const COMPANY_CURRENCIES = ['RUB', 'USD', 'EUR', 'CNY', 'KZT', 'KGS', 'UZS', 'BYN', 'AMD', 'TJS', 'TRY', 'AED']

export function findCompanyCountry(code: string | null | undefined): CompanyCountry {
  const upper = (code || '').toUpperCase()
  return COMPANY_COUNTRIES.find((c) => c.code === upper) ?? { ...OTHER_COUNTRY, code: upper || OTHER_COUNTRY.code }
}
