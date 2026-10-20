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

const { usuario, buscarMe, logout } = useAutenticacao()
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
    <UHeader>
      <template #left>
        <NuxtLink
          to="/"
          class="focus-visible:outline-3 outline-primary/25 rounded-md p-1 -ms-1"
        >
          <AppLogo class="w-auto h-6 shrink-0" />
        </NuxtLink>
      </template>

      <template #right>
        <div class="flex items-center gap-2">
          <UColorModeButton />

          <ClientOnly>
            <UDropdownMenu
              v-if="usuario"
              :items="[
                { label: usuario.nome, type: 'label' },
                { label: 'Painel', to: usuario.perfil === 'admin' ? '/admin' : '/entregador', icon: 'lucide:layout-dashboard' },
                { label: 'Sair', icon: 'lucide:log-out', onSelect: logout }
              ]"
            >
              <UButton
                variant="ghost"
                color="neutral"
                icon="lucide:user"
              />
            </UDropdownMenu>
            <UButton
              v-else
              to="/login"
              variant="ghost"
              color="neutral"
              icon="lucide:log-in"
            >
              Entrar
            </UButton>
          </ClientOnly>
        </div>
      </template>
    </UHeader>

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
