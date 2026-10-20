<script setup lang="ts">
definePageMeta({
  middleware: ['admin']
})

const toast = useToast()
const { data, pending, refresh } = await useFetch('/api/users/deliverers', { server: false })
const deliverers = computed(() => data.value?.deliverers ?? [])

const showCreateModal = ref(false)
const createState = reactive({
  name: '',
  email: '',
  password: '',
  phone: '',
  vehicleType: ''
})
const creating = ref(false)

async function createDeliverer() {
  creating.value = true
  try {
    await $fetch('/api/users/deliverers', {
      method: 'POST',
      body: { ...createState }
    })
    showCreateModal.value = false
    Object.assign(createState, { name: '', email: '', password: '', phone: '', vehicleType: '' })
    await refresh()
    toast.add({ title: 'Entregador criado', color: 'success' })
  } catch (err: unknown) {
    toast.add({ title: getApiErrorMessage(err) || 'Erro ao criar', color: 'error' })
  } finally {
    creating.value = false
  }
}

async function toggleActive(deliverer: Deliverer) {
  try {
    await $fetch(`/api/users/deliverers/${deliverer.id}`, {
      method: 'PATCH',
      body: { active: !deliverer.active }
    })
    await refresh()
    toast.add({ title: 'Status atualizado', color: 'success' })
  } catch (err: unknown) {
    toast.add({ title: getApiErrorMessage(err) || 'Erro ao atualizar', color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">
        Entregadores
      </h1>
      <UButton
        color="primary"
        icon="lucide:plus"
        @click="showCreateModal = true"
      >
        Novo entregador
      </UButton>
    </div>

    <USkeleton
      v-if="pending"
      class="h-32"
    />
    <UTable
      v-else
      :data="deliverers"
      :columns="[
        { accessorKey: 'user.name', header: 'Nome' },
        { accessorKey: 'user.email', header: 'E-mail' },
        { accessorKey: 'phone', header: 'Telefone' },
        { accessorKey: 'vehicleType', header: 'Veículo' },
        { accessorKey: 'active', header: 'Ativo', cell: ({ row }) => row.getValue('active') ? 'Sim' : 'Não' },
        { id: 'actions',
          header: 'Ações',
          cell: ({ row }) => h('div', { class: 'flex gap-2' }, [
            h(resolveComponent('UButton'), {
              size: 'xs',
              variant: 'ghost',
              color: row.original.active ? 'error' : 'success',
              onClick: () => toggleActive(row.original)
            }, () => row.original.active ? 'Desativar' : 'Ativar')
          ]) }
      ]"
    />

    <UModal v-model:open="showCreateModal">
      <UCard>
        <template #header>
          <h2 class="font-semibold">
            Novo entregador
          </h2>
        </template>

        <form
          class="space-y-4"
          @submit.prevent="createDeliverer"
        >
          <UFormField
            label="Nome"
            required
          >
            <UInput
              v-model="createState.name"
              required
            />
          </UFormField>

          <UFormField
            label="E-mail"
            required
          >
            <UInput
              v-model="createState.email"
              type="email"
              required
            />
          </UFormField>

          <UFormField
            label="Senha"
            required
          >
            <UInput
              v-model="createState.password"
              type="password"
              required
            />
          </UFormField>

          <UFormField label="Telefone">
            <UInput v-model="createState.phone" />
          </UFormField>

          <UFormField label="Veículo">
            <UInput
              v-model="createState.vehicleType"
              placeholder="Ex: bike, moto"
            />
          </UFormField>

          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              @click="showCreateModal = false"
            >
              Cancelar
            </UButton>
            <UButton
              type="submit"
              color="primary"
              :loading="creating"
            >
              Criar
            </UButton>
          </div>
        </form>
      </UCard>
    </UModal>
  </div>
</template>
