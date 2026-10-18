import { WorkStatus } from './types';
import { workFormatters } from './utils';
import { workStatusLabel } from './statusFlow';
import i18n, { intlLocale } from '../../i18n';

type Payable = { advance?: number | null; price?: number | null };
type BodySource = {
  body_type?: string;
  transport?: string;
  transport_type?: string | number | { id?: string | number; name?: string };
};
type FleetSource = { vehicles_total?: number; vehicles_busy?: number };
type RoutePoints = {
  route_distance?: number | null;
  address?: { lat?: number; lon?: number; city?: { lat?: number; lon?: number } } | null;
  destiny?: { lat?: number; lon?: number; city?: { lat?: number; lon?: number } } | null;
};

export type PaymentLevel = 'full' | 'partial' | 'none';

const PAYMENT_KEYS: Record<PaymentLevel, string> = {
  full: 'payEscrow',
  partial: 'payEscrowPart',
  none: 'payNone',
};

export function paymentLabel(level: PaymentLevel): string {
  return i18n.t(PAYMENT_KEYS[level], { ns: 'works' });
}

/** @deprecated use paymentLabel so the text follows the selected language */
export const PAYMENT_LABEL: Record<PaymentLevel, string> = {
  get full() {
    return paymentLabel('full');
  },
  get partial() {
    return paymentLabel('partial');
  },
  get none() {
    return paymentLabel('none');
  },
};

export function getPaymentLevel(work: Payable): PaymentLevel {
  const advance = Number(work.advance) || 0;
  const price = Number(work.price) || 0;
  if (advance > 0 && price > 0 && advance >= price) return 'full';
  if (advance > 0) return 'partial';
  return 'none';
}

export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function offersLabel(count: number): string {
  return i18n.t('offers', { ns: 'works', count });
}

export function formatQty(value: number): string {
  const n = Number(value) || 0;
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1).replace(/\.0$/, '').replace('.', ',');
}

export function parseDate(value: string): Date | null {
  if (!value) return null;
  let date = new Date(value);
  if (!isNaN(date.getTime())) return date;
  const m = String(value)
    .trim()
    .match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return null;
  date = new Date(
    Number(m[3]),
    Number(m[2]) - 1,
    Number(m[1]),
    Number(m[4] || 0),
    Number(m[5] || 0),
    Number(m[6] || 0)
  );
  return isNaN(date.getTime()) ? null : date;
}

export function shortDate(value: string): string {
  const date = parseDate(value);
  if (!date) return '';
  return date.toLocaleDateString(intlLocale(), { day: 'numeric', month: 'short' }).replace('.', '');
}

type PublishedSource = {
  publish_date?: string;
  published_at?: string;
  published?: string;
  createdAt?: string;
  created_at?: string;
  created?: string;
  updatedAt?: string;
};

export function resolvePublishedAt(source?: PublishedSource | null): string {
  if (!source) return '';
  const candidates = [
    source.publish_date,
    source.published_at,
    source.published,
    source.createdAt,
    source.created_at,
    source.created,
    source.updatedAt,
  ];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export function publishedDateTime(value: string): string {
  const date = parseDate(value);
  if (!date) return value?.trim() || '';
  const datePart = date.toLocaleDateString(intlLocale(), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString(intlLocale(), {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${datePart}, ${timePart}`;
}

export function timeAgo(value: string): string {
  const date = parseDate(value);
  if (!date) return '';
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return workFormatters.date(value);

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return i18n.t('justNow', { ns: 'works' });
  if (diffMins < 60) return i18n.t('minutesAgo', { ns: 'works', count: diffMins });
  if (diffHours < 24) return i18n.t('hoursAgo', { ns: 'works', count: diffHours });
  if (diffDays === 1) return i18n.t('yesterday', { ns: 'works' });
  if (diffDays < 7) return i18n.t('daysAgo', { ns: 'works', count: diffDays });
  return workFormatters.date(value);
}

export function looksLikeGuid(value: string): boolean {
  return /^[0-9a-f-]{16,}$/i.test(value.trim());
}

export function resolveBodyType(work: BodySource): string | null {
  if (work.body_type?.trim()) return work.body_type.trim();
  const tt = work.transport_type;
  if (tt && typeof tt === 'object' && !Array.isArray(tt) && tt.name?.trim()) {
    return tt.name.trim();
  }
  if (typeof tt === 'string' && tt.trim() && !looksLikeGuid(tt)) return tt.trim();
  if (work.transport && !looksLikeGuid(work.transport)) return work.transport;
  return null;
}

export function fleetSlots(work: FleetSource): { total: number; busy: number; free: number } | null {
  const total = Number(work.vehicles_total) || 0;
  if (total <= 1) return null;
  const busy = Math.min(total, Math.max(0, Number(work.vehicles_busy) || 0));
  return { total, busy, free: Math.max(0, total - busy) };
}

export function fleetHint(work: FleetSource): string | null {
  const slots = fleetSlots(work);
  if (!slots) return null;
  if (slots.free <= 0) return i18n.t('fleetBusy', { ns: 'works', busy: slots.busy, total: slots.total });
  return i18n.t('fleetNeed', { ns: 'works', busy: slots.busy, total: slots.total, free: slots.free });
}

export function straightLineDistanceKm(work: RoutePoints): number | null {
  const fromLat = Number(work.address?.lat || work.address?.city?.lat);
  const fromLon = Number(work.address?.lon || work.address?.city?.lon);
  const toLat = Number(work.destiny?.lat || work.destiny?.city?.lat);
  const toLon = Number(work.destiny?.lon || work.destiny?.city?.lon);
  if (
    !Number.isFinite(fromLat) ||
    !Number.isFinite(fromLon) ||
    !Number.isFinite(toLat) ||
    !Number.isFinite(toLon) ||
    (fromLat === 0 && fromLon === 0) ||
    (toLat === 0 && toLon === 0)
  ) {
    return null;
  }
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(toLat - fromLat);
  const dLon = toRad(toLon - fromLon);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.sin(dLon / 2) ** 2;
  const km = 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(a)));
  return km > 0 ? Math.round(km) : null;
}

export function chainDistanceKm(points: Array<{ lat: number; lon: number }>): number | null {
  let sum = 0;
  let any = false;
  for (let index = 1; index < points.length; index += 1) {
    const km = straightLineDistanceKm({
      address: points[index - 1],
      destiny: points[index],
    });
    if (km) {
      sum += km;
      any = true;
    }
  }
  return any ? sum : null;
}

export function routeDistanceKm(work: RoutePoints): number | null {
  const saved = Number(work.route_distance);
  if (Number.isFinite(saved) && saved > 0) return Math.round(saved);
  return straightLineDistanceKm(work);
}

export function feedStatusKind(status: WorkStatus): 'new' | 'bids' | 'work' | 'done' | 'alert' {
  if (status === WorkStatus.NEW) return 'new';
  if (status === WorkStatus.OFFERED) return 'bids';
  if (status === WorkStatus.COMPLETED) return 'done';
  if (status === WorkStatus.REJECTED) return 'alert';
  return 'work';
}

export function feedStatusLabel(status: WorkStatus): string {
  return workStatusLabel(status);
}

export function formatPhonePretty(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('7')) {
    return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 10) {
    return `+7 ${digits.slice(0, 3)} ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
  }
  return phone;
}

export function phoneHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return null;
  const normalized = digits.length === 10 ? `7${digits}` : digits;
  return `tel:+${normalized}`;
}
