import type { LinhaDb } from '../../utils/db'
import type { Entregador, Entrega, Usuario, PerfilUsuario } from '~/types'

function montarEntregadorDaLinha(linha: LinhaDb): Entregador | undefined {
  if (!linha.entregador_id) return undefined
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
}

async function listarEntregasParaAdmin(): Promise<Entrega[]> {
  const db = obterClienteDb()
  const resultado = await db.executar({
    sql: `SELECT e.*,
                 ent.id as entregador_id, ent.usuario_id, ent.telefone, ent.tipo_veiculo, ent.ativo,
                 u.id as usuario_id, u.email, u.nome, u.perfil, u.criado_em
          FROM entregas e
          LEFT JOIN entregadores ent ON ent.id = e.entregador_id
          LEFT JOIN usuarios u ON u.id = ent.usuario_id
          ORDER BY e.criado_em DESC`,
    args: []
  })

  return resultado.linhas.map(linha => ({
    ...linhaParaEntrega(linha),
    entregador: montarEntregadorDaLinha(linha)
  }))
}

async function listarEntregasParaEntregador(
  entregadorId: number
): Promise<Entrega[]> {
  const db = obterClienteDb()
  const resultado = await db.executar({
    sql: `SELECT e.*,
                 ent.id as entregador_id, ent.usuario_id, ent.telefone, ent.tipo_veiculo, ent.ativo,
                 u.id as usuario_id, u.email, u.nome, u.perfil, u.criado_em
          FROM entregas e
          LEFT JOIN entregadores ent ON ent.id = e.entregador_id
          LEFT JOIN usuarios u ON u.id = ent.usuario_id
          WHERE e.entregador_id = ?
          ORDER BY e.criado_em DESC`,
    args: [entregadorId]
  })

  return resultado.linhas.map(linha => ({
    ...linhaParaEntrega(linha),
    entregador: montarEntregadorDaLinha(linha)
  }))
}

export default defineEventHandler(async (event) => {
  const sessao = await exigirAutenticacao(event)

  if (sessao.perfil === 'admin') {
    return { entregas: await listarEntregasParaAdmin() }
  }

  const entregador = await obterEntregadorPorUsuarioId(sessao.usuarioId)
  if (!entregador) {
    throw createError({ statusCode: 403, statusMessage: 'Perfil de entregador não encontrado' })
  }

  return { entregas: await listarEntregasParaEntregador(entregador.id) }
})
