import { z } from 'zod'

const schemaCriacao = z.object({
  nomeCliente: z.string().min(2).max(120),
  telefoneCliente: z.string().optional(),
  enderecoRetirada: z.string().min(3).optional(),
  enderecoEntrega: z.string().min(3),
  categoriaVolume: z.string().min(1),
  entregadorId: z.number().int().optional()
})

export default defineEventHandler(async (event) => {
  await exigirAdmin(event)
  const body = await readValidatedBody(event, schemaCriacao.parse)

  const db = obterClienteDb()
  const resultadoColetivo = await db.executar({
    sql: 'SELECT * FROM coletivos ORDER BY id ASC LIMIT 1',
    args: []
  })
  if (!resultadoColetivo.linhas.length) {
    throw createError({ statusCode: 404, statusMessage: 'Coletivo não configurado' })
  }
  const coletivo = linhaParaColetivo(primeiraLinha(resultadoColetivo.linhas))

  const resultadoVolume = await db.executar({
    sql: 'SELECT fator FROM categorias_volume WHERE coletivo_id = ? AND chave = ? LIMIT 1',
    args: [coletivo.id, body.categoriaVolume]
  })
  if (!resultadoVolume.linhas.length) {
    throw createError({ statusCode: 400, statusMessage: 'Categoria de volume inválida' })
  }
  const fatorVolume = Number(primeiraLinha(resultadoVolume.linhas).fator)

  let latitudeRetirada = coletivo.latitudeBase
  let longitudeRetirada = coletivo.longitudeBase
  let enderecoRetirada = coletivo.enderecoBase || 'Base do coletivo'

  if (body.enderecoRetirada) {
    const geoRetirada = await geocodificarEndereco(body.enderecoRetirada)
    if (!geoRetirada) {
      throw createError({ statusCode: 400, statusMessage: 'Não foi possível geocodificar o endereço de retirada' })
    }
    latitudeRetirada = geoRetirada.latitude
    longitudeRetirada = geoRetirada.longitude
    enderecoRetirada = body.enderecoRetirada
  }

  const geoEntrega = await geocodificarEndereco(body.enderecoEntrega)
  if (!geoEntrega) {
    throw createError({ statusCode: 400, statusMessage: 'Não foi possível geocodificar o endereço de entrega' })
  }

  const distanciaKm = distanciaHaversineKm(
    latitudeRetirada ?? 0,
    longitudeRetirada ?? 0,
    geoEntrega.latitude,
    geoEntrega.longitude
  )

  if (coletivo.latitudeBase !== undefined && coletivo.longitudeBase !== undefined && coletivo.raioEntregaKm > 0) {
    const distanciaDaBase = distanciaHaversineKm(
      coletivo.latitudeBase,
      coletivo.longitudeBase,
      geoEntrega.latitude,
      geoEntrega.longitude
    )
    if (distanciaDaBase > coletivo.raioEntregaKm) {
      throw createError({
        statusCode: 400,
        statusMessage: `Endereço de entrega fora do raio de ${coletivo.raioEntregaKm} km`
      })
    }
  }

  const preco = calcularPreco({
    precoBase: coletivo.precoBase,
    precoPorKm: coletivo.precoPorKm,
    distanciaKm,
    fatorVolume,
    tipoTaxaPlataforma: coletivo.tipoTaxaPlataforma,
    valorTaxaPlataforma: coletivo.valorTaxaPlataforma
  })

  if (body.entregadorId) {
    const checagemEntregador = await db.executar({
      sql: 'SELECT id FROM entregadores WHERE id = ?',
      args: [body.entregadorId]
    })
    if (!checagemEntregador.linhas.length) {
      throw createError({ statusCode: 400, statusMessage: 'Entregador não encontrado' })
    }
  }

  const resultado = await db.executar({
    sql: `INSERT INTO entregas (
            coletivo_id, nome_cliente, telefone_cliente,
            endereco_retirada, latitude_retirada, longitude_retirada,
            endereco_entrega, latitude_entrega, longitude_entrega,
            distancia_km, categoria_volume,
            preco_base, preco_distancia, fator_volume, preco,
            tipo_taxa_plataforma, valor_taxa_plataforma, taxa_plataforma, preco_final,
            entregador_id, status
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING *`,
    args: [
      coletivo.id,
      body.nomeCliente,
      body.telefoneCliente || null,
      enderecoRetirada,
      latitudeRetirada ?? null,
      longitudeRetirada ?? null,
      body.enderecoEntrega,
      geoEntrega.latitude,
      geoEntrega.longitude,
      distanciaKm,
      body.categoriaVolume,
      preco.precoBase,
      preco.precoDistancia,
      preco.fatorVolume,
      preco.preco,
      preco.tipoTaxaPlataforma,
      preco.valorTaxaPlataforma,
      preco.taxaPlataforma,
      preco.precoFinal,
      body.entregadorId || null,
      body.entregadorId ? 'atribuida' : 'pendente'
    ] as unknown[]
  })

  return { entrega: linhaParaEntrega(primeiraLinha(resultado.linhas)) }
})
