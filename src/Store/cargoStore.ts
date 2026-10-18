// src/Store/cargoStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// ============================================
// ТИПЫ (сохраняем существующие)
// ============================================
export interface  CargoCity {
    city: string,
    fias: string
    country?: string
    lat?: number
    lon?: number
}

export interface  CargoAddress {
    city: CargoCity;
    address: string;
    fias: string;
    lat: number;
    lon: number;
}

export type CargoPointType = 'pickup' | 'waypoint' | 'delivery'

export interface CargoRoutePoint {
    id?: string
    address: string
    city: string
    lat: number
    lon: number
    point_type: CargoPointType
    sequence_num: number
}

export type       DriverStatus    = 'Заказано'  | 'Принято'   | 'На погрузке'   | 'Загружается'   | 'Загружено'   | 'В пути'  | 'Прибыл'  | 'Доставлено'  | 'Разгружается'  |  'Разгружено'  | 'Завершено';


export type       DriverCardMode  = 'offered'   | 'assigned'  | 'to_load'       | 'on_load'       | 'loaded'      | 'on_way'  | 'delivered'   | 'on_unload'     | 'unloaded'    | 'completed';


export interface  DriverInfo {
    guid:           string;
    cargo:          string;
    recipient:      string;
    client:         string;
    weight:         number;
    volume:         number;
    status:         DriverStatus;
    transport:      string;
    capacity:       string;
    rating:         number;
    price:          number;

}

export interface CargoCompany {
    id: string;
    name: string;
}

export interface  CargoInfo {
    guid:           string;
    name:           string;
    description:    string;
    client:         string;
    company?:       CargoCompany;
    address:        CargoAddress;
    destiny:        CargoAddress;
    pickup_date:    string;
    delivery_date: string;
    weight: number;
    weight1?:       number;
    volume:         number;
    price:          number;
    cost:           number;
    advance:        number;
    insurance:      number;
    phone:          string;
    face:           string;
    status:         CargoStatus;
    invoices?:      DriverInfo[];
    priority?:      CargoPriority;
    publish_date?:  string;
    updatedAt?:     string;
    body_type?:     string;
    transport_type?: string | number | { id?: string | number; name?: string };
    vehicles_total?: number;
    vehicles_busy?: number;
    route_distance?: number;
    route?: CargoRoutePoint[];
}

export enum       CargoStatus {
    NEW             = "Новый",
    WAITING         = "В ожидании",
    HAS_ORDERS      = "Есть заказы",
    ACCEPTED        = "Принято",
    WAIT_LOAD       = "Ждет загрузку",
    LOADING         = "Загружается",
    HAS_LOADED      = "Есть загруженные",
    IN_TRANSIT      = "В Пути",
    HAS_DELIVERED   = "Есть доставленные",
    UNLOADING       = "Разгружается",
    WAIT_COMPLETE   = "Ждут завершения",
    COMPLETED       = "Завершено",
    PROBLEMS        = "Проблемы",
}

export enum       CargoPriority {
    LOW = 'low',
    NORMAL = 'normal', 
    HIGH = 'high',
    URGENT = 'urgent'
}

export interface  PageType {
    type:       'list' | 'create' | 'edit' | 'view' | 'invoices' | 'prepayment' | 'insurance' | 'page1' | 'payment' | 'agreement' | 'map'
    cargo?:     any
    subPage?:   string
    invoice?:   DriverInfo
    contract?:  any
}

export interface  CargoFilters {
    status?: CargoStatus[]
    priority?: CargoPriority[]
    dateFrom?: string
    dateTo?: string
    cityFrom?: string
    cityTo?: string
    minPrice?: number
    maxPrice?: number
}

// ============================================
// КОНСТАНТЫ
// ============================================
export const EMPTY_CARGO: CargoInfo = {
  guid: '',
  name: '',
  description: '',
  client: '',
  address: {
    city: { city: '', fias: '' },
    address: '',
    fias: '',
    lat: 0,
    lon: 0
  },
  destiny: {
    city: { city: '', fias: '' },
    address: '',
    fias: '',
    lat: 0,
    lon: 0
  },
  pickup_date: '',
  delivery_date: '',
  weight: 0,
  weight1: 0,
  volume: 0,
  price: 0,
  cost: 0,
  advance: 0,
  insurance: 0,
  phone: '',
  face: '',
  status: CargoStatus.NEW,
  route: [],
}

// ============================================
// ZUSTAND STORE
// ============================================
export interface CargoState {
    cargos:             CargoInfo[]
    archives:           CargoInfo[]
    isLoading:          boolean
    filters:            CargoFilters
    searchQuery:        string
}

interface CargoActions {
    setCargos:            ( cargos: CargoInfo[] ) => void
    setCargoArchives:     ( archives: CargoInfo[] ) => void
    setLoading:           ( loading: boolean ) => void
    setFilters:           ( filters: CargoFilters ) => void
    setSearchQuery:       ( query: string ) => void
    updateCargo:          ( guid: string, data: Partial<CargoInfo >) => void
    publishCargo:         ( guid: string ) => void
    unpublishCargo:       ( guid: string ) => void
    addCargo:             ( cargo: CargoInfo ) => void
    deleteCargo:          ( guid: string ) => void
}

type CargoStore = CargoState & CargoActions

export const useCargoStore = create<CargoStore>()(
  devtools(
    (set, get) => ({
      // STATE
      cargos:             [],
      archives:           [],
      isLoading:          false,
      filters:            {},
      searchQuery:        '',

      // ACTIONS
      setCargos:          (cargos)        => set({ cargos }),
      setCargoArchives:   (archives)      => set({ archives }),
      setLoading:         (isLoading)     => set({ isLoading }),
      setFilters:         (filters)       => set({ filters }),
      setSearchQuery:     (searchQuery)   => set({ searchQuery }),

      updateCargo: (guid, data) => {
        const { cargos } = get()
        const updated = cargos.map(c => 
          c.guid === guid ? { ...c, ...data } : c
        )
        set({ cargos: updated })
      },

      publishCargo: (guid) => {
        const { cargos } = get()
        const updated = cargos.map(c => 
          c.guid === guid ? { ...c, status: CargoStatus.WAITING } : c
        )
        set({ cargos: updated })
      },

      unpublishCargo: (guid) => {
        const { cargos } = get()
        const updated = cargos.map(c =>
          c.guid === guid ? { ...c, status: CargoStatus.NEW } : c
        )
        set({ cargos: updated })
      },

      addCargo: (cargo) => {
        const { cargos } = get()
        set({ cargos: [...cargos, cargo] })
      },

      deleteCargo: (guid) => {
        const { cargos } = get()
        set({ cargos: cargos.filter(c => c.guid !== guid) })
      }
    }),
    { name: 'cargo-store' }
  )
)

// ============================================
// GETTERS (совместимость)
// ============================================
export const cargoGetters = {

  getCargos: (): CargoInfo[] => useCargoStore.getState().cargos,

  getCargo: (guid: string): CargoInfo | undefined => 
    useCargoStore.getState().cargos.find(c => c.guid === guid)

}

// ============================================
// ACTIONS (совместимость)
// ============================================
export const cargoActions = {
  updateCargo: (guid: string, data: Partial<CargoInfo>) => 
    useCargoStore.getState().updateCargo(guid, data),

  publishCargo: (guid: string) => 
    useCargoStore.getState().publishCargo(guid),

  unpublishCargo: (guid: string) =>
    useCargoStore.getState().unpublishCargo(guid),

  deleteCargo: (guid: string) =>
    useCargoStore.getState().deleteCargo(guid)
}

const COORD_PAIR = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/

export function cityLabel(city: unknown): string {
  if (!city) return ''
  if (typeof city === 'string') return city.trim()
  if (typeof city === 'object' && city && 'city' in city) {
    return String((city as { city?: unknown }).city || '').trim()
  }
  return ''
}

export function hasRouteCoords(lat?: number | null, lon?: number | null): boolean {
  const la = Number(lat)
  const lo = Number(lon)
  return Number.isFinite(la) && Number.isFinite(lo) && !(la === 0 && lo === 0)
}

export function parseCoordPair(text: string): { lat: number; lon: number } | null {
  const match = text.trim().match(COORD_PAIR)
  if (!match) return null
  const lat = Number(match[1])
  const lon = Number(match[2])
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null
  if (lat === 0 && lon === 0) return null
  return { lat, lon }
}

function pointTypeOf(raw: unknown): CargoPointType {
  const value = String(raw || '').toLowerCase()
  if (value === 'delivery' || value === 'dropoff' || value === 'destination') return 'delivery'
  if (value === 'waypoint' || value === 'via' || value === 'stop') return 'waypoint'
  return 'pickup'
}

export function toCargoAddress(point: {
  city?: unknown
  address?: string
  fias?: string
  lat?: number
  lon?: number
}): CargoAddress {
  let lat = Number(point.lat) || 0
  let lon = Number(point.lon) || 0
  const rawAddress = String(point.address || '').trim()
  const fromText = parseCoordPair(rawAddress)
  if (!hasRouteCoords(lat, lon) && fromText) {
    lat = fromText.lat
    lon = fromText.lon
  }
  const nested = point.city && typeof point.city === 'object' ? (point.city as CargoCity) : undefined
  if (!hasRouteCoords(lat, lon) && nested) {
    lat = Number(nested.lat) || 0
    lon = Number(nested.lon) || 0
  }
  return {
    city: {
      city: cityLabel(point.city),
      fias: nested?.fias || '',
      country: nested?.country,
      lat,
      lon,
    },
    address: fromText ? '' : rawAddress,
    fias: String(point.fias || ''),
    lat,
    lon,
  }
}

function asRoutePoint(item: any, index: number): CargoRoutePoint {
  const address = toCargoAddress({
    city: item?.city,
    address: item?.address,
    lat: item?.lat,
    lon: item?.lon,
  })
  return {
    ...(item?.id ? { id: String(item.id) } : {}),
    address: address.address,
    city: address.city.city,
    lat: address.lat,
    lon: address.lon,
    point_type: pointTypeOf(item?.point_type),
    sequence_num: Number(item?.sequence_num) || index + 1,
  }
}

export function routePointFromAddress(
  point: CargoAddress,
  type: CargoPointType,
  sequence: number,
  id?: string
): CargoRoutePoint {
  const lat = Number(point.lat || point.city?.lat) || 0
  const lon = Number(point.lon || point.city?.lon) || 0
  const street = (point.address || '').trim()
  return {
    ...(id ? { id } : {}),
    city: point.city?.city || '',
    address: street || (hasRouteCoords(lat, lon) ? `${lat}, ${lon}` : ''),
    lat,
    lon,
    point_type: type,
    sequence_num: sequence,
  }
}

export function buildCargoRoute(
  pickup: CargoAddress,
  delivery: CargoAddress,
  waypoints: CargoRoutePoint[] = [],
  ids?: { pickup?: string; delivery?: string }
): CargoRoutePoint[] {
  const mids = waypoints.filter((point) => point.point_type !== 'pickup' && point.point_type !== 'delivery')
  const points: CargoRoutePoint[] = [
    routePointFromAddress(pickup, 'pickup', 1, ids?.pickup),
    ...mids.map((point, index) => ({
      ...(point.id ? { id: point.id } : {}),
      city: point.city || '',
      address: point.address || (hasRouteCoords(point.lat, point.lon) ? `${point.lat}, ${point.lon}` : ''),
      lat: Number(point.lat) || 0,
      lon: Number(point.lon) || 0,
      point_type: 'waypoint' as const,
      sequence_num: index + 2,
    })),
  ]
  points.push(routePointFromAddress(delivery, 'delivery', points.length + 1, ids?.delivery))
  return points
}

export function waypointCoordinates(
  route?: CargoRoutePoint[]
): Array<{ lat: number; lon: number }> {
  return (route || [])
    .filter((point) => point.point_type === 'waypoint' && hasRouteCoords(point.lat, point.lon))
    .slice()
    .sort((a, b) => a.sequence_num - b.sequence_num)
    .map((point) => ({ lat: point.lat, lon: point.lon }))
}

export function normalizeCargoRoute<T extends { address?: any; destiny?: any; route?: unknown }>(
  cargo: T
): T & { address: CargoAddress; destiny: CargoAddress; route: CargoRoutePoint[] } {
  const rawRoute = Array.isArray(cargo.route) ? cargo.route : null
  if (!rawRoute || rawRoute.length === 0) {
    return {
      ...cargo,
      address: cargo.address ? toCargoAddress(cargo.address) : { ...EMPTY_CARGO.address },
      destiny: cargo.destiny ? toCargoAddress(cargo.destiny) : { ...EMPTY_CARGO.destiny },
      route: cargo.address && cargo.destiny
        ? buildCargoRoute(toCargoAddress(cargo.address), toCargoAddress(cargo.destiny))
        : [],
    }
  }

  const points = rawRoute
    .map((item, index) => asRoutePoint(item, index))
    .sort((a, b) => a.sequence_num - b.sequence_num)
  const pickup = points.find((point) => point.point_type === 'pickup') || points[0]
  const delivery = [...points].reverse().find((point) => point.point_type === 'delivery') || points[points.length - 1]
  return {
    ...cargo,
    route: points,
    address: pickup ? toCargoAddress(pickup) : { ...EMPTY_CARGO.address },
    destiny: delivery ? toCargoAddress(delivery) : { ...EMPTY_CARGO.destiny },
  }
}

/** Последний payload set_cargo — чтобы не потерять insurance/advance, если сервер их не вернул */
let pendingCargoSave: Partial<CargoInfo> | null = null

export const setPendingCargoSave = (cargo: Partial<CargoInfo> | null) => {
  pendingCargoSave = cargo
}

const pickFinance = (
  key: 'advance' | 'insurance',
  incoming: Partial<CargoInfo>,
  fallback?: Partial<CargoInfo> | null
): number => {
  const fromIncoming = incoming[key]
  if (fromIncoming !== undefined && fromIncoming !== null) {
    return Number(fromIncoming) || 0
  }
  const fromFallback = fallback?.[key]
  if (fromFallback !== undefined && fromFallback !== null) {
    return Number(fromFallback) || 0
  }
  return 0
}

const mergeSavedCargo = (
  incoming: CargoInfo,
  existing?: CargoInfo
): CargoInfo => {
  const pending =
    pendingCargoSave &&
    (!incoming.guid ||
      !pendingCargoSave.guid ||
      pendingCargoSave.guid === incoming.guid)
      ? pendingCargoSave
      : null

  const base = { ...EMPTY_CARGO, ...existing, ...pending, ...incoming }
  return {
    ...base,
    advance: pickFinance('advance', incoming, pending ?? existing),
    insurance: pickFinance('insurance', incoming, pending ?? existing),
  }
}

// ============================================
// SOCKET ОБРАБОТЧИКИ
// ============================================
export const cargoSocketHandlers = {

    onGetCargos: (response: any) => {
        useCargoStore.getState().setLoading(false)

        // Нормализация push/response: массив, { success, data }, или один cargo
        const raw = Array.isArray(response)
            ? response
            : Array.isArray(response?.data)
              ? response.data
              : response?.data && typeof response.data === 'object' && response.data.guid
                ? [response.data]
                : null

        const ok = response?.success !== false

        if (ok && raw) {
            useCargoStore.getState().setCargos(raw.map((item: CargoInfo) => normalizeCargoRoute(item)))
        } else {
            console.error('Invalid cargos response:', response)
        }
    },

    onGetCargoArchives: (response: any) => {
        useCargoStore.getState().setLoading(false)
        
        if (response.success && Array.isArray( response.data )) {

            useCargoStore.getState().setCargoArchives(
                (response.data as CargoInfo[]).map((item) => normalizeCargoRoute(item))
            )

        } else {

            console.error('Invalid cargos response:', response)

        }
    },

    onSaveCargo: (response: any) => {
        
        if (response.success && response.data) {
            const { cargos } = useCargoStore.getState()
            const existing = cargos.find(c => c.guid === response.data.guid)
            const merged = normalizeCargoRoute(mergeSavedCargo(response.data as CargoInfo, existing))
            pendingCargoSave = null

            if (existing) {
                useCargoStore.getState().updateCargo(merged.guid, merged)
            } else {
                useCargoStore.getState().addCargo(merged)
            }
        } else {
            pendingCargoSave = null
        }
    },

    onDeleteCargo: (response: any) => {
        
        if (response.success && response.guid) {
            useCargoStore.getState().deleteCargo(response.guid)
        }
    },

    onPublishCargo: (response: any) => {
        if (!response?.success) return
        const guid = response.data?.guid || response.guid
        if (!guid) return
        if (response.data) {
            useCargoStore.getState().updateCargo(
                guid,
                normalizeCargoRoute({
                    ...response.data,
                    status: response.data.status || CargoStatus.WAITING,
                } as CargoInfo)
            )
            return
        }
        useCargoStore.getState().publishCargo(guid)
    },

    onUnpublishCargo: (response: any) => {
        if (!response?.success) return
        const guid = response.data?.guid || response.guid
        if (!guid) return
        if (response.data) {
            useCargoStore.getState().updateCargo(
                guid,
                normalizeCargoRoute({ ...response.data, status: response.data.status || CargoStatus.NEW } as CargoInfo)
            )
            return
        }
        useCargoStore.getState().unpublishCargo(guid)
    },
    
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ SOCKET ОБРАБОТЧИКОВ
// ============================================
export const initCargoSocketHandlers = (socket: any) => {
    if (!socket) return

    
    socket.on('get_cargos',           cargoSocketHandlers.onGetCargos)
    socket.on('get_cargo_archives',   cargoSocketHandlers.onGetCargoArchives)
    socket.on('set_cargo',            cargoSocketHandlers.onSaveCargo)
    socket.on('delete_cargo',         cargoSocketHandlers.onDeleteCargo)
    socket.on('publish_cargo',        cargoSocketHandlers.onPublishCargo)
    socket.on('publish',              cargoSocketHandlers.onPublishCargo)
    socket.on('unpublish_cargo',      cargoSocketHandlers.onUnpublishCargo)
    
}

export const destroyCargoSocketHandlers = (socket: any) => {
    if (!socket) return
    
    socket.off('get_cargos',          cargoSocketHandlers.onGetCargos)
    socket.off('get_cargo_archives',  cargoSocketHandlers.onGetCargoArchives)
    socket.off('set_cargo',           cargoSocketHandlers.onSaveCargo)
    socket.off('delete_cargo',        cargoSocketHandlers.onDeleteCargo)
    socket.off('publish_cargo',       cargoSocketHandlers.onPublishCargo)
    socket.off('publish',             cargoSocketHandlers.onPublishCargo)
    socket.off('unpublish_cargo',     cargoSocketHandlers.onUnpublishCargo)
    
}