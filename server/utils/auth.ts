import { type H3Event, useSession } from 'h3'
import type { Deliverer, User, UserRole } from '~/types'

const SESSION_NAME = 'app-de-entregas-session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export interface SessionData {
  userId: number
  email: string
  name: string
  role: UserRole
}

function getSessionPassword(): string {
  const config = useRuntimeConfig()
  const password = config.session.password
  if (!password) {
    throw createError({ statusCode: 500, statusMessage: 'Session password not configured' })
  }
  return password
}

export async function getAppSession(event: H3Event) {
  return useSession<SessionData>(event, {
    name: SESSION_NAME,
    password: getSessionPassword(),
    maxAge: SESSION_MAX_AGE,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    }
  })
}

export async function requireAuth(event: H3Event): Promise<SessionData> {
  const session = await getAppSession(event)
  if (!session.data.userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return session.data
}

export async function requireAdmin(event: H3Event): Promise<SessionData> {
  const user = await requireAuth(event)
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return user
}

export async function requireDeliverer(event: H3Event): Promise<SessionData> {
  const user = await requireAuth(event)
  if (user.role !== 'deliverer') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return user
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = getDbClient()
  const result = await db.execute({
    sql: 'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
    args: [id]
  })
  if (!result.rows.length) return undefined
  return rowToUser(firstRow(result.rows))
}

export async function getDelivererByUserId(userId: number): Promise<Deliverer | undefined> {
  const db = getDbClient()
  const result = await db.execute({
    sql: 'SELECT id, user_id, phone, vehicle_type, active FROM deliverers WHERE user_id = ?',
    args: [userId]
  })
  if (!result.rows.length) return undefined
  return rowToDeliverer(firstRow(result.rows))
}
