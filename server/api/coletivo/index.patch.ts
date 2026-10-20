import { z } from 'zod'

const schemaAtualizacao = z.object({
  nome: z.string().min(2).max(120).optional(),
  corPrimaria: z.string().min(1).optional(),
  corNeutra: z.string().min(1).optional(),
  enderecoBase: z.string().optional(),
  raioEntregaKm: z.number().min(0.1).optional(),
  precoBase: z.number().min(0).optional(),
  precoPorKm: z.number().min(0).optional(),
  tipoTaxaPlataforma: z.enum(['fixo', 'percentual']).optional(),
  valorTaxaPlataforma: z.number().min(0).optional()
})

export default defineEventHandler(async (event) => {
  await exigirAdmin(event)
  const body = await readValidatedBody(event, schemaAtualizacao.parse)

  const db = obterClienteDb()
  const existente = await db.executar({
    sql: 'SELECT * FROM coletivos ORDER BY id ASC LIMIT 1',
    args: []
  })
  if (!existente.linhas.length) {
    throw createError({ statusCode: 404, statusMessage: 'Coletivo não encontrado' })
  }
  const coletivoId = Number(primeiraLinha(existente.linhas).id)

  const campos: string[] = []
  const args: unknown[] = []

  function adicionarCampo(sql: string, valor: unknown) {
    campos.push(sql)
    args.push(valor)
  }

  if (body.nome !== undefined) adicionarCampo('nome = ?', body.nome)
  if (body.corPrimaria !== undefined) adicionarCampo('cor_primaria = ?', body.corPrimaria)
  if (body.corNeutra !== undefined) adicionarCampo('cor_neutra = ?', body.corNeutra)

  if (body.enderecoBase !== undefined) {
    const endereco = body.enderecoBase.trim()
    adicionarCampo('endereco_base = ?', endereco || null)
    if (endereco) {
      const geo = await geocodificarEndereco(endereco)
      if (!geo) {
        throw createError({ statusCode: 400, statusMessage: 'Não foi possível geocodificar o endereço base' })
      }
      adicionarCampo('latitude_base = ?', geo.latitude)
      adicionarCampo('longitude_base = ?', geo.longitude)
    } else {
      adicionarCampo('latitude_base = ?', null)
      adicionarCampo('longitude_base = ?', null)
    }
  }

  if (body.raioEntregaKm !== undefined) adicionarCampo('raio_entrega_km = ?', body.raioEntregaKm)
  if (body.precoBase !== undefined) adicionarCampo('preco_base = ?', body.precoBase)
  if (body.precoPorKm !== undefined) adicionarCampo('preco_por_km = ?', body.precoPorKm)
  if (body.tipoTaxaPlataforma !== undefined) adicionarCampo('tipo_taxa_plataforma = ?', body.tipoTaxaPlataforma)
  if (body.valorTaxaPlataforma !== undefined) adicionarCampo('valor_taxa_plataforma = ?', body.valorTaxaPlataforma)

  if (!campos.length) {
    return { coletivo: linhaParaColetivo(primeiraLinha(existente.linhas)) }
  }

  args.push(coletivoId)
  const resultado = await db.executar({
    sql: `UPDATE coletivos SET ${campos.join(', ')} WHERE id = ? RETURNING *`,
    args
  })

  return { coletivo: linhaParaColetivo(primeiraLinha(resultado.linhas)) }
})
