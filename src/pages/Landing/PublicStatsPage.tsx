import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { applyDocumentLocale, intlLocale } from '../../i18n'
import { LanguageSwitcher } from '../../i18n/LanguageSwitcher'
import { URL } from '../../Store/api'
import landing from './LandingPage.module.css'
import styles from './PublicStatsPage.module.css'

type MonthPoint = { month: string; cargos: number; trips: number }
type MoneyMonth = { month: string; income: number; expense: number }
type MoneyRow = { currency: string; income: number; expense: number; months: MoneyMonth[] }
type StatsData = {
  companies: number
  carriers: number
  countries: number
  openCargos: number
  orders: number
  trips: number
  completed: number
  months: MonthPoint[]
  money: MoneyRow[]
}

const CARDS: Array<{ key: keyof Pick<StatsData, 'companies' | 'carriers' | 'countries' | 'openCargos' | 'orders' | 'trips' | 'completed'>; label: string }> = [
  { key: 'companies', label: 'statCompanies' },
  { key: 'carriers', label: 'statCarriers' },
  { key: 'countries', label: 'statCountries' },
  { key: 'openCargos', label: 'statOpen' },
  { key: 'orders', label: 'statOrders' },
  { key: 'trips', label: 'statTrips' },
  { key: 'completed', label: 'statCompleted' },
]

function monthLabel(key: string, locale: string) {
  const [year, month] = key.split('-').map(Number)
  if (!year || !month) return key
  return new Date(year, month - 1, 1).toLocaleDateString(locale, { month: 'short' }).replace('.', '')
}

function formatCount(value: number, locale: string) {
  return value.toLocaleString(locale)
}

function formatMoney(value: number, currency: string, locale: string) {
  try {
    return value.toLocaleString(locale, { style: 'currency', currency, maximumFractionDigits: 0 })
  } catch {
    return `${value.toLocaleString(locale)} ${currency}`
  }
}

function Bars({
  rows,
  leftKey,
  rightKey,
  leftClass,
  rightClass,
  locale,
}: {
  rows: Array<{ month: string; [key: string]: number | string }>
  leftKey: string
  rightKey: string
  leftClass: string
  rightClass: string
  locale: string
}) {
  const max = Math.max(
    1,
    ...rows.map((row) => Math.max(Number(row[leftKey]) || 0, Number(row[rightKey]) || 0)),
  )
  return (
    <div className={styles.chart}>
      {rows.map((row) => {
        const left = Number(row[leftKey]) || 0
        const right = Number(row[rightKey]) || 0
        const height = (value: number) => (value <= 0 ? 0 : Math.max(6, (value / max) * 100))
        return (
          <div key={String(row.month)} className={styles.chartCol}>
            <div className={styles.chartBars}>
              <div className={`${styles.bar} ${leftClass}`} style={{ height: `${height(left)}%` }} />
              <div className={`${styles.bar} ${rightClass}`} style={{ height: `${height(right)}%` }} />
            </div>
            <span className={styles.chartLabel}>{monthLabel(String(row.month), locale)}</span>
          </div>
        )
      })}
    </div>
  )
}

export const PublicStatsPage: React.FC = () => {
  const { t, i18n } = useTranslation('landing')
  const locale = intlLocale()
  const [data, setData] = useState<StatsData | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const title = `${t('statsTitle')} — PAITZA`
    document.title = title
    return () => {
      applyDocumentLocale(i18n.language)
    }
  }, [i18n.language, t])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`${URL}/public/stats`)
        const json = await res.json()
        if (!res.ok || !json?.success || !json.data) throw new Error('stats')
        if (!cancelled) {
          setData(json.data as StatsData)
          setError(false)
        }
      } catch {
        if (!cancelled) setError(true)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className={landing.page}>
      <div className={landing.topStack}>
        <header className={landing.header}>
          <div className={landing.headerInner}>
            <Link to="/" className={landing.brand}>
              <img src="/landing/logo.jpg" alt="" className={landing.brandLogo} width={44} height={44} />
              <span className={landing.brandText}>
                <strong>PAITZA</strong>
                <small>GLOBAL LOGISTICS PLATFORM</small>
              </span>
            </Link>
            <div className={landing.headerActions}>
              <LanguageSwitcher />
              <Link to="/" className={landing.btnGhost}>
                {t('navHome')}
              </Link>
            </div>
          </div>
        </header>
      </div>

      <section className={styles.hero}>
        <div className={styles.heroMedia} aria-hidden>
          <div className={styles.heroShade} />
        </div>
        <div className={styles.heroInner}>
          <p className={styles.kicker}>{t('navStats')}</p>
          <h1 className={styles.heroTitle}>{t('statsTitle')}</h1>
          <p className={styles.heroLead}>{t('statsLead')}</p>
        </div>
      </section>

      {error && <p className={styles.error}>{t('statsError')}</p>}
      {!error && !data && <p className={styles.status}>{t('statsLoading')}</p>}

      {data && (
        <>
          <section className={styles.metrics} aria-label={t('metricsLabel')}>
            <ul className={styles.metricsGrid}>
              {CARDS.map((card) => (
                <li key={card.key} className={styles.metric}>
                  <strong>{formatCount(Number(data[card.key]) || 0, locale)}</strong>
                  <span>{t(card.label)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.band} aria-label={t('chartTitle')}>
            <article className={styles.card}>
              <h2>{t('chartTitle')}</h2>
              <Bars
                rows={data.months}
                leftKey="cargos"
                rightKey="trips"
                leftClass={styles.barCargo}
                rightClass={styles.barTrip}
                locale={locale}
              />
              <div className={styles.legend}>
                <span><i className={`${styles.swatch} ${styles.barCargo}`} />{t('chartCargos')}</span>
                <span><i className={`${styles.swatch} ${styles.barTrip}`} />{t('chartTrips')}</span>
              </div>
            </article>
          </section>

          <section className={styles.bandAlt} aria-label={t('moneyTitle')}>
            <article className={styles.card}>
              <h2>{t('moneyTitle')}</h2>
              {data.money.length === 0 ? (
                <p className={styles.muted}>{t('moneyEmpty')}</p>
              ) : (
                data.money.map((row) => (
                  <div key={row.currency} className={styles.moneyBlock}>
                    <h3>{row.currency}</h3>
                    <div className={styles.moneyTotals}>
                      <div>
                        <strong>{formatMoney(row.income, row.currency, locale)}</strong>
                        <span>{t('moneyIncome')}</span>
                      </div>
                      <div>
                        <strong>{formatMoney(row.expense, row.currency, locale)}</strong>
                        <span>{t('moneyExpense')}</span>
                      </div>
                    </div>
                    <Bars
                      rows={row.months}
                      leftKey="income"
                      rightKey="expense"
                      leftClass={styles.barIncome}
                      rightClass={styles.barExpense}
                      locale={locale}
                    />
                    <div className={styles.legend}>
                      <span><i className={`${styles.swatch} ${styles.barIncome}`} />{t('moneyIncome')}</span>
                      <span><i className={`${styles.swatch} ${styles.barExpense}`} />{t('moneyExpense')}</span>
                    </div>
                  </div>
                ))
              )}
            </article>
          </section>
        </>
      )}

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <Link to="/">{t('navHome')}</Link>
        </div>
      </footer>
    </div>
  )
}

export default PublicStatsPage
