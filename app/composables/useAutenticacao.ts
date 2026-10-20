import type { Usuario, PerfilUsuario } from '~/types'

export const useAutenticacao = () => {
  const usuario = useState<Usuario | null | undefined>('auth-user', () => undefined)
  const pendente = useState('auth-pending', () => false)

  async function buscarMe() {
    pendente.value = true
    try {
      const { usuario: obtido } = await $fetch<{ usuario: Usuario | null }>('/api/autenticacao/me')
      usuario.value = obtido
      return obtido
    } finally {
      pendente.value = false
    }
  }

  async function login(email: string, senha: string) {
    const { usuario: logado } = await $fetch<{ usuario: Usuario }>('/api/autenticacao/login', {
      method: 'POST',
      body: { email, senha }
    })
    usuario.value = logado
    return logado
  }

  async function logout() {
    await $fetch('/api/autenticacao/logout', { method: 'POST' })
    usuario.value = null
    if (import.meta.client) {
      window.location.href = '/login'
    }
  }

  function redirecionarPorPerfil(perfil: PerfilUsuario) {
    if (perfil === 'admin') return navigateTo('/admin')
    return navigateTo('/entregador')
  }

  return {
    usuario: readonly(usuario),
    pendente: readonly(pendente),
    buscarMe,
    login,
    logout,
    redirecionarPorPerfil
  }
}
