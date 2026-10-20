import type { DbRow } from '../../utils/db'
import type { Deliverer, Delivery, User, UserRole } from '~/types'

function buildDelivererFromRow(row: DbRow): Deliverer | undefined {
  if (!row.deliverer_id) return undefined
  const user: User = {
    id: Number(row.uid),
    email: String(row.email),
    name: String(row.name),
    role: String(row.role) as UserRole,
    createdAt: String(row.created_at)
  }
  return {
    ...rowToDeliverer(row),
    user
  }
}

async function listDeliveriesForAdmin(): Promise<Delivery[]> {
  const db = getDbClient()
  const result = await db.execute({
    sql: `SELECT d.*,
                 del.id as deliverer_id, del.user_id, del.phone, del.vehicle_type, del.active,
                 u.id as uid, u.email, u.name, u.role, u.created_at
          FROM deliveries d
          LEFT JOIN deliverers del ON del.id = d.deliverer_id
          LEFT JOIN users u ON u.id = del.user_id
          ORDER BY d.created_at DESC`,
    args: []
  })

  return result.rows.map(row => ({
    ...rowToDelivery(row),
    deliverer: buildDelivererFromRow(row)
  }))
}

async function listDeliveriesForDeliverer(
  delivererId: number
): Promise<Delivery[]> {
  const db = getDbClient()
  const result = await db.execute({
    sql: `SELECT d.*,
                 del.id as deliverer_id, del.user_id, del.phone, del.vehicle_type, del.active,
                 u.id as uid, u.email, u.name, u.role, u.created_at
          FROM deliveries d
          LEFT JOIN deliverers del ON del.id = d.deliverer_id
          LEFT JOIN users u ON u.id = del.user_id
          WHERE d.deliverer_id = ?
          ORDER BY d.created_at DESC`,
    args: [delivererId]
  })

  return result.rows.map(row => ({
    ...rowToDelivery(row),
    deliverer: buildDelivererFromRow(row)
  }))
}

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)

  if (session.role === 'admin') {
    return { deliveries: await listDeliveriesForAdmin() }
  }

  const deliverer = await getDelivererByUserId(session.userId)
  if (!deliverer) {
    throw createError({ statusCode: 403, statusMessage: 'Deliverer profile not found' })
  }

  return { deliveries: await listDeliveriesForDeliverer(deliverer.id) }
})
