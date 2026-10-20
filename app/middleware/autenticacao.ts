export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) {
    return
  }

  const { usuario, buscarMe } = useAutenticacao()

  if (usuario.value === undefined) {
    await buscarMe()
  }

  if (!usuario.value) {
    return navigateTo('/login')
  }
})
