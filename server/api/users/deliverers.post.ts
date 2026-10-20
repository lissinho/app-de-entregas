import { z } from 'zod'
import bcrypt from 'bcryptjs'

const createSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().min(1),
  password: z.string().min(6),
  phone: z.string().optional(),
  vehicleType: z.string().optional()
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readValidatedBody(event, createSchema.parse)

  const db = getDbClient()
  const existing = await db.execute({
    sql: 'SELECT id FROM users WHERE email = ?',
    args: [body.email]
  })
  if (existing.rows.length) {
    throw createError({ statusCode: 409, statusMessage: 'Email already in use' })
  }

  const passwordHash = bcrypt.hashSync(body.password, 10)

  const userResult = await db.execute({
    sql: `INSERT INTO users (email, name, password_hash, role)
          VALUES (?, ?, ?, ?)
          RETURNING id, email, name, role, created_at`,
    args: [body.email, body.name, passwordHash, 'deliverer']
  })
  const user = rowToUser(firstRow(userResult.rows))

  await db.execute({
    sql: `INSERT INTO deliverers (user_id, phone, vehicle_type, active)
          VALUES (?, ?, ?, ?)`,
    args: [user.id, body.phone || null, body.vehicleType || null, 1]
  })

  return { user }
})
