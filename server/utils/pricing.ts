import type { PlatformFeeType } from '~/types'

export interface PricingInput {
  basePrice: number
  pricePerKm: number
  distanceKm: number
  volumeFactor: number
  platformFeeType: PlatformFeeType
  platformFeeValue: number
}

export interface PricingResult {
  basePrice: number
  distancePrice: number
  volumeFactor: number
  price: number
  platformFeeType: PlatformFeeType
  platformFeeValue: number
  platformFee: number
  finalPrice: number
}

export function calculatePricing(input: PricingInput): PricingResult {
  const distancePrice = input.distanceKm * input.pricePerKm
  const price = (input.basePrice + distancePrice) * input.volumeFactor

  let platformFee = 0
  if (input.platformFeeType === 'percent') {
    platformFee = price * (input.platformFeeValue / 100)
  } else if (input.platformFeeType === 'fixed') {
    platformFee = input.platformFeeValue
  }

  const finalPrice = price + platformFee

  return {
    basePrice: input.basePrice,
    distancePrice,
    volumeFactor: input.volumeFactor,
    price: roundCurrency(price),
    platformFeeType: input.platformFeeType,
    platformFeeValue: input.platformFeeValue,
    platformFee: roundCurrency(platformFee),
    finalPrice: roundCurrency(finalPrice)
  }
}

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}
