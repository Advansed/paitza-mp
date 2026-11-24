import React from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrencyRates } from '../../hooks/useCurrencyRates'
import { intlLocale } from '../../i18n'
import { CBR_RATE_CODES, type CbrRateCode } from '../../services/currencyRates'
import styles from './CurrencyRatesBar.module.css'

const RATE_KEYS: Record<CbrRateCode, string> = {
  USD: 'usd',
  EUR: 'eur',
  CNY: 'cny',
  KGS: 'kgs',
  TRY: 'try',
  KZT: 'kzt',
}

function formatRate(value: number): string {
  return value.toLocaleString(intlLocale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(intlLocale(), { day: 'numeric', month: 'short' })
}

export const CurrencyRatesBar: React.FC = () => {
  const { t } = useTranslation('landing')
  const { data, loading, error } = useCurrencyRates()

  if (error && !data) return null
  if (loading && !data) {
    return (
      <div className={styles.bar} aria-busy="true" aria-label={t('ratesLoading')}>
        <div className={styles.inner}>
          <span className={styles.meta}>{t('ratesCbr')}…</span>
        </div>
      </div>
    )
  }

  if (!data) return null

  const dateLabel = formatDate(data.date)

  return (
    <div className={styles.bar} role="region" aria-label={t('ratesLoading')}>
      <div className={styles.inner}>
        <span className={styles.meta}>{dateLabel ? `${t('ratesCbr')} ${dateLabel}` : t('ratesCbr')}</span>
        <div className={styles.scroller}>
          <ul className={styles.list}>
            {CBR_RATE_CODES.map((code) => (
              <li key={code} className={styles.item} title={t(RATE_KEYS[code])}>
                <span className={styles.code}>{code}</span>
                <span className={styles.value}>{formatRate(data.rates[code])} ₽</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
