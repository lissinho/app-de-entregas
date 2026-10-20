import { z } from 'zod'
import bcrypt from 'bcryptjs'

const schemaLogin = z.object({
  email: z.string().email().min(1),
  senha: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, schemaLogin.parse)
  const db = obterClienteDb()

  const resultado = await db.executar({
    sql: 'SELECT id, email, nome, perfil, senha_hash, criado_em FROM usuarios WHERE email = ?',
    args: [body.email]
  })

  if (!resultado.linhas.length) {
    throw createError({ statusCode: 401, statusMessage: 'Credenciais inválidas' })
  }

  const linha = primeiraLinha(resultado.linhas)
  const senhaHash = String(linha.senha_hash)
  const valido = bcrypt.compareSync(body.senha, senhaHash)

  if (!valido) {
    throw createError({ statusCode: 401, statusMessage: 'Credenciais inválidas' })
  }

  const usuario = linhaParaUsuario(linha)
  const sessao = await obterSessaoApp(event)
  await sessao.update({
    usuarioId: usuario.id,
    email: usuario.email,
    nome: usuario.nome,
    perfil: usuario.perfil
  })

  return { usuario }
})
