/**
 * Загрузка файлов.
 * - getUrl / uploadFileToMinIO — публичный бакет (legacy)
 * - uploadFotos / getFotos — старые приватные документы (паспорт)
 * - upload_url / signed_url — фото профиля, транспорта, СТС и чата (bucket kz-files).
 *   Nginx на /api2/ сам добавляет префикс /api, поэтому в клиенте его нет.
 */

import { useEffect, useState } from 'react';
import { URL as API_BASE } from '../Store/api';
import { loginGetters } from '../Store/loginStore';
import { logApiError, logApiRequest, logApiResponse } from './apiLogger';

const PROFILE_BUCKET = 'kz-files';

export interface UploadResult {
  filePath: string;
  /** Публичный URL (чат / getUrl) */
  url?: string;
  /** Signed URL для просмотра из приватного бакета (getSignUrl / getFotos) */
  signUrl?: string;
}

export interface UploadParams {
  cargo_id: string;
  recipient_id: string;
  token: string;
  type?: string;
  kind?: string;
}

/**
 * Конвертирует dataUrl (base64) в File
 */
export const dataUrlToFile                      = (dataUrl: string, filename = 'image.jpg'): File => {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  let mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  if (mime === 'image/jpg') mime = 'image/jpeg';
  const bstr = atob(arr[1] || '');
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  const extFromMime = (mime.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  const hasExt = /\.[^.]+$/.test(filename);
  const name = hasExt ? filename : `${filename}.${extFromMime}`;
  return new File([u8arr], name, { type: mime });
};

export const getImageExtension                  = (imageFile: string | File): string => {
  const normalizeExt = (ext: string) => {
    const value = ext.toLowerCase().replace('jpeg', 'jpg').replace('heic', 'jpg').replace('heif', 'jpg');
    return ['jpg', 'png', 'webp', 'gif'].includes(value) ? value : 'jpg';
  };

  if (typeof imageFile === 'string') {
    const mimeMatch = imageFile.split(',')[0]?.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    return normalizeExt(mime.split('/')[1] || 'jpg');
  }
  const fromName = imageFile.name.split('.').pop();
  if (fromName) return normalizeExt(fromName);
  const mime = imageFile.type || 'image/jpeg';
  return normalizeExt(mime.split('/')[1] || 'jpg');
};

const uniqueFilename                            = (original: string): string => {
  const ext = getImageExtension(original.includes('.') ? original : `file.${original}`);
  return `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
};

const MAX_IMAGE_EDGE = 1280;
const TARGET_UPLOAD_BYTES = 400 * 1024;
const HARD_MAX_UPLOAD_BYTES = 500 * 1024;
const UPLOAD_RETRIES = 2;
const UPLOAD_RETRY_MS = 700;

const dataUrlByteLength = (dataUrl: string): number => {
  const payload = dataUrl.split(',')[1] || '';
  return Math.ceil((payload.length * 3) / 4);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${Math.max(0, bytes)} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} МБ`;
};

export const getDataUrlSize = (dataUrl: string): number => dataUrlByteLength(dataUrl);

const canvasSupportsWebp = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
};

const OUTPUT_MIME = canvasSupportsWebp() ? 'image/webp' : 'image/jpeg';

const bitmapToCompressedDataUrl = (bitmap: ImageBitmap, maxEdge: number, quality: number): string => {
  const edge = Math.max(bitmap.width, bitmap.height) || 1;
  let width = bitmap.width;
  let height = bitmap.height;
  if (edge > maxEdge) {
    const ratio = maxEdge / edge;
    width = Math.max(1, Math.round(width * ratio));
    height = Math.max(1, Math.round(height * ratio));
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Не удалось обработать фото');
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas.toDataURL(OUTPUT_MIME, quality);
};

/** Ресайз + WebP (или JPEG, если браузер не умеет WebP), чтобы уложиться в лимит uploadFotos. */
export const compressImageDataUrl = async (dataUrl: string): Promise<string> => {
  if (!dataUrl.startsWith('data:image/')) return dataUrl;

  const blob = dataUrlToFile(dataUrl, 'source.jpg');
  const before = blob.size;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch {
    throw new Error('Не удалось обработать фото. Снимите кадр ещё раз в JPEG.');
  }

  try {
    let edge = Math.min(MAX_IMAGE_EDGE, Math.max(bitmap.width, bitmap.height));
    let quality = 0.72;
    let best = bitmapToCompressedDataUrl(bitmap, edge, quality);

    for (let i = 0; i < 6 && dataUrlByteLength(best) > TARGET_UPLOAD_BYTES; i++) {
      quality = Math.max(0.32, quality - 0.1);
      edge = Math.max(640, Math.round(edge * 0.8));
      best = bitmapToCompressedDataUrl(bitmap, edge, quality);
    }

    const after = dataUrlByteLength(best);

    if (after > HARD_MAX_UPLOAD_BYTES) {
      throw new Error('Не удалось загрузить фото: файл слишком большой.');
    }
    return best;
  } finally {
    bitmap.close();
  }
};

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const isTransientFetchError = (err: unknown): boolean => {
  const msg = err instanceof Error ? err.message : String(err);
  return /failed to fetch|load failed|networkerror|network request failed|the network connection was lost/i.test(msg);
};

export const uploadFileToMinIO                  = async (
  file: File | Blob,
  params: UploadParams
): Promise<UploadResult> => {
  const filename = file instanceof File ? file.name : uniqueFilename('image.jpg');
  const safeFilename = uniqueFilename(filename);

  const searchParams = new URLSearchParams({
    filename: safeFilename,
    cargo_id: params.cargo_id,
    token: params.token,
    recipient_id: params.recipient_id,
  });

  if (params.type) searchParams.set('type', params.type);
  if (params.kind) searchParams.set('kind', params.kind);

  logApiRequest('http', 'api/getUrl', {
    filename: safeFilename,
    cargo_id: params.cargo_id,
    recipient_id: params.recipient_id,
    type: params.type,
    kind: params.kind,
  });
  const res = await fetch(`${API_BASE}/api/getUrl?${searchParams}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    logApiError('http', 'api/getUrl', err);
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  logApiResponse('http', 'api/getUrl', data);
  const { uploadUrl, filePath, publicUrl: url } = data;

  if (!uploadUrl) {
    throw new Error('Сервер не вернул uploadUrl');
  }

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': '',
    },
  });

  if (!uploadRes.ok) {
    throw new Error(`Ошибка загрузки файла: HTTP ${uploadRes.status}`);
  }

  return { filePath, url };
};

/**
 * Универсальная загрузка документов (паспорт и др.) через multipart FormData.
 * @param imageFile - dataUrl или File
 * @param filename - ключ в S3, напр. {userId}/passport/passport_front.jpg
 */
export const uploadFileToDocs = async (
  imageFile: string | File,
  filename: string
): Promise<{ filePath: string; signUrl?: string }> => {
  const token = loginGetters.getToken();
  if (!token) {
    throw new Error('Нет токена авторизации');
  }

  const key = filename.startsWith('/') ? filename.slice(1) : filename;
  const source =
    typeof imageFile === 'string' ? imageFile : await fileToDataUrl(imageFile);
  const compressed = await compressImageDataUrl(source);
  const ext = getImageExtension(compressed);
  const fileName = (key.split('/').pop() || `image.${ext}`).replace(/\.[^.]+$/, `.${ext}`);
  const file = dataUrlToFile(compressed, fileName);
  const uploadKey = key.replace(/\.[^.]+$/, '') + `.${ext}`;

  if (file.size > HARD_MAX_UPLOAD_BYTES) {
    throw new Error('Не удалось загрузить фото: файл слишком большой.');
  }


  let lastError: unknown;
  let res: Response | undefined;

  for (let attempt = 0; attempt < UPLOAD_RETRIES; attempt++) {
    const form = new FormData();
    form.append('token', token);
    form.append('filename', uploadKey);
    form.append('file', file, file.name);

    try {
      logApiRequest('http', 'api/uploadFotos', {
        filename: uploadKey,
        size: file.size,
        type: file.type,
        attempt: attempt + 1,
      });
      res = await fetch(`${API_BASE}/api/uploadFotos`, {
        method: 'POST',
        body: form,
      });
      lastError = undefined;
      break;
    } catch (err) {
      lastError = err;
      logApiError('http', 'api/uploadFotos', err);
      if (attempt < UPLOAD_RETRIES - 1 && isTransientFetchError(err)) {
        await sleep(UPLOAD_RETRY_MS);
        continue;
      }
      if (isTransientFetchError(err)) {
        throw new Error('Не удалось загрузить фото. Файл слишком большой или нет связи с сервером.');
      }
      throw err;
    }
  }

  if (lastError) {
    if (isTransientFetchError(lastError)) {
      throw new Error('Не удалось загрузить фото. Файл слишком большой или нет связи с сервером.');
    }
    throw lastError;
  }
  if (!res) throw new Error('Не удалось загрузить фото');

  if (res.status === 413) {
    throw new Error('Не удалось загрузить фото: файл слишком большой.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  logApiResponse('http', 'api/uploadFotos', data);
  if (data?.success === false) {
    throw new Error(data.message || 'Ошибка загрузки файла');
  }

  const filePath = data.filePath || data.filename || uploadKey;
  return {
    filePath,
    signUrl: getFotosUrl(filePath, token),
  };
};

const storageSegment = (value: string): string =>
  String(value || '').trim().replace(/[/\\]/g, '') || 'unknown';

/**
 * Фото чата и заказа: ключ <userId>/chats/<cargoId>/<recipientId>/<file>.<ext>
 * Тот же поток, что у фото профиля: GET /upload_url, затем PUT на upload_url.
 */
export const uploadOrderPhoto = async (
  imageFile: string | File,
  params: { cargo_id: string; recipient_id: string }
): Promise<{ filePath: string; signUrl?: string }> => {
  const token = loginGetters.getToken();
  if (!token) {
    throw new Error('Нет токена авторизации');
  }
  const userId = loginGetters.getUserId();
  if (!userId) {
    throw new Error('Нет идентификатора пользователя');
  }

  const source =
    typeof imageFile === 'string' ? imageFile : await fileToDataUrl(imageFile);
  const compressed = await compressImageDataUrl(source);
  const ext = getImageExtension(compressed);
  const fileId = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const key = `${storageSegment(userId)}/chats/${storageSegment(params.cargo_id)}/${storageSegment(params.recipient_id)}/${fileId}.${ext}`;
  const file = dataUrlToFile(compressed, `image.${ext}`);
  const filePath = await putSignedObject(token, key, file);
  return { filePath };
};

/**
 * Фото транспорта: ключ <userId>/transports/<transportId>.<ext>
 * Тот же поток, что у фото профиля: GET /upload_url, затем PUT на upload_url.
 */
export const uploadTransportPhoto = async (
  imageFile: string | File,
  vehicleId?: string
): Promise<{ filePath: string; signUrl?: string }> => {
  const token = loginGetters.getToken();
  if (!token) {
    throw new Error('Нет токена авторизации');
  }
  const userId = loginGetters.getUserId();
  if (!userId) {
    throw new Error('Нет идентификатора пользователя');
  }
  const transportId = String(vehicleId || '').trim().replace(/[/\\]/g, '');
  if (!transportId) {
    throw new Error('Нет идентификатора транспорта');
  }

  const source =
    typeof imageFile === 'string' ? imageFile : await fileToDataUrl(imageFile);
  const compressed = await compressImageDataUrl(source);
  const ext = getImageExtension(compressed);
  const key = `${userId}/transports/${transportId}.${ext}`;
  const file = dataUrlToFile(compressed, `image.${ext}`);
  const filePath = await putSignedObject(token, key, file);
  return { filePath };
};

/**
 * Скан СТС: ключ <userId>/transports/<transportId>/sts.<ext>
 */
export const uploadTransportSts = async (
  imageFile: string | File,
  vehicleId?: string
): Promise<{ filePath: string; signUrl?: string }> => {
  const token = loginGetters.getToken();
  if (!token) {
    throw new Error('Нет токена авторизации');
  }
  const userId = loginGetters.getUserId();
  if (!userId) {
    throw new Error('Нет идентификатора пользователя');
  }
  const transportId = String(vehicleId || '').trim().replace(/[/\\]/g, '');
  if (!transportId) {
    throw new Error('Нет идентификатора транспорта');
  }

  const source =
    typeof imageFile === 'string' ? imageFile : await fileToDataUrl(imageFile);
  const compressed = await compressImageDataUrl(source);
  const ext = getImageExtension(compressed);
  const key = `${userId}/transports/${transportId}/sts.${ext}`;
  const file = dataUrlToFile(compressed, `sts.${ext}`);
  const filePath = await putSignedObject(token, key, file);
  return { filePath };
};

const normalizeStorageKey = (filename: string): string =>
  filename.startsWith('/') ? filename.slice(1) : filename;

const isSignedObjectKey = (pathOrUrl: string): boolean => {
  const key = normalizeStorageKey(pathOrUrl);
  return (
    key.startsWith('profile/') ||
    key.includes('/transports/') ||
    key.includes('/chats/') ||
    /^[^/]+\/image\.[a-z0-9]+$/i.test(key)
  );
};

const profileObjectQuery = (token: string, key: string): URLSearchParams =>
  new URLSearchParams({
    token,
    bucket: PROFILE_BUCKET,
    key: normalizeStorageKey(key),
  });

const pickHttpUrl = (data: Record<string, unknown>): string => {
  for (const field of ['signed_url', 'url', 'download_url', 'read_url', 'upload_url']) {
    const value = data[field];
    if (typeof value === 'string' && /^https?:\/\//i.test(value)) return value;
  }
  return '';
};

const signedReadInflight = new Map<string, Promise<string>>();

const putSignedObject = async (token: string, key: string, file: File): Promise<string> => {
  if (file.size > HARD_MAX_UPLOAD_BYTES) {
    throw new Error('Не удалось загрузить фото: файл слишком большой.');
  }

  const searchParams = profileObjectQuery(token, key);
  logApiRequest('http', 'upload_url', { bucket: PROFILE_BUCKET, key });
  const res = await fetch(`${API_BASE}/upload_url?${searchParams}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    logApiError('http', 'upload_url', err);
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  logApiResponse('http', 'upload_url', data);
  const filePath = (data.filePath as string | undefined) || key;
  const uploadUrl = data.upload_url as string | undefined;

  if (!uploadUrl) {
    throw new Error('Сервер не вернул upload_url');
  }

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': '',
    },
  });

  if (!uploadRes.ok) {
    throw new Error(`Ошибка загрузки файла: HTTP ${uploadRes.status}`);
  }

  return filePath;
};

/** Временная ссылка на чтение ключа профиля: GET /signed_url. */
export const fetchProfileReadUrl = (filename: string, token?: string): Promise<string> => {
  const authToken = token || loginGetters.getToken();
  const key = normalizeStorageKey(filename);
  if (!authToken || !key) return Promise.resolve('');

  const cacheKey = `${authToken}:${key}`;
  const pending = signedReadInflight.get(cacheKey);
  if (pending) return pending;

  const request = (async () => {
    const searchParams = profileObjectQuery(authToken, key);
    logApiRequest('http', 'signed_url', { bucket: PROFILE_BUCKET, key });
    const res = await fetch(`${API_BASE}/signed_url?${searchParams}`);
    const data = await res.json().catch(() => ({}));
    logApiResponse('http', 'signed_url', data);

    if (!res.ok) {
      logApiError('http', 'signed_url', data);
      throw new Error(data.message || `HTTP ${res.status}`);
    }

    const url = pickHttpUrl(data as Record<string, unknown>);
    if (!url) {
      throw new Error('Сервер не вернул ссылку на чтение');
    }
    return url;
  })().finally(() => {
    signedReadInflight.delete(cacheKey);
  });

  signedReadInflight.set(cacheKey, request);
  return request;
};

/**
 * Фото профиля: ключ <userId>/image.<ext>
 * GET /upload_url (подпись на запись), затем PUT файла на upload_url.
 * В image сохраняется ключ, не публичный URL.
 */
export const uploadProfilePhoto = async (
  imageFile: string | File
): Promise<{ filePath: string; signUrl?: string }> => {
  const token = loginGetters.getToken();
  if (!token) {
    throw new Error('Нет токена авторизации');
  }
  const userId = loginGetters.getUserId();
  if (!userId) {
    throw new Error('Нет идентификатора пользователя');
  }

  const source =
    typeof imageFile === 'string' ? imageFile : await fileToDataUrl(imageFile);
  const compressed = await compressImageDataUrl(source);
  const ext = getImageExtension(compressed);
  const key = `${userId}/image.${ext}`;
  const file = dataUrlToFile(compressed, `image.${ext}`);
  const filePath = await putSignedObject(token, key, file);
  return { filePath };
};

/**
 * URL для просмотра приватного файла через getFotos.
 */
export const getFotosUrl = (filename: string, token?: string): string => {
  const authToken = token || loginGetters.getToken();
  if (!authToken || !filename) return '';

  const key = filename.startsWith('/') ? filename.slice(1) : filename;
  return `${API_BASE}/api/getFotos?token=${encodeURIComponent(authToken)}&filename=${encodeURIComponent(key)}`;
};

/** http/data/blob как есть. Ключи профиля, транспорта и чата — через GET /signed_url. */
export const resolveStoredImageSrc = async (pathOrUrl?: string | null): Promise<string> => {
  if (!pathOrUrl) return '';
  if (
    /^https?:\/\//i.test(pathOrUrl) ||
    pathOrUrl.startsWith('data:') ||
    pathOrUrl.startsWith('blob:')
  ) {
    return pathOrUrl;
  }
  if (isSignedObjectKey(pathOrUrl)) {
    return fetchProfileReadUrl(pathOrUrl);
  }
  return getFotosUrl(normalizeStorageKey(pathOrUrl));
};

/** Публичный URL / data / blob — как есть. Ключи профиля, транспорта и чата читаются через signed_url. */
export const resolveImageSrc = (pathOrUrl?: string | null): string => {
  if (!pathOrUrl) return '';
  if (
    /^https?:\/\//i.test(pathOrUrl) ||
    pathOrUrl.startsWith('data:') ||
    pathOrUrl.startsWith('blob:')
  ) {
    return pathOrUrl;
  }
  if (isSignedObjectKey(pathOrUrl)) return '';
  return getFotosUrl(normalizeStorageKey(pathOrUrl));
};

/** Ключи профиля и транспорта подменяются временной ссылкой с GET /signed_url. */
export const useResolvedImageSrc = (pathOrUrl?: string | null): string => {
  const syncSrc = !pathOrUrl || isSignedObjectKey(pathOrUrl) ? '' : resolveImageSrc(pathOrUrl);
  const [src, setSrc] = useState(syncSrc);

  useEffect(() => {
    if (!pathOrUrl) {
      setSrc('');
      return;
    }
    if (!isSignedObjectKey(pathOrUrl)) {
      setSrc(resolveImageSrc(pathOrUrl));
      return;
    }

    let cancelled = false;
    fetchProfileReadUrl(pathOrUrl)
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setSrc('');
      });

    return () => {
      cancelled = true;
    };
  }, [pathOrUrl]);

  return src;
};

/**
 * Проверка / распознавание фото паспорта (лицевая сторона и др.).
 * POST /api/check_passport_photo { token, filename }
 */
export const checkPassportPhoto = async (
  filename: string
): Promise<Record<string, any>> => {
  const token = loginGetters.getToken();
  if (!token) {
    throw new Error('Нет токена авторизации');
  }
  if (!filename) {
    throw new Error('Нет пути к файлу');
  }

  const key = filename.startsWith('/') ? filename.slice(1) : filename;

  logApiRequest('http', 'api/check_passport_photo', { filename: key });
  const res = await fetch(`${API_BASE}/api/check_passport_photo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, filename: key }),
  });

  const data = await res.json().catch(() => ({}));
  logApiResponse('http', 'api/check_passport_photo', data);

  if (!res.ok || data?.success === false) {
    logApiError('http', 'api/check_passport_photo', data);
    throw new Error(data.message || `Ошибка проверки фото: HTTP ${res.status}`);
  }

  return data;
};

export const sendImageViaMinIO                  = async (
  dataUrl: string,
  params: { token: string; recipient: string; cargo: string }
): Promise<{ success: boolean; message?: string }> => {
  const { api } = await import('../Store/api');
  const { filePath } = await uploadOrderPhoto(dataUrl, {
    cargo_id: params.cargo,
    recipient_id: params.recipient,
  });
  const result = await api('api/sendimage', {
    ...params,
    image: filePath,
  });
  if (result?.success === false) {
    throw new Error(result.message || 'Ошибка отправки изображения');
  }
  return result;
};
