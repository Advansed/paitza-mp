export interface TOptions {
  ns?: string
  lng?: string
  count?: number
  defaultValue?: string
  [key: string]: unknown
}

export interface I18n {
  language: string
  resolvedLanguage: string
  readonly isInitialized: boolean
  use(plugin: unknown): I18n
  init(options?: Record<string, unknown>): Promise<I18n>
  addResourceBundle(lng: string, ns: string, resources: Record<string, unknown>): void
  t(key: string, options?: TOptions): string
  changeLanguage(lng: string): Promise<void>
  on(event: string, handler: (lng: string) => void): void
  off(event: string, handler: (lng: string) => void): void
}

declare const i18n: I18n
export default i18n
