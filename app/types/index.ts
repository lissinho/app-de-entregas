export type UserRole = 'admin' | 'deliverer'

export type DeliveryStatus = 'pending' | 'assigned' | 'in_progress' | 'delivered' | 'cancelled'

export type PlatformFeeType = 'fixed' | 'percent'

export interface User {
  id: number
  email: string
  name: string
  role: UserRole
  createdAt: string
}

export interface Collective {
  id: number
  name: string
  slug: string
  primaryColor: string
  neutralColor: string
  baseAddress?: string
  baseLat?: number
  baseLng?: number
  deliveryRadiusKm: number
  basePrice: number
  pricePerKm: number
  platformFeeType: PlatformFeeType
  platformFeeValue: number
  createdAt: string
}

export interface VolumeCategory {
  id: number
  collectiveId: number
  key: string
  label: string
  factor: number
}

export interface Deliverer {
  id: number
  userId: number
  phone?: string
  vehicleType?: string
  active: boolean
  user?: User
}

export interface Delivery {
  id: number
  collectiveId: number
  customerName: string
  customerPhone?: string
  pickupAddress?: string
  pickupLat?: number
  pickupLng?: number
  deliveryAddress: string
  deliveryLat: number
  deliveryLng: number
  distanceKm?: number
  volumeCategory: string
  basePrice: number
  distancePrice: number
  volumeFactor: number
  price: number
  platformFeeType: PlatformFeeType
  platformFeeValue: number
  platformFee: number
  finalPrice: number
  delivererId?: number
  status: DeliveryStatus
  createdAt: string
  updatedAt: string
  deliverer?: Deliverer
}
