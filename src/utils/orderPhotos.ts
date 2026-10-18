import { resolveImageSrc, resolveStoredImageSrc } from './fileUpload';

/** Фото кузова при прибытии на погрузку (sendImage / getPhotos) */
export const BODY_PHOTO_STATUS = 14;
/** Фото груза после погрузки */
export const LOAD_CARGO_PHOTO_STATUS = 16;
/** Фото пломбы после погрузки */
export const LOAD_SEAL_PHOTO_STATUS = 17;
export const MAX_BODY_PHOTOS = 5;
const LATEST_BATCH_WINDOW_MS = 90_000;

export function photoRaw(item: unknown): string {
  if (typeof item === 'string') return item;
  if (!item || typeof item !== 'object') return '';
  const rec = item as {
    url?: string;
    image?: string;
    path?: string;
    filePath?: string;
    filename?: string;
  };
  return rec.url || rec.image || rec.path || rec.filePath || rec.filename || '';
}

export function photoSrc(item: unknown): string {
  return resolveImageSrc(photoRaw(item));
}

export async function resolvePhotoBatch(items: unknown[]): Promise<string[]> {
  const urls = await Promise.all(items.map((item) => resolveStoredImageSrc(photoRaw(item))));
  return urls.filter(Boolean);
}

function photoTime(item: unknown): number {
  if (!item || typeof item !== 'object') return 0;
  const rec = item as Record<string, unknown>;
  const raw =
    rec.createdAt ?? rec.created ?? rec.date ?? rec.time ?? rec.timestamp ?? rec.updatedAt;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw < 1e12 ? raw * 1000 : raw;
  }
  if (typeof raw === 'string' && raw.trim()) {
    const parsed = Date.parse(raw);
    if (!Number.isNaN(parsed)) return parsed;
    const asNum = Number(raw);
    if (Number.isFinite(asNum) && asNum > 0) {
      return asNum < 1e12 ? asNum * 1000 : asNum;
    }
  }
  return 0;
}

/** Последний комплект снимков: свежая группа по времени или хвост списка. */
export function latestPhotoBatch(items: unknown[], max = MAX_BODY_PHOTOS): unknown[] {
  if (!Array.isArray(items) || items.length === 0) return [];
  const timed = items.map((item, index) => ({ item, index, t: photoTime(item) }));
  const hasTime = timed.some((row) => row.t > 0);
  if (!hasTime) {
    return items.slice(-max);
  }
  const maxT = Math.max(...timed.map((row) => row.t));
  return timed
    .filter((row) => row.t >= maxT - LATEST_BATCH_WINDOW_MS)
    .sort((a, b) => a.t - b.t || a.index - b.index)
    .slice(-max)
    .map((row) => row.item);
}

export async function toUploadablePhoto(src: string): Promise<string | File> {
  if (src.startsWith('data:') || src.startsWith('blob:')) return src;
  const res = await fetch(src);
  if (!res.ok) {
    throw new Error('Не удалось прочитать фото для отправки');
  }
  const blob = await res.blob();
  const ext = (blob.type.split('/')[1] || 'jpeg').replace('jpeg', 'jpg');
  return new File([blob], `body.${ext}`, { type: blob.type || 'image/jpeg' });
}

export async function prepareUploadablePhotos(srcs: string[]): Promise<Array<string | File>> {
  const uploadable: Array<string | File> = [];
  for (const src of srcs) {
    try {
      uploadable.push(await toUploadablePhoto(src));
    } catch {
      if (src.startsWith('data:') || src.startsWith('blob:')) {
        throw new Error('bad-local');
      }
    }
  }
  return uploadable;
}
