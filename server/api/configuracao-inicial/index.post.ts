import { z } from 'zod'
import bcrypt from 'bcryptjs'

const schemaConfiguracao = z.object({
  nomeColetivo: z.string().min(2).max(120),
  corPrimaria: z.string().min(1),
  corNeutra: z.string().min(1),
  nomeAdmin: z.string().min(2).max(120),
  emailAdmin: z.string().email().min(1),
  senhaAdmin: z.string().min(6)
})

export default defineEventHandler(async (event) => {
  const db = obterClienteDb()

  const existente = await db.executar({
    sql: 'SELECT COUNT(*) as count FROM usuarios',
    args: []
  })
  if (Number(primeiraLinha(existente.linhas).count) > 0) {
    throw createError({ statusCode: 409, statusMessage: 'Configuração inicial realizada' })
  }

  const body = await readValidatedBody(event, schemaConfiguracao.parse)

  const slug = body.nomeColetivo.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const senhaHash = bcrypt.hashSync(body.senhaAdmin, 10)

  const resultadoColetivo = await db.executar({
    sql: `INSERT INTO coletivos (nome, slug, cor_primaria, cor_neutra)
          VALUES (?, ?, ?, ?)
          RETURNING *`,
    args: [body.nomeColetivo, slug, body.corPrimaria, body.corNeutra]
  })
  const coletivo = linhaParaColetivo(primeiraLinha(resultadoColetivo.linhas))

  await criarCategoriasVolumePadrao(coletivo.id)

  const resultadoUsuario = await db.executar({
    sql: `INSERT INTO usuarios (email, nome, senha_hash, perfil)
          VALUES (?, ?, ?, ?)
          RETURNING id, email, nome, perfil, criado_em`,
    args: [body.emailAdmin, body.nomeAdmin, senhaHash, 'admin']
  })
  const usuario = linhaParaUsuario(primeiraLinha(resultadoUsuario.linhas))

  const sessao = await obterSessaoApp(event)
  await sessao.update({
    usuarioId: usuario.id,
    email: usuario.email,
    nome: usuario.nome,
    perfil: usuario.perfil
  })

  return { coletivo, usuario }
})
