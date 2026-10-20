import { z } from 'zod'
import bcrypt from 'bcryptjs'

const setupSchema = z.object({
  collectiveName: z.string().min(2).max(120),
  primaryColor: z.string().min(1),
  neutralColor: z.string().min(1),
  adminName: z.string().min(2).max(120),
  adminEmail: z.string().email().min(1),
  adminPassword: z.string().min(6)
})

export default defineEventHandler(async (event) => {
  const db = getDbClient()

  const existing = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM users',
    args: []
  })
  if (Number(firstRow(existing.rows).count) > 0) {
    throw createError({ statusCode: 409, statusMessage: 'Setup already completed' })
  }

  const body = await readValidatedBody(event, setupSchema.parse)

  const slug = body.collectiveName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const passwordHash = bcrypt.hashSync(body.adminPassword, 10)

  const collectiveResult = await db.execute({
    sql: `INSERT INTO collectives (name, slug, primary_color, neutral_color)
          VALUES (?, ?, ?, ?)
          RETURNING *`,
    args: [body.collectiveName, slug, body.primaryColor, body.neutralColor]
  })
  const collective = rowToCollective(firstRow(collectiveResult.rows))

  await createDefaultVolumeCategories(collective.id)

  const userResult = await db.execute({
    sql: `INSERT INTO users (email, name, password_hash, role)
          VALUES (?, ?, ?, ?)
          RETURNING id, email, name, role, created_at`,
    args: [body.adminEmail, body.adminName, passwordHash, 'admin']
  })
  const user = rowToUser(firstRow(userResult.rows))

  const session = await getAppSession(event)
  await session.update({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  })

  return { collective, user }
})
