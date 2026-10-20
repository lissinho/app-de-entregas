interface SetupStatus {
  initialized: boolean
  collective: Collective | null
}

export default defineNuxtRouteMiddleware(async (to) => {
  const setupStatus = useState<SetupStatus | null>('setup-status', () => null)

  if (!setupStatus.value) {
    setupStatus.value = await $fetch<SetupStatus>('/api/setup/status')
  }

  const { initialized } = setupStatus.value

  if (!initialized && to.path !== '/setup') {
    return navigateTo('/setup', { replace: true })
  }

  if (initialized && to.path === '/setup') {
    return navigateTo('/login', { replace: true })
  }
})
