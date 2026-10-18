import { Coordinates, CargoInfo, WorkInfo, GoogleMapInstance } from '../MapTypes';
import type { FeedRoute } from '../mockFeedRoutes';
import { MAPS_CONFIG, generateApiUrl, validateApiKey } from './MapConfig';
import styles from '../Maps.module.css';

declare global {
  interface Window {
    google: any;
  }
}

type LatLng = { lat: number; lng: number };

const ROUTE_COLORS = ['#3b82f6', '#16a34a', '#dc2626', '#7c3aed', '#ea580c', '#0891b2'];
const SCRIPT_ID = 'google-maps-js';

let loadPromise: Promise<void> | null = null;

export function loadGoogleMapsAPI(): Promise<void> {
  if (window.google?.maps?.Map) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    if (!validateApiKey()) {
      reject(new Error('API ключ Google Maps не задан'));
      return;
    }
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Не удалось загрузить Google Maps API')),
        { once: true }
      );
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = generateApiUrl();
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Не удалось загрузить Google Maps API'));
    document.head.appendChild(script);
  });
  return loadPromise;
}

export function setExecutorMarker(instance: GoogleMapInstance, point: LatLng | null) {
  if (!point || !instance.map || !window.google?.maps) {
    instance.executorMarker?.setMap(null);
    instance.executorMarker = null;
    return;
  }
  if (instance.executorMarker) {
    instance.executorMarker.setPosition(point);
    if (!instance.executorMarker.getMap()) instance.executorMarker.setMap(instance.map);
    return;
  }
  instance.executorMarker = new window.google.maps.Marker({
    position: point,
    map: instance.map,
    zIndex: 20,
    title: 'Исполнитель',
    icon: circleIcon('#1d4ed8', 11),
  });
}

function circleIcon(color: string, scale = 8) {
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    scale,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#fff',
    strokeWeight: 2,
  };
}

function alongLine(points: LatLng[], progress: number): LatLng {
  if (!points.length) return MAPS_CONFIG.defaultCenter;
  const t = Math.min(1, Math.max(0, progress));
  const idx = Math.min(points.length - 1, Math.round((points.length - 1) * t));
  return points[idx];
}

function applyLookAt(instance: GoogleMapInstance) {
  const g = window.google?.maps;
  if (!g || !instance.map) return;
  g.event.trigger(instance.map, 'resize');
  if (instance.bounds) {
    instance.map.fitBounds(instance.bounds, 48);
    return;
  }
  const points = (instance.lookAtPoints || []).filter(
    (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)
  );
  if (!points.length) return;
  if (points.length === 1) {
    instance.map.setCenter(points[0]);
    instance.map.setZoom(instance.lookAtZoom ?? MAPS_CONFIG.defaultZoom);
    return;
  }
  const bounds = new g.LatLngBounds();
  points.forEach((p) => bounds.extend(p));
  instance.bounds = bounds;
  instance.map.fitBounds(bounds, 48);
}

function lookAt(instance: GoogleMapInstance, points: LatLng[], zoom?: number) {
  instance.lookAtPoints = points;
  instance.lookAtZoom = points.length === 1 ? zoom : undefined;
  instance.bounds = undefined;
  applyLookAt(instance);
}

function latLngOf(point: { lat: () => number; lng: () => number } | LatLng): LatLng {
  if (typeof (point as { lat?: unknown }).lat === 'function') {
    const loc = point as { lat: () => number; lng: () => number };
    return { lat: loc.lat(), lng: loc.lng() };
  }
  return point as LatLng;
}

function pathFromDirections(result: {
  routes?: Array<{
    overview_path?: Array<{ lat: () => number; lng: () => number }>;
    overview_polyline?: string | { points?: string };
    legs?: Array<{ steps?: Array<{ path?: Array<{ lat: () => number; lng: () => number }> }> }>;
  }>;
}): LatLng[] | null {
  const route = result.routes?.[0];
  if (!route) return null;

  const detailed: LatLng[] = [];
  for (const leg of route.legs || []) {
    for (const step of leg.steps || []) {
      for (const point of step.path || []) {
        detailed.push(latLngOf(point));
      }
    }
  }
  if (detailed.length >= 2) return detailed;

  if (route.overview_path?.length) {
    const overview = route.overview_path.map(latLngOf);
    if (overview.length >= 2) return overview;
  }

  const encoded =
    typeof route.overview_polyline === 'string'
      ? route.overview_polyline
      : route.overview_polyline?.points;
  if (encoded && window.google.maps.geometry?.encoding?.decodePath) {
    const decoded = window.google.maps.geometry.encoding.decodePath(encoded).map(latLngOf);
    if (decoded.length >= 2) return decoded;
  }
  return null;
}

const routeCache = new Map<string, any>();

function routeCacheKey(start: LatLng, end: LatLng, via: LatLng[] = []): string {
  const stops = via.map((point) => `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`).join('|');
  return `${start.lat.toFixed(5)},${start.lng.toFixed(5)}-${stops}-${end.lat.toFixed(5)},${end.lng.toFixed(5)}`;
}

function fetchDirectionsResult(start: LatLng, end: LatLng, via: LatLng[] = []): Promise<any | null> {
  const key = routeCacheKey(start, end, via);
  const cached = routeCache.get(key);
  if (cached) return Promise.resolve(cached);
  if (!window.google?.maps?.DirectionsService) return Promise.resolve(null);

  const g = window.google.maps;
  const svc = new g.DirectionsService();
  const request: Record<string, unknown> = {
    origin: new g.LatLng(start.lat, start.lng),
    destination: new g.LatLng(end.lat, end.lng),
    travelMode: g.TravelMode?.DRIVING || 'DRIVING',
  };
  if (via.length > 0) {
    request.waypoints = via.map((point) => ({
      location: new g.LatLng(point.lat, point.lng),
      stopover: true,
    }));
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: any | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      if (value) routeCache.set(key, value);
      resolve(value);
    };
    const timer = window.setTimeout(() => {
      console.warn('Google Directions timeout');
      finish(null);
    }, 8000);

    try {
      svc.route(request, (result: any, status: string) => {
        if (status === 'OK' && result) finish(result);
        else {
          console.warn('Google Directions status', status);
          finish(null);
        }
      });
    } catch (error) {
      console.warn('Google Directions API failed', error);
      finish(null);
    }
  });
}

function straightMeters(from: LatLng, to: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLon = toRad(to.lng - from.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function distanceMetersFromDirections(result: {
  routes?: Array<{ legs?: Array<{ distance?: { value?: number } }> }>;
}): number | null {
  const legs = result.routes?.[0]?.legs || [];
  const meters = legs.reduce((sum, leg) => sum + (Number(leg.distance?.value) || 0), 0);
  return meters > 0 ? meters : null;
}

function distanceKmFromDirections(result: {
  routes?: Array<{ legs?: Array<{ distance?: { value?: number } }> }>;
}): number | null {
  const meters = distanceMetersFromDirections(result);
  if (meters == null) return null;
  return Math.round(meters / 1000);
}

export async function fetchDrivingDistanceKm(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
  via: Array<{ lat: number; lon: number }> = []
): Promise<number | null> {
  const start = { lat: Number(from.lat), lng: Number(from.lon) };
  const end = { lat: Number(to.lat), lng: Number(to.lon) };
  const stops = via
    .map((point) => ({ lat: Number(point.lat), lng: Number(point.lon) }))
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng) && !(point.lat === 0 && point.lng === 0));
  if (
    !Number.isFinite(start.lat) ||
    !Number.isFinite(start.lng) ||
    !Number.isFinite(end.lat) ||
    !Number.isFinite(end.lng)
  ) {
    return null;
  }
  try {
    await loadGoogleMapsAPI();
  } catch {
    return null;
  }
  const points = [start, ...stops, end];
  let meters = 0;
  for (let index = 1; index < points.length; index += 1) {
    const result = await fetchDirectionsResult(points[index - 1], points[index]);
    const legMeters = result ? distanceMetersFromDirections(result) : null;
    meters += legMeters ?? straightMeters(points[index - 1], points[index]);
  }
  return meters > 0 ? Math.round(meters / 1000) : null;
}

function drawLine(
  instance: GoogleMapInstance,
  points: LatLng[],
  color: string
) {
  const polyline = new window.google.maps.Polyline({
    path: points,
    geodesic: true,
    strokeColor: color,
    strokeOpacity: 0.95,
    strokeWeight: 5,
    zIndex: 2,
    map: instance.map,
  });
  instance.objects.push(polyline);
  return polyline;
}

function drawDirections(
  instance: GoogleMapInstance,
  result: any,
  color: string
) {
  const renderer = new window.google.maps.DirectionsRenderer({
    map: instance.map,
    suppressMarkers: true,
    preserveViewport: true,
    polylineOptions: {
      strokeColor: color,
      strokeOpacity: 1,
      strokeWeight: 6,
      zIndex: 3,
    },
  });
  renderer.setDirections(result);
  instance.objects.push(renderer);
  return renderer;
}

function makeCargoLabel(map: any, position: LatLng, text: string, onClick?: () => void) {
  const OverlayView = window.google.maps.OverlayView;
  class CargoLabel extends OverlayView {
    div: HTMLDivElement | null = null;
    pos = position;

    onAdd() {
      const div = document.createElement('div');
      div.className = styles.cargoLabel;
      div.textContent = text;
      div.addEventListener('click', (event) => {
        event.stopPropagation();
        onClick?.();
      });
      this.div = div;
      this.getPanes()?.overlayMouseTarget.appendChild(div);
    }

    draw() {
      if (!this.div) return;
      const projection = this.getProjection();
      if (!projection) return;
      const point = projection.fromLatLngToDivPixel(
        new window.google.maps.LatLng(this.pos.lat, this.pos.lng)
      );
      if (!point) return;
      this.div.style.left = `${point.x}px`;
      this.div.style.top = `${point.y}px`;
    }

    onRemove() {
      this.div?.remove();
      this.div = null;
    }
  }

  const overlay = new CargoLabel();
  overlay.setMap(map);
  return overlay;
}

export async function initializeMap(
  container: HTMLElement,
  options?: { lat?: number; lon?: number; zoom?: number }
): Promise<GoogleMapInstance> {
  await loadGoogleMapsAPI();
  const g = window.google.maps;
  const center = {
    lat: options?.lat ?? MAPS_CONFIG.defaultCenter.lat,
    lng: options?.lon ?? MAPS_CONFIG.defaultCenter.lng,
  };
  const map = new g.Map(container, {
    center,
    zoom: options?.zoom ?? MAPS_CONFIG.defaultZoom,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  });

  const instance: GoogleMapInstance = {
    map,
    objects: [],
    lookAtPoints: [center],
    lookAtZoom: options?.zoom ?? MAPS_CONFIG.defaultZoom,
    destroy: () => {
      instance.executorMarker?.setMap(null);
      instance.executorMarker = null;
      instance.objects.forEach((obj) => obj.setMap?.(null));
      instance.objects = [];
      instance.map = null;
    },
    resize: () => applyLookAt(instance),
  };
  return instance;
}

export async function createRoute(
  instance: GoogleMapInstance,
  start: Coordinates,
  end: Coordinates,
  _info?: CargoInfo | WorkInfo,
  via: Coordinates[] = []
) {
  instance.objects.forEach((obj) => obj.setMap?.(null));
  instance.objects = [];

  const from = { lat: Number(start.lat), lng: Number(start.long) };
  const to = { lat: Number(end.lat), lng: Number(end.long) };
  const stops = via
    .map((point) => ({ lat: Number(point.lat), lng: Number(point.long) }))
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng) && !(point.lat === 0 && point.lng === 0));
  instance.objects.push(
    new window.google.maps.Marker({
      position: from,
      map: instance.map,
      icon: circleIcon('#dc2626'),
    }),
    ...stops.map(
      (point) =>
        new window.google.maps.Marker({
          position: point,
          map: instance.map,
          icon: circleIcon('#2563eb', 6),
        })
    ),
    new window.google.maps.Marker({
      position: to,
      map: instance.map,
      icon: circleIcon('#16a34a'),
    })
  );
  const points = [from, ...stops, to];
  lookAt(instance, points);

  const drawn: LatLng[] = [...points];
  for (let index = 1; index < points.length; index += 1) {
    const result = await fetchDirectionsResult(points[index - 1], points[index]);
    if (!instance.map) continue;
    if (!result) {
      drawLine(instance, [points[index - 1], points[index]], '#93c5fd');
      continue;
    }
    drawDirections(instance, result, '#2563eb');
    const path = pathFromDirections(result);
    if (path && path.length >= 2) drawn.push(...path);
  }
  lookAt(instance, drawn);
}

export async function plotFeedRoutes(
  instance: GoogleMapInstance,
  routes: FeedRoute[],
  onRouteClick?: (routeId: string) => void
) {
  instance.objects.forEach((obj) => obj.setMap?.(null));
  instance.objects = [];

  if (routes.length === 0) {
    instance.map.setCenter(MAPS_CONFIG.defaultCenter);
    instance.map.setZoom(MAPS_CONFIG.overviewZoom);
    instance.lookAtPoints = [MAPS_CONFIG.defaultCenter];
    instance.lookAtZoom = MAPS_CONFIG.overviewZoom;
    instance.bounds = undefined;
    return;
  }

  const allPoints: LatLng[] = [];
  const pending: Array<{
    from: LatLng;
    to: LatLng;
    color: string;
    placeholder: any;
    chain: LatLng[];
  }> = [];

  for (let index = 0; index < routes.length; index += 1) {
    const item = routes[index];
    const color = ROUTE_COLORS[index % ROUTE_COLORS.length];
    const from = { lat: item.from.lat, lng: item.from.lon };
    const to = { lat: item.to.lat, lng: item.to.lon };
    const via = (item.via || [])
      .map((point) => ({ lat: point.lat, lng: point.lon }))
      .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng) && !(point.lat === 0 && point.lng === 0));
    const chain = [from, ...via, to];
    allPoints.push(...chain);
    instance.objects.push(
      new window.google.maps.Marker({
        position: from,
        map: instance.map,
        icon: circleIcon('#dc2626'),
      }),
      new window.google.maps.Marker({
        position: to,
        map: instance.map,
        icon: circleIcon('#16a34a'),
      })
    );
    const placeholder = drawLine(instance, chain, color);
    pending.push({ from, to, color, placeholder, chain });
    const caption = item.name.length > 28 ? `${item.name.slice(0, 27)}…` : item.name;
    instance.objects.push(
      makeCargoLabel(
        instance.map,
        alongLine([from, to], item.progress ?? 0.5),
        caption,
        onRouteClick ? () => onRouteClick(item.id) : undefined
      )
    );
  }
  lookAt(instance, allPoints);

  await Promise.all(
    pending.map(async ({ color, placeholder, chain }) => {
      if (!instance.map) return;
      placeholder.setMap(null);
      instance.objects = instance.objects.filter((obj) => obj !== placeholder);
      for (let index = 1; index < chain.length; index += 1) {
        const result = await fetchDirectionsResult(chain[index - 1], chain[index]);
        if (!instance.map) return;
        if (!result) {
          drawLine(instance, [chain[index - 1], chain[index]], color);
          continue;
        }
        drawDirections(instance, result, color);
        const path = pathFromDirections(result);
        if (path) allPoints.push(...path);
      }
    })
  );
  lookAt(instance, allPoints);
}

export function plotPoint(
  instance: GoogleMapInstance,
  lat: number,
  lon: number,
  _title?: string,
  options?: { fly?: boolean }
) {
  instance.objects.forEach((obj) => obj.setMap?.(null));
  instance.objects = [];
  const position = { lat, lng: lon };
  instance.objects.push(
    new window.google.maps.Marker({
      position,
      map: instance.map,
      icon: circleIcon('#dc2626'),
    })
  );
  if (options?.fly !== false) {
    lookAt(instance, [position], 15);
  } else {
    instance.lookAtPoints = [position];
    instance.lookAtZoom = 15;
  }
}

export function onMapTap(
  instance: GoogleMapInstance,
  handler: (lat: number, lon: number) => void
) {
  instance.map.addListener('click', (event: { latLng?: { lat: () => number; lng: () => number } }) => {
    const latLng = event.latLng;
    if (!latLng) return;
    handler(latLng.lat(), latLng.lng());
  });
}
