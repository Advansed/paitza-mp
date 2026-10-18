import { useEffect, useState } from 'react';
import { useSocket } from '../../../Store/useSocket';
import { useToken } from '../../../Store/loginStore';

export type LicAccountData = Record<string, unknown>;

type GetLicResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

function unwrapLic(raw: unknown): LicAccountData | null {
  if (!raw || typeof raw !== 'object') return null;
  const payload = raw as GetLicResponse & LicAccountData;
  const data = 'data' in payload ? payload.data : raw;
  if (!data) return null;
  if (Array.isArray(data)) {
    const first = data[0];
    return first && typeof first === 'object' ? (first as LicAccountData) : null;
  }
  if (typeof data === 'object') return data as LicAccountData;
  return null;
}

export function useLicAccount(
  userId: string | null,
  extra?: { guid?: string; cargo?: string }
) {
  const { emit, once } = useSocket();
  const token = useToken();
  const [data, setData] = useState<LicAccountData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !token) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setData(null);

    const timer = window.setTimeout(() => {
      if (cancelled) return;
      setIsLoading(false);
      setError('Не удалось загрузить лицевой счёт');
    }, 10000);

    once('get_lic', (response: GetLicResponse) => {
      window.clearTimeout(timer);
      if (cancelled) return;
      if (response?.success === false) {
        setData(null);
        setError(response.message || 'Не удалось загрузить лицевой счёт');
        setIsLoading(false);
        return;
      }
      setData(unwrapLic(response));
      setError(null);
      setIsLoading(false);
    });

    emit('get_lic', {
      token,
      id: userId,
      guid: extra?.guid,
      cargo: extra?.cargo,
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [userId, token, extra?.guid, extra?.cargo, emit, once]);

  return { data, isLoading, error };
}
