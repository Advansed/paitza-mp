import { mapLanguage } from '../i18n'
import { loadGoogleMapsAPI } from '../components/Maps/services/googleMapServices'

export type GeoPlace = {
  name: string
  country: string
  state?: string
  city?: string
  street?: string
  housenumber?: string
  label: string
  lat: number
  lon: number
}

type AddressComponent = {
  long_name?: string
  short_name?: string
  types?: string[]
}

type PlaceResult = {
  name?: string
  formatted_address?: string
  geometry?: { location?: { lat: () => number; lng: () => number } }
  address_components?: AddressComponent[]
  types?: string[]
}

type AutocompletePrediction = {
  place_id?: string
  description?: string
}

let placesNode: HTMLDivElement | null = null

function uniqueLabel(parts: Array<string | undefined>): string {
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of parts) {
    const text = part?.trim()
    if (!text) continue
    const key = text.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(text)
  }
  return out.join(', ')
}

function component(components: AddressComponent[] | undefined, type: string): string {
  return components?.find((item) => item.types?.includes(type))?.long_name?.trim() || ''
}

function parsePlace(place: PlaceResult | null | undefined, fallback?: { lat: number; lon: number }): GeoPlace | null {
  const lat = Number(place?.geometry?.location?.lat?.() ?? fallback?.lat)
  const lon = Number(place?.geometry?.location?.lng?.() ?? fallback?.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null

  const components = place?.address_components || []
  const city =
    component(components, 'locality') ||
    component(components, 'postal_town') ||
    component(components, 'administrative_area_level_2')
  const street = component(components, 'route')
  const housenumber = component(components, 'street_number')
  const state = component(components, 'administrative_area_level_1') || undefined
  const country = component(components, 'country')
  const streetLine = [street, housenumber].filter(Boolean).join(', ')
  const name = (city || place?.name || streetLine || '').trim()
  if (!name) return null

  return {
    name: (city || name).trim(),
    country,
    state,
    city: city || undefined,
    street: street || undefined,
    housenumber: housenumber || undefined,
    label:
      place?.formatted_address?.trim() ||
      uniqueLabel([streetLine || name, city, state, country]),
    lat,
    lon,
  }
}

function dedupe(places: GeoPlace[]): GeoPlace[] {
  const seen = new Set<string>()
  return places.filter((item) => {
    const key = `${item.label}|${item.lat.toFixed(4)}|${item.lon.toFixed(4)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function getPlacesService() {
  if (!placesNode) placesNode = document.createElement('div')
  return new window.google.maps.places.PlacesService(placesNode)
}

function getPredictions(request: Record<string, unknown>): Promise<AutocompletePrediction[]> {
  const svc = new window.google.maps.places.AutocompleteService()
  return new Promise((resolve) => {
    svc.getPlacePredictions(request, (predictions: AutocompletePrediction[] | null, status: string) => {
      if (status === 'OK') resolve(predictions || [])
      else resolve([])
    })
  })
}

function getDetails(placeId: string, sessionToken: unknown): Promise<PlaceResult | null> {
  return new Promise((resolve) => {
    getPlacesService().getDetails(
      {
        placeId,
        fields: ['geometry', 'address_components', 'formatted_address', 'name', 'types'],
        sessionToken,
      },
      (place: PlaceResult | null, status: string) => {
        if (status === 'OK') resolve(place)
        else resolve(null)
      }
    )
  })
}

async function autocompletePlaces(
  query: string,
  options: { types?: string[]; lat?: number; lon?: number; signal?: AbortSignal } = {}
): Promise<GeoPlace[]> {
  const q = query.trim()
  if (q.length < 2) return []
  try {
    await loadGoogleMapsAPI()
  } catch (error) {
    console.error('Google Places: не удалось загрузить Maps JS', error)
    return []
  }
  if (options.signal?.aborted || !window.google?.maps?.places) return []

  const sessionToken = new window.google.maps.places.AutocompleteSessionToken()
  const request: Record<string, unknown> = {
    input: q,
    language: mapLanguage(),
    sessionToken,
  }
  if (options.types?.length) request.types = options.types
  if (Number.isFinite(options.lat) && Number.isFinite(options.lon)) {
    request.location = new window.google.maps.LatLng(options.lat, options.lon)
    request.radius = 25000
  }

  const predictions = await getPredictions(request)
  if (options.signal?.aborted) return []

  const places = await Promise.all(
    predictions.slice(0, 8).map((item) => (item.place_id ? getDetails(item.place_id, sessionToken) : Promise.resolve(null)))
  )
  if (options.signal?.aborted) return []

  return dedupe(places.map((place) => parsePlace(place)).filter((item): item is GeoPlace => Boolean(item)))
}

export async function searchCities(query: string, signal?: AbortSignal): Promise<GeoPlace[]> {
  return autocompletePlaces(query, { signal, types: ['(cities)'] })
}

export async function searchAddresses(
  query: string,
  bias?: { lat?: number; lon?: number; city?: string },
  signal?: AbortSignal
): Promise<GeoPlace[]> {
  const q = bias?.city ? `${query}, ${bias.city}` : query
  const places = await autocompletePlaces(q, {
    signal,
    types: ['address'],
    lat: bias?.lat,
    lon: bias?.lon,
  })
  const precise = places.filter((item) => item.street || item.housenumber)
  if (precise.length > 0) return precise
  if (places.length > 0) return places
  return autocompletePlaces(q, { signal, lat: bias?.lat, lon: bias?.lon })
}

export async function geocodeAddress(
  query: string,
  signal?: AbortSignal
): Promise<GeoPlace | null> {
  const q = query.trim()
  if (q.length < 2) return null
  try {
    await loadGoogleMapsAPI()
  } catch {
    return null
  }
  if (signal?.aborted || !window.google?.maps?.Geocoder) return null
  try {
    const geocoder = new window.google.maps.Geocoder()
    const result = await geocoder.geocode({ address: q, language: mapLanguage() })
    if (signal?.aborted) return null
    return parsePlace(result.results?.[0])
  } catch {
    return null
  }
}

export async function reverseGeocode(
  lat: number,
  lon: number,
  signal?: AbortSignal
): Promise<GeoPlace | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  try {
    await loadGoogleMapsAPI()
  } catch {
    return null
  }
  if (signal?.aborted || !window.google?.maps?.Geocoder) return null

  try {
    const geocoder = new window.google.maps.Geocoder()
    const result = await geocoder.geocode({ location: { lat, lng: lon } })
    if (signal?.aborted) return null
    const parsed = parsePlace(result.results?.[0], { lat, lon })
    return parsed ? { ...parsed, lat, lon } : null
  } catch {
    return {
      name: `${lat.toFixed(6)}, ${lon.toFixed(6)}`,
      country: '',
      label: `${lat.toFixed(6)}, ${lon.toFixed(6)}`,
      lat,
      lon,
    }
  }
}
