<script setup lang="ts">
definePageMeta({
  middleware: ['admin']
})

const { usuario, logout } = useAutenticacao()
const { coletivo } = useColetivo()

const links = [
  { label: 'Painel', to: '/admin', icon: 'lucide:layout-dashboard' },
  { label: 'Configurações', to: '/admin/config', icon: 'lucide:settings' },
  { label: 'Entregadores', to: '/admin/entregadores', icon: 'lucide:users' },
  { label: 'Entregas', to: '/admin/entregas', icon: 'lucide:package' }
]
</script>

<template>
  <ClientOnly>
    <div class="min-h-screen bg-default">
      <div class="border-b border-border bg-card">
        <div class="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <span
              v-if="coletivo"
              class="font-black bg-primary px-2 rounded-2xl"
            >{{ coletivo.nome }}</span>
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
                {{ usuario?.nome }}
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
