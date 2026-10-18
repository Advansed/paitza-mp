import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

export const LOCALE_STORAGE_KEY = 'gvrs.lang'
export const APP_LOCALES = ['ru', 'en', 'zh'] as const
export type AppLocale = (typeof APP_LOCALES)[number]

export const LOCALE_SHORT: Record<AppLocale, string> = {
  ru: 'RU',
  en: 'EN',
  zh: '中文',
}

const NAMESPACES = [
  'common',
  'auth',
  'nav',
  'home',
  'works',
  'cargos',
  'settings',
  'finance',
  'drivers',
  'fleet',
  'chats',
] as const

function isLocale(value: string | null): value is AppLocale {
  return value === 'ru' || value === 'en' || value === 'zh'
}

export function detectLocale(): AppLocale {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (isLocale(saved)) return saved
  } catch {
    /* ignore */
  }
  const nav = (typeof navigator !== 'undefined' ? navigator.language : '').toLowerCase()
  if (nav.startsWith('zh')) return 'zh'
  if (nav.startsWith('en')) return 'en'
  return 'ru'
}

export function htmlLang(locale: string): string {
  if (locale.startsWith('zh')) return 'zh-CN'
  if (locale.startsWith('en')) return 'en'
  return 'ru'
}

export function intlLocale(locale = i18n.language): string {
  if (locale.startsWith('zh')) return 'zh-CN'
  if (locale.startsWith('en')) return 'en-US'
  return 'ru-RU'
}

/** Код языка для Google Maps / Places */
export function mapLanguage(locale = i18n.language): string {
  if (locale.startsWith('zh')) return 'zh-CN'
  if (locale.startsWith('en')) return 'en'
  return 'ru'
}

export function applyDocumentLocale(locale: string) {
  const lang = htmlLang(locale)
  document.documentElement.lang = lang
  const title = i18n.t('metaTitle', { ns: 'common' })
  const description = i18n.t('metaDescription', { ns: 'common' })
  if (title) document.title = title
  const meta = document.querySelector('meta[name="description"]')
  if (meta && description) meta.setAttribute('content', description)
}

const initial = detectLocale()

type LocaleBundle = Record<string, Record<string, unknown>>

const localeLoaders: Record<AppLocale, () => Promise<{ default: LocaleBundle }>> = {
  ru: () => import('./locales/ru.json'),
  en: () => import('./locales/en.json'),
  zh: () => import('./locales/zh.json'),
}

const localeCache = new Map<AppLocale, LocaleBundle>()

async function ensureLocale(locale: AppLocale): Promise<LocaleBundle> {
  const cached = localeCache.get(locale)
  if (cached) return cached
  const bundle = (await localeLoaders[locale]()).default
  localeCache.set(locale, bundle)
  if (i18n.isInitialized) {
    for (const ns of NAMESPACES) {
      const pack = bundle[ns]
      if (pack) i18n.addResourceBundle(locale, ns, pack, true, true)
    }
  }
  return bundle
}

export const i18nReady: Promise<void> = (async () => {
  const bundle = await ensureLocale(initial)
  await i18n.use(initReactI18next).init({
    resources: { [initial]: bundle },
    lng: initial,
    fallbackLng: initial,
    ns: [...NAMESPACES],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    returnNull: false,
  })
  applyDocumentLocale(initial)
})()

export async function setAppLocale(locale: AppLocale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    /* ignore */
  }
  await ensureLocale(locale)
  await i18n.changeLanguage(locale)
  applyDocumentLocale(locale)
}

i18n.on('languageChanged', (lng) => applyDocumentLocale(lng))

export default i18n
