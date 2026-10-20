import type { User, UserRole } from '~/types'

export const useAuth = () => {
  const user = useState<User | null | undefined>('auth-user', () => undefined)
  const pending = useState('auth-pending', () => false)

  async function fetchMe() {
    pending.value = true
    try {
      const { user: fetched } = await $fetch<{ user: User | null }>('/api/auth/me')
      user.value = fetched
      return fetched
    } finally {
      pending.value = false
    }
  }

  async function login(email: string, password: string) {
    const { user: loggedIn } = await $fetch<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    user.value = loggedIn
    return loggedIn
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    if (import.meta.client) {
      window.location.href = '/login'
    }
  }

  function redirectForRole(role: UserRole) {
    if (role === 'admin') return navigateTo('/admin')
    return navigateTo('/entregador')
  }

  return {
    user: readonly(user),
    pending: readonly(pending),
    fetchMe,
    login,
    logout,
    redirectForRole
  }
}
