import type { TipoTaxaPlataforma } from '~/types'

export interface EntradaPreco {
  precoBase: number
  precoPorKm: number
  distanciaKm: number
  fatorVolume: number
  tipoTaxaPlataforma: TipoTaxaPlataforma
  valorTaxaPlataforma: number
}

export interface ResultadoPreco {
  precoBase: number
  precoDistancia: number
  fatorVolume: number
  preco: number
  tipoTaxaPlataforma: TipoTaxaPlataforma
  valorTaxaPlataforma: number
  taxaPlataforma: number
  precoFinal: number
}

export function calcularPreco(entrada: EntradaPreco): ResultadoPreco {
  const precoDistancia = entrada.distanciaKm * entrada.precoPorKm
  const preco = (entrada.precoBase + precoDistancia) * entrada.fatorVolume

  let taxaPlataforma = 0
  if (entrada.tipoTaxaPlataforma === 'percentual') {
    taxaPlataforma = preco * (entrada.valorTaxaPlataforma / 100)
  } else if (entrada.tipoTaxaPlataforma === 'fixo') {
    taxaPlataforma = entrada.valorTaxaPlataforma
  }

  const precoFinal = preco + taxaPlataforma

  return {
    precoBase: entrada.precoBase,
    precoDistancia,
    fatorVolume: entrada.fatorVolume,
    preco: arredondarMoeda(preco),
    tipoTaxaPlataforma: entrada.tipoTaxaPlataforma,
    valorTaxaPlataforma: entrada.valorTaxaPlataforma,
    taxaPlataforma: arredondarMoeda(taxaPlataforma),
    precoFinal: arredondarMoeda(precoFinal)
  }
}

export function arredondarMoeda(valor: number): number {
  return Math.round(valor * 100) / 100
}
