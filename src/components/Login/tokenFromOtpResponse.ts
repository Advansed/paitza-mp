/** Токен из ответа check_sms: `data` — строка или `{ token: string }` */
export function tokenFromCheckSmsResponse(data: unknown): string {
  if (data == null) return '';
  if (typeof data === 'string') return data;
  if (typeof data === 'object' && 'token' in data) {
    const t = (data as { token?: unknown }).token;
    return typeof t === 'string' ? t : '';
  }
  return '';
}
