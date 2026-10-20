interface StatusConfiguracao {
  inicializado: boolean
  coletivo: Coletivo | null
}

export default defineNuxtRouteMiddleware(async (to) => {
  const statusConfiguracao = useState<StatusConfiguracao | null>('status-configuracao', () => null)

  if (!statusConfiguracao.value) {
    statusConfiguracao.value = await $fetch<StatusConfiguracao>('/api/configuracao-inicial/status')
  }

  const { inicializado } = statusConfiguracao.value

  if (!inicializado && to.path !== '/configuracao-inicial') {
    return navigateTo('/configuracao-inicial', { replace: true })
  }

  if (inicializado && to.path === '/configuracao-inicial') {
    return navigateTo('/login', { replace: true })
  }
})
