export default defineEventHandler(async () => {
  const db = obterClienteDb()
  const coletivo = await db.executar({
    sql: 'SELECT id FROM coletivos ORDER BY id ASC LIMIT 1',
    args: []
  })
  if (!coletivo.linhas.length) {
    return { categorias: [] }
  }

  const resultado = await db.executar({
    sql: 'SELECT * FROM categorias_volume WHERE coletivo_id = ? ORDER BY fator ASC',
    args: [Number(primeiraLinha(coletivo.linhas).id)]
  })

  return { categorias: resultado.linhas.map(linhaParaCategoriaVolume) }
})
