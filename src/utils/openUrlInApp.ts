import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

/**
 * На нативной сборке https-страницы оплаты открываются во встроенном браузере
 * (Chrome Custom Tabs на Android, SFSafariViewController на iOS), а не во внешнем Chrome/Safari.
 * В dev/PWA — обычный window.open.
 * Кастомные схемы (sbp:// и т.д.) нельзя открыть в Custom Tabs — делегируем системе как раньше.
 */
export async function openUrlInApp(url: string): Promise<void> {
  const u = url?.trim();
  if (!u) return;

  if (!Capacitor.isNativePlatform()) {
    window.open(u, '_blank', 'noopener,noreferrer');
    return;
  }

  const lower = u.toLowerCase();
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    await Browser.open({ url: u });
    return;
  }

  window.open(u, '_blank', 'noopener,noreferrer');
}
