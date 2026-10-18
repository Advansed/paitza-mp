import { hasMapCoordinates } from './services/coordinatHelpers';

export type FeedRoutePoint = {
  city: string;
  lat: number;
  lon: number;
};

export type FeedRoute = {
  id: string;
  name: string;
  status: string;
  progress: number;
  from: FeedRoutePoint;
  via: FeedRoutePoint[];
  to: FeedRoutePoint;
  vehicle: {
    plate: string;
    lat: number;
    lon: number;
  };
};

type OrderLike = {
  guid?: string;
  cargo?: string;
  name?: string;
  status?: string;
  transport?: string;
  address?: { city?: { city?: string }; lat?: number; lon?: number };
  destiny?: { city?: { city?: string }; lat?: number; lon?: number };
  route?: Array<{
    point_type?: string;
    sequence_num?: number;
    city?: string | { city?: string };
    lat?: number;
    lon?: number;
  }>;
};

function along(from: FeedRoutePoint, to: FeedRoutePoint, t: number): { lat: number; lon: number } {
  const p = Math.min(1, Math.max(0, t));
  return {
    lat: from.lat + (to.lat - from.lat) * p,
    lon: from.lon + (to.lon - from.lon) * p,
  };
}

function cityName(addr?: OrderLike['address']): string {
  return addr?.city?.city?.trim() || 'Точка';
}

function pointFrom(addr: NonNullable<OrderLike['address']>): FeedRoutePoint {
  return { city: cityName(addr), lat: addr.lat, lon: addr.lon };
}

function mockProgress(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return 0.15 + (h % 70) / 100;
}

/** Маршруты только из заказов ленты, у которых заданы координаты погрузки и выгрузки. */
export function ordersToFeedRoutes(orders: OrderLike[]): FeedRoute[] {
  const routes: FeedRoute[] = [];
  for (const order of orders) {
    const from = order.address;
    const to = order.destiny;
    if (!from || !to) continue;
    if (!hasMapCoordinates({ lat: from.lat, long: from.lon })) continue;
    if (!hasMapCoordinates({ lat: to.lat, long: to.lon })) continue;
    const id = order.guid || order.cargo || '';
    if (!id) continue;
    const t = mockProgress(id);
    const start = pointFrom(from);
    const end = pointFrom(to);
    const via = (order.route || [])
      .filter((point) => point.point_type === 'waypoint')
      .slice()
      .sort((a, b) => (Number(a.sequence_num) || 0) - (Number(b.sequence_num) || 0))
      .map((point) => ({
        city: typeof point.city === 'string' ? point.city : point.city?.city || 'Точка',
        lat: Number(point.lat) || 0,
        lon: Number(point.lon) || 0,
      }))
      .filter((point) => hasMapCoordinates({ lat: point.lat, long: point.lon }));
    routes.push({
      id,
      name: order.name?.trim() || 'Заказ',
      status: String(order.status || ''),
      progress: t,
      from: start,
      via,
      to: end,
      vehicle: { plate: order.transport?.trim() || 'ТС', ...along(start, end, t) },
    });
  }
  return routes;
}
