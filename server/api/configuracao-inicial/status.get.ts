export default defineEventHandler(async () => {
  const db = obterClienteDb()

  const usuarios = await db.executar({
    sql: 'SELECT COUNT(*) as count FROM usuarios',
    args: []
  })
  const count = Number(primeiraLinha(usuarios.linhas).count)

  if (count === 0) {
    return { inicializado: false }
  }

  const resultadoColetivo = await db.executar({
    sql: 'SELECT * FROM coletivos ORDER BY id ASC LIMIT 1',
    args: []
  })

  return {
    inicializado: true,
    coletivo: resultadoColetivo.linhas.length ? linhaParaColetivo(primeiraLinha(resultadoColetivo.linhas)) : null
  }
})
