import { z } from 'zod'
import type { DeliveryStatus } from '~/types'

const updateSchema = z.object({
  status: z.enum(['pending', 'assigned', 'in_progress', 'delivered', 'cancelled']).optional(),
  delivererId: z.number().int().nullable().optional()
})

const allowedDelivererTransitions: Record<DeliveryStatus, DeliveryStatus[]> = {
  pending: [],
  assigned: ['in_progress'],
  in_progress: ['delivered'],
  delivered: [],
  cancelled: []
}

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid delivery id' })
  }

  const body = await readValidatedBody(event, updateSchema.parse)
  const db = getDbClient()

  const existingResult = await db.execute({
    sql: 'SELECT * FROM deliveries WHERE id = ?',
    args: [id]
  })
  if (!existingResult.rows.length) {
    throw createError({ statusCode: 404, statusMessage: 'Delivery not found' })
  }
  const delivery = rowToDelivery(firstRow(existingResult.rows))

  if (session.role === 'deliverer') {
    const deliverer = await getDelivererByUserId(session.userId)
    if (!deliverer || delivery.delivererId !== deliverer.id) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
    if (body.status) {
      if (!allowedDelivererTransitions[delivery.status].includes(body.status)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid status transition' })
      }
    }
    if (body.delivererId !== undefined) {
      throw createError({ statusCode: 403, statusMessage: 'Cannot reassign delivery' })
    }
  }

  const fields: string[] = []
  const args: unknown[] = []

  if (body.status !== undefined) {
    fields.push('status = ?')
    args.push(body.status)
  }

  if (body.delivererId !== undefined) {
    fields.push('deliverer_id = ?')
    args.push(body.delivererId ?? null)
    if (body.delivererId && delivery.status === 'pending') {
      fields.push('status = ?')
      args.push('assigned')
    }
  }

  if (!fields.length) {
    return { delivery }
  }

  args.push(id)
  const result = await db.execute({
    sql: `UPDATE deliveries SET ${fields.join(', ')} WHERE id = ? RETURNING *`,
    args
  })

  return { delivery: rowToDelivery(firstRow(result.rows)) }
})
