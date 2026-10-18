const SENSITIVE_KEYS = new Set([
  'token',
  'password',
  'pass',
  'secret',
  'authorization',
  'auth',
  'sms',
  'code',
])

function redactValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEYS.has(key.toLowerCase())) return '[redacted]'
  return sanitize(value)
}

export function sanitize(value: unknown, depth = 0): unknown {
  if (value == null || typeof value !== 'object') return value
  if (depth > 4) return '[depth-limit]'
  if (Array.isArray(value)) {
    if (value.length > 20) {
      return [...value.slice(0, 20).map((item) => sanitize(item, depth + 1)), `…+${value.length - 20}`]
    }
    return value.map((item) => sanitize(item, depth + 1))
  }
  const out: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    out[key] = redactValue(key, entry)
  }
  return out
}

function debugApi(): boolean {
  if (import.meta.env.DEV) return true
  try {
    return localStorage.getItem('gvrs.debugApi') === '1'
  } catch {
    return false
  }
}

export function logApiRequest(channel: string, event: string, params?: unknown) {
  if (!debugApi()) return
  console.info(`[API →] ${channel}:${event}`, {
    params: params === undefined ? null : sanitize(params),
  })
}

export function logApiResponse(channel: string, event: string, response?: unknown) {
  if (!debugApi()) return
  console.info(`[API ←] ${channel}:${event}`, {
    response: response === undefined ? null : sanitize(response),
  })
}

export function logApiError(channel: string, event: string, error?: unknown) {
  console.error(`[API ✕] ${channel}:${event}`, { error })
}
