<script setup lang="ts">
definePageMeta({
  middleware: ['deliverer']
})

const { user, logout } = useAuth()
const { collective } = useCollective()

const links = [
  { label: 'Minhas entregas', to: '/entregador', icon: 'lucide:package' },
  { label: 'Ganhos', to: '/entregador/earnings', icon: 'lucide:dollar-sign' }
]
</script>

<template>
  <ClientOnly>
    <div class="min-h-screen bg-default">
      <div class="border-b border-border bg-card">
        <div class="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <AppLogo class="w-auto h-6" />
            <span
              v-if="collective"
              class="font-semibold"
            >{{ collective.name }}</span>
          </div>

          <div class="flex items-center gap-3">
            <UButton
              v-for="link in links"
              :key="link.to"
              :to="link.to"
              variant="ghost"
              color="neutral"
              :icon="link.icon"
            >
              {{ link.label }}
            </UButton>

            <UDropdownMenu
              :items="[
                { label: 'Sair', icon: 'lucide:log-out', onSelect: logout }
              ]"
            >
              <UButton
                variant="ghost"
                color="neutral"
                icon="lucide:user"
              >
                {{ user?.name }}
              </UButton>
            </UDropdownMenu>
          </div>
        </div>
      </div>

      <UMain class="mx-auto max-w-7xl px-4 py-6">
        <NuxtPage />
      </UMain>
    </div>

    <template #fallback>
      <div class="min-h-screen bg-default" />
    </template>
  </ClientOnly>
</template>
