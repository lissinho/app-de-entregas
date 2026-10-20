import { z } from 'zod'
import bcrypt from 'bcryptjs'

const loginSchema = z.object({
  email: z.string().email().min(1),
  password: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, loginSchema.parse)
  const db = getDbClient()

  const result = await db.execute({
    sql: 'SELECT id, email, name, role, password_hash, created_at FROM users WHERE email = ?',
    args: [body.email]
  })

  if (!result.rows.length) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const row = firstRow(result.rows)
  const passwordHash = String(row.password_hash)
  const valid = bcrypt.compareSync(body.password, passwordHash)

  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const user = rowToUser(row)
  const session = await getAppSession(event)
  await session.update({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  })

  return { user }
})
