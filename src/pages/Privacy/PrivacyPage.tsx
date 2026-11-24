import React, { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { applyDocumentLocale } from '../../i18n'
import { LanguageSwitcher } from '../../i18n/LanguageSwitcher'
import { consentDocument } from './consentContent'
import { privacyDocument, privacyLocale } from './privacyContent'
import { PrivacyDocument } from './PrivacyDocument'
import styles from './PrivacyPage.module.css'

const BACK: Record<'ru' | 'en' | 'zh', string> = {
  ru: 'На главную',
  en: 'Back to home',
  zh: '返回首页',
}

export const PrivacyPage: React.FC = () => {
  const { i18n } = useTranslation()
  const { pathname } = useLocation()
  const locale = privacyLocale(i18n.resolvedLanguage || i18n.language)
  const content = pathname === '/consent' ? consentDocument(locale) : privacyDocument(locale)

  useEffect(() => {
    const title = `${content.title} — PAITZA`
    const apply = () => {
      document.title = title
    }
    apply()
    // setAppLocale writes the site title after the language change settles.
    const timers = [0, 50, 400].map((delay) => window.setTimeout(apply, delay))
    return () => {
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [content.title])

  useEffect(() => {
    return () => {
      applyDocumentLocale(i18n.language)
    }
  }, [i18n])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.brand}>
            <img src="/landing/logo.jpg" alt="" className={styles.brandLogo} width={40} height={40} />
            <span>PAITZA</span>
          </Link>
          <div className={styles.headerActions}>
            <LanguageSwitcher />
            <Link to="/" className={styles.back}>
              {BACK[locale]}
            </Link>
          </div>
        </div>
      </header>
      <main className={styles.main}>
        <PrivacyDocument content={content} />
      </main>
    </div>
  )
}

export default PrivacyPage
