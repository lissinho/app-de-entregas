export default defineEventHandler(async () => {
  const db = getDbClient()

  const users = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM users',
    args: []
  })
  const count = Number(firstRow(users.rows).count)

  if (count === 0) {
    return { initialized: false }
  }

  const collectiveResult = await db.execute({
    sql: 'SELECT * FROM collectives ORDER BY id ASC LIMIT 1',
    args: []
  })

  return {
    initialized: true,
    collective: collectiveResult.rows.length ? rowToCollective(firstRow(collectiveResult.rows)) : null
  }
})
