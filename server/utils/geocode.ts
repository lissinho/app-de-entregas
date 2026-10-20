export interface ResultadoGeocodificacao {
  latitude: number
  longitude: number
  nomeExibicao?: string
}

export async function geocodificarEndereco(endereco: string): Promise<ResultadoGeocodificacao | undefined> {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'json')
  url.searchParams.set('q', endereco)
  url.searchParams.set('limit', '1')

  const resposta = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'app-de-entregas/1.0'
    }
  })

  if (!resposta.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `Erro no serviço de geocodificação: ${resposta.status}`
    })
  }

  const dados = (await resposta.json()) as Array<{ lat: string, lon: string, display_name?: string }>
  const primeiro = dados[0]
  if (!primeiro) return undefined

  return {
    latitude: Number(primeiro.lat),
    longitude: Number(primeiro.lon),
    nomeExibicao: primeiro.display_name
  }
}

export function distanciaHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Raio da Terra em km
  const dLat = paraRadianos(lat2 - lat1)
  const dLon = paraRadianos(lon2 - lon1)
  const a
    = Math.sin(dLat / 2) * Math.sin(dLat / 2)
      + Math.cos(paraRadianos(lat1)) * Math.cos(paraRadianos(lat2))
      * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function paraRadianos(graus: number): number {
  return graus * (Math.PI / 180)
}
