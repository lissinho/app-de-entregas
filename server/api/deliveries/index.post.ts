import { z } from 'zod'

const createSchema = z.object({
  customerName: z.string().min(2).max(120),
  customerPhone: z.string().optional(),
  pickupAddress: z.string().min(3).optional(),
  deliveryAddress: z.string().min(3),
  volumeCategory: z.string().min(1),
  delivererId: z.number().int().optional()
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readValidatedBody(event, createSchema.parse)

  const db = getDbClient()
  const collectiveResult = await db.execute({
    sql: 'SELECT * FROM collectives ORDER BY id ASC LIMIT 1',
    args: []
  })
  if (!collectiveResult.rows.length) {
    throw createError({ statusCode: 404, statusMessage: 'Collective not configured' })
  }
  const collective = rowToCollective(firstRow(collectiveResult.rows))

  const volumeResult = await db.execute({
    sql: 'SELECT factor FROM volume_categories WHERE collective_id = ? AND key = ? LIMIT 1',
    args: [collective.id, body.volumeCategory]
  })
  if (!volumeResult.rows.length) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid volume category' })
  }
  const volumeFactor = Number(firstRow(volumeResult.rows).factor)

  let pickupLat = collective.baseLat
  let pickupLng = collective.baseLng
  let pickupAddress = collective.baseAddress || 'Base do coletivo'

  if (body.pickupAddress) {
    const pickupGeo = await geocodeAddress(body.pickupAddress)
    if (!pickupGeo) {
      throw createError({ statusCode: 400, statusMessage: 'Could not geocode pickup address' })
    }
    pickupLat = pickupGeo.lat
    pickupLng = pickupGeo.lon
    pickupAddress = body.pickupAddress
  }

  const deliveryGeo = await geocodeAddress(body.deliveryAddress)
  if (!deliveryGeo) {
    throw createError({ statusCode: 400, statusMessage: 'Could not geocode delivery address' })
  }

  const distanceKm = haversineDistanceKm(
    pickupLat ?? 0,
    pickupLng ?? 0,
    deliveryGeo.lat,
    deliveryGeo.lon
  )

  if (collective.baseLat !== undefined && collective.baseLng !== undefined && collective.deliveryRadiusKm > 0) {
    const distanceFromBase = haversineDistanceKm(
      collective.baseLat,
      collective.baseLng,
      deliveryGeo.lat,
      deliveryGeo.lon
    )
    if (distanceFromBase > collective.deliveryRadiusKm) {
      throw createError({
        statusCode: 400,
        statusMessage: `Delivery address is outside the coverage radius of ${collective.deliveryRadiusKm} km`
      })
    }
  }

  const pricing = calculatePricing({
    basePrice: collective.basePrice,
    pricePerKm: collective.pricePerKm,
    distanceKm,
    volumeFactor,
    platformFeeType: collective.platformFeeType,
    platformFeeValue: collective.platformFeeValue
  })

  if (body.delivererId) {
    const delivererCheck = await db.execute({
      sql: 'SELECT id FROM deliverers WHERE id = ?',
      args: [body.delivererId]
    })
    if (!delivererCheck.rows.length) {
      throw createError({ statusCode: 400, statusMessage: 'Deliverer not found' })
    }
  }

  const result = await db.execute({
    sql: `INSERT INTO deliveries (
            collective_id, customer_name, customer_phone,
            pickup_address, pickup_lat, pickup_lng,
            delivery_address, delivery_lat, delivery_lng,
            distance_km, volume_category,
            base_price, distance_price, volume_factor, price,
            platform_fee_type, platform_fee_value, platform_fee, final_price,
            deliverer_id, status
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING *`,
    args: [
      collective.id,
      body.customerName,
      body.customerPhone || null,
      pickupAddress,
      pickupLat ?? null,
      pickupLng ?? null,
      body.deliveryAddress,
      deliveryGeo.lat,
      deliveryGeo.lon,
      distanceKm,
      body.volumeCategory,
      pricing.basePrice,
      pricing.distancePrice,
      pricing.volumeFactor,
      pricing.price,
      pricing.platformFeeType,
      pricing.platformFeeValue,
      pricing.platformFee,
      pricing.finalPrice,
      body.delivererId || null,
      body.delivererId ? 'assigned' : 'pending'
    ] as unknown[]
  })

  return { delivery: rowToDelivery(firstRow(result.rows)) }
})
