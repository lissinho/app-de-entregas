export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) {
    return
  }

  const { user, fetchMe } = useAuth()

  if (user.value === undefined) {
    await fetchMe()
  }

  if (!user.value) {
    return navigateTo('/login')
  }

  if (user.value.role !== 'admin') {
    return navigateTo('/entregador')
  }
})
