export default defineEventHandler(async () => {
  const db = getDbClient()
  const collective = await db.execute({
    sql: 'SELECT id FROM collectives ORDER BY id ASC LIMIT 1',
    args: []
  })
  if (!collective.rows.length) {
    return { categories: [] }
  }

  const result = await db.execute({
    sql: 'SELECT * FROM volume_categories WHERE collective_id = ? ORDER BY factor ASC',
    args: [Number(firstRow(collective.rows).id)]
  })

  return { categories: result.rows.map(rowToVolumeCategory) }
})
