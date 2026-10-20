export default defineNuxtPlugin(async () => {
  const appConfig = useAppConfig()
  const { fetchCollective } = useCollective()
  const collective = await fetchCollective()

  if (collective) {
    appConfig.ui.colors.primary = collective.primaryColor
    appConfig.ui.colors.neutral = collective.neutralColor

    useHead({
      titleTemplate: `%s · ${collective.name}`
    })
  }
})
