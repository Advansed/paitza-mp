const PAYLER_URL = (import.meta.env.VITE_PAYLER_URL || 'https://sandbox.payler.com').replace(/\/$/, '')
const PAYLER_KEY = import.meta.env.VITE_PAYLER_KEY || ''

type StartSessionResponse = {
  session_id?: string
  sessionId?: string
  error?: { message?: string }
  message?: string
}

export async function startPaylerPayment(params: {
  amount: number
  orderId: string
  email: string
  successUrl: string
  declineUrl: string
  lang?: string
}): Promise<string> {
  if (!PAYLER_KEY) throw new Error('Payler key is not configured')

  const body = new URLSearchParams({
    key: PAYLER_KEY,
    type: 'OneStep',
    order_id: params.orderId,
    amount: String(Math.round(params.amount * 100)),
    currency: 'KGS',
    email: params.email,
    return_url_success: params.successUrl,
    return_url_decline: params.declineUrl,
    lang: params.lang === 'en' ? 'en' : 'ru',
  })

  const response = await fetch('/payler/gapi/StartSession', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const data = (await response.json().catch(() => null)) as StartSessionResponse | null
  const sessionId = data?.session_id || data?.sessionId
  if (!response.ok || !sessionId) {
    throw new Error(data?.error?.message || data?.message || 'StartSession failed')
  }
  return `${PAYLER_URL}/gapi/Pay?session_id=${encodeURIComponent(sessionId)}`
}
