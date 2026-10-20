import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  primaryColor: z.string().min(1).optional(),
  neutralColor: z.string().min(1).optional(),
  baseAddress: z.string().optional(),
  deliveryRadiusKm: z.number().min(0.1).optional(),
  basePrice: z.number().min(0).optional(),
  pricePerKm: z.number().min(0).optional(),
  platformFeeType: z.enum(['fixed', 'percent']).optional(),
  platformFeeValue: z.number().min(0).optional()
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readValidatedBody(event, updateSchema.parse)

  const db = getDbClient()
  const existing = await db.execute({
    sql: 'SELECT * FROM collectives ORDER BY id ASC LIMIT 1',
    args: []
  })
  if (!existing.rows.length) {
    throw createError({ statusCode: 404, statusMessage: 'Collective not found' })
  }
  const collectiveId = Number(firstRow(existing.rows).id)

  const fields: string[] = []
  const args: unknown[] = []

  function pushField(sql: string, value: unknown) {
    fields.push(sql)
    args.push(value)
  }

  if (body.name !== undefined) pushField('name = ?', body.name)
  if (body.primaryColor !== undefined) pushField('primary_color = ?', body.primaryColor)
  if (body.neutralColor !== undefined) pushField('neutral_color = ?', body.neutralColor)

  if (body.baseAddress !== undefined) {
    const address = body.baseAddress.trim()
    pushField('base_address = ?', address || null)
    if (address) {
      const geo = await geocodeAddress(address)
      if (!geo) {
        throw createError({ statusCode: 400, statusMessage: 'Could not geocode base address' })
      }
      pushField('base_lat = ?', geo.lat)
      pushField('base_lng = ?', geo.lon)
    } else {
      pushField('base_lat = ?', null)
      pushField('base_lng = ?', null)
    }
  }

  if (body.deliveryRadiusKm !== undefined) pushField('delivery_radius_km = ?', body.deliveryRadiusKm)
  if (body.basePrice !== undefined) pushField('base_price = ?', body.basePrice)
  if (body.pricePerKm !== undefined) pushField('price_per_km = ?', body.pricePerKm)
  if (body.platformFeeType !== undefined) pushField('platform_fee_type = ?', body.platformFeeType)
  if (body.platformFeeValue !== undefined) pushField('platform_fee_value = ?', body.platformFeeValue)

  if (!fields.length) {
    return { collective: rowToCollective(firstRow(existing.rows)) }
  }

  args.push(collectiveId)
  const result = await db.execute({
    sql: `UPDATE collectives SET ${fields.join(', ')} WHERE id = ? RETURNING *`,
    args
  })

  return { collective: rowToCollective(firstRow(result.rows)) }
})
