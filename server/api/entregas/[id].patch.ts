import { z } from 'zod'
import type { StatusEntrega } from '~/types'

const schemaAtualizacao = z.object({
  status: z.enum(['pendente', 'atribuida', 'em_andamento', 'entregue', 'cancelada']).optional(),
  entregadorId: z.number().int().nullable().optional()
})

const transicoesPermitidasEntregador: Record<StatusEntrega, StatusEntrega[]> = {
  pendente: [],
  atribuida: ['em_andamento'],
  em_andamento: ['entregue'],
  entregue: [],
  cancelada: []
}

export default defineEventHandler(async (event) => {
  const sessao = await exigirAutenticacao(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID da entrega inválido' })
  }

  const body = await readValidatedBody(event, schemaAtualizacao.parse)
  const db = obterClienteDb()

  const resultadoExistente = await db.executar({
    sql: 'SELECT * FROM entregas WHERE id = ?',
    args: [id]
  })
  if (!resultadoExistente.linhas.length) {
    throw createError({ statusCode: 404, statusMessage: 'Entrega não encontrada' })
  }
  const entrega = linhaParaEntrega(primeiraLinha(resultadoExistente.linhas))

  if (sessao.perfil === 'entregador') {
    const entregador = await obterEntregadorPorUsuarioId(sessao.usuarioId)
    if (!entregador || entrega.entregadorId !== entregador.id) {
      throw createError({ statusCode: 403, statusMessage: 'Acesso negado' })
    }
    if (body.status) {
      if (!transicoesPermitidasEntregador[entrega.status].includes(body.status)) {
        throw createError({ statusCode: 400, statusMessage: 'Transição de status inválida' })
      }
    }
    if (body.entregadorId !== undefined) {
      throw createError({ statusCode: 403, statusMessage: 'Não é possível reatribuir entrega' })
    }
  }

  const campos: string[] = []
  const args: unknown[] = []

  if (body.status !== undefined) {
    campos.push('status = ?')
    args.push(body.status)
  }

  if (body.entregadorId !== undefined) {
    campos.push('entregador_id = ?')
    args.push(body.entregadorId ?? null)
    if (body.entregadorId && entrega.status === 'pendente') {
      campos.push('status = ?')
      args.push('atribuida')
    }
  }

  if (!campos.length) {
    return { entrega }
  }

  args.push(id)
  const resultado = await db.executar({
    sql: `UPDATE entregas SET ${campos.join(', ')} WHERE id = ? RETURNING *`,
    args
  })

  return { entrega: linhaParaEntrega(primeiraLinha(resultado.linhas)) }
})
