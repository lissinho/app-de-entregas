import { z } from 'zod'

const updateSchema = z.object({
  phone: z.string().optional(),
  vehicleType: z.string().optional(),
  active: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid deliverer id' })
  }

  const body = await readValidatedBody(event, updateSchema.parse)
  const db = getDbClient()

  const fields: string[] = []
  const args: unknown[] = []

  function pushField(sql: string, value: unknown) {
    fields.push(sql)
    args.push(value)
  }

  if (body.phone !== undefined) pushField('phone = ?', body.phone)
  if (body.vehicleType !== undefined) pushField('vehicle_type = ?', body.vehicleType)
  if (body.active !== undefined) pushField('active = ?', body.active ? 1 : 0)

  if (!fields.length) {
    throw createError({ statusCode: 400, statusMessage: 'No fields to update' })
  }

  args.push(id)
  await db.execute({
    sql: `UPDATE deliverers SET ${fields.join(', ')} WHERE id = ?`,
    args
  })

  return { success: true }
})
