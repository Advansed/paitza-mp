/** Канал доставки кода подтверждения (check_registration / check_phone) */
export type OtpTransport = 'sms' | 'telegram'

export const OTP_TRANSPORT_DEFAULT: OtpTransport = 'sms'

export function normalizeOtpTransport(value: unknown): OtpTransport {
  return value === 'telegram' ? 'telegram' : 'sms'
}
