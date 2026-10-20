import { z } from 'zod'

const schemaCategoria = z.object({
  chave: z.string().min(1),
  rotulo: z.string().min(1),
  fator: z.number().min(0)
})

const schemaAtualizacao = z.object({
  categorias: z.array(schemaCategoria).min(1)
})

export default defineEventHandler(async (event) => {
  await exigirAdmin(event)
  const body = await readValidatedBody(event, schemaAtualizacao.parse)

  const db = obterClienteDb()
  const coletivo = await db.executar({
    sql: 'SELECT id FROM coletivos ORDER BY id ASC LIMIT 1',
    args: []
  })
  if (!coletivo.linhas.length) {
    throw createError({ statusCode: 404, statusMessage: 'Coletivo não encontrado' })
  }
  const coletivoId = Number(primeiraLinha(coletivo.linhas).id)

  await db.executar({
    sql: 'DELETE FROM categorias_volume WHERE coletivo_id = ?',
    args: [coletivoId]
  })

  for (const categoria of body.categorias) {
    await db.executar({
      sql: `INSERT INTO categorias_volume (coletivo_id, chave, rotulo, fator)
            VALUES (?, ?, ?, ?)`,
      args: [coletivoId, categoria.chave, categoria.rotulo, categoria.fator]
    })
  }

  const resultado = await db.executar({
    sql: 'SELECT * FROM categorias_volume WHERE coletivo_id = ? ORDER BY fator ASC',
    args: [coletivoId]
  })

  return { categorias: resultado.linhas.map(linhaParaCategoriaVolume) }
})
