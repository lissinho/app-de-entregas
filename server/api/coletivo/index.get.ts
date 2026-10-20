export default defineEventHandler(async () => {
  const db = obterClienteDb()
  const resultado = await db.executar({
    sql: 'SELECT * FROM coletivos ORDER BY id ASC LIMIT 1',
    args: []
  })

  if (!resultado.linhas.length) {
    return { coletivo: null }
  }

  return { coletivo: linhaParaColetivo(primeiraLinha(resultado.linhas)) }
})
