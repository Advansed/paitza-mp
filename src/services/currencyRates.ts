/** Курсы ЦБ РФ: https://www.cbr-xml-daily.ru/daily_json.js */

export const CBR_RATE_CODES = ['USD', 'EUR', 'CNY', 'KGS', 'TRY', 'KZT'] as const

export type CbrRateCode = (typeof CBR_RATE_CODES)[number]

export type CbrRates = {
  date: string
  rates: Record<CbrRateCode, number>
}

type CbrValute = {
  Nominal?: number
  Value?: number
}

type CbrDailyJson = {
  Date?: string
  Timestamp?: string
  Valute?: Record<string, CbrValute>
}

const CBR_URL = 'https://www.cbr-xml-daily.ru/daily_json.js'

function unitRate(v: CbrValute | undefined): number | null {
  const nominal = Number(v?.Nominal)
  const value = Number(v?.Value)
  if (!Number.isFinite(value) || !Number.isFinite(nominal) || nominal <= 0) return null
  return value / nominal
}

export async function fetchCbrRates(): Promise<CbrRates> {
  const res = await fetch(CBR_URL, { cache: 'no-cache' })
  if (!res.ok) throw new Error(`CBR HTTP ${res.status}`)

  const data = (await res.json()) as CbrDailyJson
  const valute = data.Valute
  if (!valute) throw new Error('CBR: empty Valute')

  const rates = {} as Record<CbrRateCode, number>
  for (const code of CBR_RATE_CODES) {
    const rate = unitRate(valute[code])
    if (rate == null) throw new Error(`CBR: missing ${code}`)
    rates[code] = rate
  }

  return {
    date: data.Date || data.Timestamp || new Date().toISOString(),
    rates,
  }
}
