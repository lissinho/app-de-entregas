export interface GeocodeResult {
  lat: number
  lon: number
  displayName?: string
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | undefined> {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'json')
  url.searchParams.set('q', address)
  url.searchParams.set('limit', '1')

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'app-de-entregas/1.0'
    }
  })

  if (!response.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `Geocoding service error: ${response.status}`
    })
  }

  const data = (await response.json()) as Array<{ lat: string, lon: string, display_name?: string }>
  const first = data[0]
  if (!first) return undefined

  return {
    lat: Number(first.lat),
    lon: Number(first.lon),
    displayName: first.display_name
  }
}

export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth radius in km
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a
    = Math.sin(dLat / 2) * Math.sin(dLat / 2)
      + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2))
      * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}
