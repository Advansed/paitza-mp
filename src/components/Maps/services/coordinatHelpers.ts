import { Coordinates } from '../MapTypes';

// Расчет расстояния между координатами (формула гаверсинуса)
export const calculateDistance = (coord1: Coordinates, coord2: Coordinates): number => {
  const R = 6371; // Радиус Земли в км
  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLon = toRadians(coord2.long - coord1.long);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) * Math.cos(toRadians(coord2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const isValidCoordinates = (coords: Coordinates): boolean => {
  return coords.lat >= -90 && coords.lat <= 90 &&
         coords.long >= -180 && coords.long <= 180;
};

/** Точки маршрута: не (0,0) и в допустимом диапазоне. */
export const hasMapCoordinates = (coords?: Coordinates | null): boolean => {
  if (!coords) return false;
  if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.long)) return false;
  if (coords.lat === 0 && coords.long === 0) return false;
  return isValidCoordinates(coords);
};

// Форматирование расстояния
export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} м`;
  }
  return `${Math.round(distance)} км`;
};

// Примерный расчет времени в пути (средняя скорость грузовика 60 км/ч)
export const estimateTime = (distance: number): string => {
  const hours = distance / 60;
  if (hours < 1) {
    return `${Math.round(hours * 60)} мин`;
  }
  if (hours < 24) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}ч ${m}мин`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  return `${days}д ${remainingHours}ч`;
};

// Получение центра между двумя точками
export const getCenterPoint = (coord1: Coordinates, coord2: Coordinates): Coordinates => {
  return {
    lat: (coord1.lat + coord2.lat) / 2,
    long: (coord1.long + coord2.long) / 2
  };
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};