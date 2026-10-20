import type { Deliverer, User, UserRole } from '~/types'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = getDbClient()

  const result = await db.execute({
    sql: `SELECT d.id, d.user_id, d.phone, d.vehicle_type, d.active,
                 u.id as uid, u.email, u.name, u.role, u.created_at
          FROM deliverers d
          JOIN users u ON u.id = d.user_id
          ORDER BY u.name ASC`,
    args: []
  })

  const deliverers = result.rows.map((row): Deliverer => {
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
  })

  return { deliverers }
})
