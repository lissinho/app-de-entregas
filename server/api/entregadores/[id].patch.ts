import { z } from 'zod'

const schemaAtualizacao = z.object({
  telefone: z.string().optional(),
  tipoVeiculo: z.string().optional(),
  ativo: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  await exigirAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID do entregador inválido' })
  }

  const body = await readValidatedBody(event, schemaAtualizacao.parse)
  const db = obterClienteDb()

  const campos: string[] = []
  const args: unknown[] = []

  function adicionarCampo(sql: string, valor: unknown) {
    campos.push(sql)
    args.push(valor)
  }

  if (body.telefone !== undefined) adicionarCampo('telefone = ?', body.telefone)
  if (body.tipoVeiculo !== undefined) adicionarCampo('tipo_veiculo = ?', body.tipoVeiculo)
  if (body.ativo !== undefined) adicionarCampo('ativo = ?', body.ativo ? 1 : 0)

  if (!campos.length) {
    throw createError({ statusCode: 400, statusMessage: 'Nenhum campo para atualizar' })
  }

  args.push(id)
  await db.executar({
    sql: `UPDATE entregadores SET ${campos.join(', ')} WHERE id = ?`,
    args
  })

  return { sucesso: true }
})
