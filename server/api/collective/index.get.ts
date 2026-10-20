export default defineEventHandler(async () => {
  const db = getDbClient()
  const result = await db.execute({
    sql: 'SELECT * FROM collectives ORDER BY id ASC LIMIT 1',
    args: []
  })

  if (!result.rows.length) {
    return { collective: null }
  }

  return { collective: rowToCollective(firstRow(result.rows)) }
})
