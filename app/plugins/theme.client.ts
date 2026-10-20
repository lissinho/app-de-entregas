export default defineNuxtPlugin(async () => {
  const appConfig = useAppConfig()
  const { buscarColetivo } = useColetivo()
  const coletivo = await buscarColetivo()

  if (coletivo) {
    appConfig.ui.colors.primary = coletivo.corPrimaria
    appConfig.ui.colors.neutral = coletivo.corNeutra

    useHead({
      titleTemplate: `%s · ${coletivo.nome}`
    })
  }
})
