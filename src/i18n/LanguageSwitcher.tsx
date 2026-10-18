import React from 'react'
import { useTranslation } from 'react-i18next'
import { APP_LOCALES, LOCALE_SHORT, setAppLocale, type AppLocale } from './index'
import styles from './LanguageSwitcher.module.css'

type LanguageSwitcherProps = {
  variant?: 'ghost' | 'inline'
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'ghost' }) => {
  const { t, i18n } = useTranslation('common')
  const current = (i18n.resolvedLanguage || i18n.language || 'ru').slice(0, 2) as AppLocale

  return (
    <div
      className={`${styles.group} ${variant === 'inline' ? styles.inline : ''}`}
      role="group"
      aria-label={t('language')}
    >
      {APP_LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          className={current === locale ? styles.active : styles.btn}
          aria-pressed={current === locale}
          onClick={() => {
            void setAppLocale(locale)
          }}
        >
          {LOCALE_SHORT[locale]}
        </button>
      ))}
    </div>
  )
}
