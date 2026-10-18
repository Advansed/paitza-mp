import { mapLanguage } from '../../../i18n';

export const MAPS_CONFIG = {
  apiKey: (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || '',
  scriptUrl: 'https://maps.googleapis.com/maps/api/js',
  defaultCenter: { lat: 55.76, lng: 37.64 },
  defaultZoom: 10,
  overviewZoom: 4,
};

export const validateApiKey = (): boolean => {
  if (!MAPS_CONFIG.apiKey) {
    console.error('VITE_GOOGLE_MAPS_API_KEY не задан');
    return false;
  }
  return true;
};

export const generateApiUrl = (): string => {
  const url = new URL(MAPS_CONFIG.scriptUrl);
  url.searchParams.set('key', MAPS_CONFIG.apiKey);
  url.searchParams.set('language', mapLanguage());
  url.searchParams.set('libraries', 'places,geometry');
  return url.toString();
};
