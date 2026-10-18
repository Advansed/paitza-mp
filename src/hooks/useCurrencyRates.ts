import { useEffect, useState } from 'react'
import {
  type CbrRates,
  fetchCbrRates,
} from '../services/currencyRates'

const CACHE_KEY = 'gvr_cbr_rates_v1'
const CACHE_TTL_MS = 60 * 60 * 1000

type CachePayload = {
  savedAt: number
  data: CbrRates
}

type State = {
  data: CbrRates | null
  loading: boolean
  error: string | null
}

function readCache(): CbrRates | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachePayload
    if (!parsed?.data?.rates || !parsed.savedAt) return null
    if (Date.now() - parsed.savedAt > CACHE_TTL_MS) return null
    return parsed.data
  } catch {
    return null
  }
}

function writeCache(data: CbrRates) {
  try {
    const payload: CachePayload = { savedAt: Date.now(), data }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  } catch {
    /* ignore quota / private mode */
  }
}

export function useCurrencyRates(): State {
  const [state, setState] = useState<State>(() => {
    const cached = readCache()
    return {
      data: cached,
      loading: !cached,
      error: null,
    }
  })

  useEffect(() => {
    if (state.data) return

    let cancelled = false

    fetchCbrRates()
      .then((data) => {
        if (cancelled) return
        writeCache(data)
        setState({ data, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Не удалось загрузить курсы'
        setState({ data: null, loading: false, error: message })
      })

    return () => {
      cancelled = true
    }
  }, [state.data])

  return state
}
