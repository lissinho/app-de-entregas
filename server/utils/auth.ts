import { type H3Event, useSession } from 'h3'
import type { Entregador, Usuario, PerfilUsuario } from '~/types'

const NOME_SESSAO = 'app-de-entregas-session'
const SESSAO_MAX_AGE = 60 * 60 * 24 * 7 // 7 dias

export interface DadosSessao {
  usuarioId: number
  email: string
  nome: string
  perfil: PerfilUsuario
}

function obterSenhaSessao(): string {
  const config = useRuntimeConfig()
  const senha = config.session.password
  if (!senha) {
    throw createError({ statusCode: 500, statusMessage: 'Senha de sessão não configurada' })
  }
  return senha
}

export async function obterSessaoApp(event: H3Event) {
  return useSession<DadosSessao>(event, {
    name: NOME_SESSAO,
    password: obterSenhaSessao(),
    maxAge: SESSAO_MAX_AGE,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    }
  })
}

export async function exigirAutenticacao(event: H3Event): Promise<DadosSessao> {
  const sessao = await obterSessaoApp(event)
  if (!sessao.data.usuarioId) {
    throw createError({ statusCode: 401, statusMessage: 'Não autenticado' })
  }
  return sessao.data
}

export async function exigirAdmin(event: H3Event): Promise<DadosSessao> {
  const usuario = await exigirAutenticacao(event)
  if (usuario.perfil !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Acesso negado' })
  }
  return usuario
}

export async function exigirEntregador(event: H3Event): Promise<DadosSessao> {
  const usuario = await exigirAutenticacao(event)
  if (usuario.perfil !== 'entregador') {
    throw createError({ statusCode: 403, statusMessage: 'Acesso negado' })
  }
  return usuario
}

export async function obterUsuarioPorId(id: number): Promise<Usuario | undefined> {
  const db = obterClienteDb()
  const resultado = await db.executar({
    sql: 'SELECT id, email, nome, perfil, criado_em FROM usuarios WHERE id = ?',
    args: [id]
  })
  if (!resultado.linhas.length) return undefined
  return linhaParaUsuario(primeiraLinha(resultado.linhas))
}

export async function obterEntregadorPorUsuarioId(usuarioId: number): Promise<Entregador | undefined> {
  const db = obterClienteDb()
  const resultado = await db.executar({
    sql: 'SELECT id, usuario_id, telefone, tipo_veiculo, ativo FROM entregadores WHERE usuario_id = ?',
    args: [usuarioId]
  })
  if (!resultado.linhas.length) return undefined
  return linhaParaEntregador(primeiraLinha(resultado.linhas))
}
