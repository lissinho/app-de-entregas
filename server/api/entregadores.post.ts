import { z } from 'zod'
import bcrypt from 'bcryptjs'

const schemaCriacao = z.object({
  nome: z.string().min(2).max(120),
  email: z.string().email().min(1),
  senha: z.string().min(6),
  telefone: z.string().optional(),
  tipoVeiculo: z.string().optional()
})

export default defineEventHandler(async (event) => {
  await exigirAdmin(event)
  const body = await readValidatedBody(event, schemaCriacao.parse)

  const db = obterClienteDb()
  const existente = await db.executar({
    sql: 'SELECT id FROM usuarios WHERE email = ?',
    args: [body.email]
  })
  if (existente.linhas.length) {
    throw createError({ statusCode: 409, statusMessage: 'E-mail já em uso' })
  }

  const senhaHash = bcrypt.hashSync(body.senha, 10)

  const resultadoUsuario = await db.executar({
    sql: `INSERT INTO usuarios (email, nome, senha_hash, perfil)
          VALUES (?, ?, ?, ?)
          RETURNING id, email, nome, perfil, criado_em`,
    args: [body.email, body.nome, senhaHash, 'entregador']
  })
  const usuario = linhaParaUsuario(primeiraLinha(resultadoUsuario.linhas))

  await db.executar({
    sql: `INSERT INTO entregadores (usuario_id, telefone, tipo_veiculo, ativo)
          VALUES (?, ?, ?, ?)`,
    args: [usuario.id, body.telefone || null, body.tipoVeiculo || null, 1]
  })

  return { usuario }
})
