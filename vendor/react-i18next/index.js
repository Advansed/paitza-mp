import { useCallback, useEffect, useState } from 'react'
import i18n from 'i18next'

export const initReactI18next = {
  type: '3rdParty',
  init() {},
}

export function useTranslation(ns) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const refresh = () => setTick((value) => value + 1)
    i18n.on('languageChanged', refresh)
    return () => i18n.off('languageChanged', refresh)
  }, [])

  const t = useCallback((key, options) => i18n.t(key, { ns, ...options }), [ns])
  return { t, i18n }
}
