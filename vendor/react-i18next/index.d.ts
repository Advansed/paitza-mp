import type { I18n, TOptions } from 'i18next'

export const initReactI18next: {
  type: '3rdParty'
  init: () => void
}

export function useTranslation(ns?: string): {
  t: (key: string, options?: TOptions) => string
  i18n: I18n
}
