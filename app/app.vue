<script setup>
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'pt-BR'
  }
})

const description = 'Um aplicativo de entregas eficiente e fácil de usar.'

useSeoMeta({
  title: 'Aplicativo de Entregas',
  description,
  ogTitle: 'Aplicativo de Entregas',
  ogDescription: description,
  ogImage: 'https://ui.nuxt.com/assets/templates/nuxt/starter-light.png',
  twitterCard: 'summary_large_image'
})

useHead({
  titleTemplate: '%s · Aplicativo de Entregas'
})

const { buscarMe } = useAutenticacao()
const { buscarColetivo } = useColetivo()
const appConfig = useAppConfig()

onMounted(async () => {
  await buscarMe()
  const c = await buscarColetivo()
  if (c) {
    appConfig.ui.colors.primary = c.corPrimaria
    appConfig.ui.colors.neutral = c.corNeutra
    useHead({
      titleTemplate: `%s · ${c.nome}`
    })
  }
})
</script>

<template>
  <UApp>
    <UMain>
      <NuxtPage />
    </UMain>

    <UFooter>
      <p class="text-sm text-muted">
        Núcleo de Tecnologia MTST © {{ new Date().getFullYear() }}
      </p>
    </UFooter>
  </UApp>
</template>
