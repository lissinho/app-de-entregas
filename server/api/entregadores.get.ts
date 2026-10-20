import type { Entregador, Usuario, PerfilUsuario } from '~/types'

export default defineEventHandler(async (event) => {
  await exigirAdmin(event)
  const db = obterClienteDb()

  const resultado = await db.executar({
    sql: `SELECT e.id, e.usuario_id, e.telefone, e.tipo_veiculo, e.ativo,
                 u.id as usuario_id, u.email, u.nome, u.perfil, u.criado_em
          FROM entregadores e
          JOIN usuarios u ON u.id = e.usuario_id
          ORDER BY u.nome ASC`,
    args: []
  })

  const entregadores = resultado.linhas.map((linha): Entregador => {
    const usuario: Usuario = {
      id: Number(linha.usuario_id),
      email: String(linha.email),
      nome: String(linha.nome),
      perfil: String(linha.perfil) as PerfilUsuario,
      criadoEm: String(linha.criado_em)
    }
    return {
      ...linhaParaEntregador(linha),
      usuario
    }
  })

  return { entregadores }
})
