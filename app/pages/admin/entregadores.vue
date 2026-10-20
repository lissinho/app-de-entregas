<script setup lang="ts">
definePageMeta({
  middleware: ['admin']
})

const toast = useToast()
const { data, pending, refresh } = await useFetch('/api/entregadores', { server: false })
const entregadores = computed(() => data.value?.entregadores ?? [])

const showCreateModal = ref(false)
const createState = reactive({
  nome: '',
  email: '',
  senha: '',
  telefone: '',
  tipoVeiculo: ''
})
const creating = ref(false)

async function criarEntregador() {
  creating.value = true
  try {
    await $fetch('/api/entregadores', {
      method: 'POST',
      body: { ...createState }
    })
    showCreateModal.value = false
    Object.assign(createState, { nome: '', email: '', senha: '', telefone: '', tipoVeiculo: '' })
    await refresh()
    toast.add({ title: 'Entregador criado', color: 'success' })
  } catch (err: unknown) {
    toast.add({ title: getApiErrorMessage(err) || 'Erro ao criar', color: 'error' })
  } finally {
    creating.value = false
  }
}

async function alternarAtivo(entregador: Entregador) {
  try {
    await $fetch(`/api/entregadores/${entregador.id}`, {
      method: 'PATCH',
      body: { ativo: !entregador.ativo }
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
      :data="entregadores"
      :columns="[
        { accessorKey: 'usuario.nome', header: 'Nome' },
        { accessorKey: 'usuario.email', header: 'E-mail' },
        { accessorKey: 'telefone', header: 'Telefone' },
        { accessorKey: 'tipoVeiculo', header: 'Veículo' },
        { accessorKey: 'ativo', header: 'Ativo', cell: ({ row }) => row.getValue('ativo') ? 'Sim' : 'Não' },
        { id: 'actions',
          header: 'Ações',
          cell: ({ row }) => h('div', { class: 'flex gap-2' }, [
            h(resolveComponent('UButton'), {
              size: 'xs',
              variant: 'ghost',
              color: row.original.ativo ? 'error' : 'success',
              onClick: () => alternarAtivo(row.original)
            }, () => row.original.ativo ? 'Desativar' : 'Ativar')
          ]) }
      ]"
    />

    <UModal v-model:open="showCreateModal">
      <template #content>
        <UCard>
          <template #header>
            <h2 class="font-semibold">
              Novo entregador
            </h2>
          </template>

          <form
            class="space-y-4"
            @submit.prevent="criarEntregador"
          >
            <UFormField
              label="Nome"
              required
            >
              <UInput
                v-model="createState.nome"
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
                v-model="createState.senha"
                type="password"
                required
              />
            </UFormField>

            <UFormField label="Telefone">
              <UInput v-model="createState.telefone" />
            </UFormField>

            <UFormField label="Veículo">
              <UInput
                v-model="createState.tipoVeiculo"
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
      </template>
    </UModal>
  </div>
</template>
