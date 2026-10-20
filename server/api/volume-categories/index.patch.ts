import { z } from 'zod'

const categorySchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  factor: z.number().min(0)
})

const updateSchema = z.object({
  categories: z.array(categorySchema).min(1)
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readValidatedBody(event, updateSchema.parse)

  const db = getDbClient()
  const collective = await db.execute({
    sql: 'SELECT id FROM collectives ORDER BY id ASC LIMIT 1',
    args: []
  })
  if (!collective.rows.length) {
    throw createError({ statusCode: 404, statusMessage: 'Collective not found' })
  }
  const collectiveId = Number(firstRow(collective.rows).id)

  await db.execute({
    sql: 'DELETE FROM volume_categories WHERE collective_id = ?',
    args: [collectiveId]
  })

  for (const category of body.categories) {
    await db.execute({
      sql: `INSERT INTO volume_categories (collective_id, key, label, factor)
            VALUES (?, ?, ?, ?)`,
      args: [collectiveId, category.key, category.label, category.factor]
    })
  }

  const result = await db.execute({
    sql: 'SELECT * FROM volume_categories WHERE collective_id = ? ORDER BY factor ASC',
    args: [collectiveId]
  })

  return { categories: result.rows.map(rowToVolumeCategory) }
})
