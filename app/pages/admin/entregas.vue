<script setup lang="ts">
definePageMeta({
  middleware: ['admin']
})

const toast = useToast()
const { data, pending, refresh } = await useFetch('/api/entregas', { server: false })
const entregas = computed(() => data.value?.entregas ?? [])

const { data: entregadoresData } = await useFetch('/api/entregadores', { server: false })
const entregadores = computed(() => entregadoresData.value?.entregadores ?? [])

const { data: categoriasData } = await useFetch('/api/categorias-de-volume', { server: false })
const categorias = computed(() => categoriasData.value?.categorias ?? [])

const modalAberto = ref(false)
const loading = ref(false)

const state = reactive({
  nomeCliente: '',
  telefoneCliente: '',
  enderecoRetirada: '',
  enderecoEntrega: '',
  categoriaVolume: '',
  entregadorId: undefined as number | undefined
})

const opcoesEntregadores = computed(() =>
  entregadores.value
    .filter(e => e.ativo)
    .map(e => ({ label: e.usuario?.nome || `Entregador #${e.id}`, value: e.id }))
)

const opcoesCategorias = computed(() =>
  categorias.value.map(c => ({ label: `${c.rotulo} (fator ${c.fator})`, value: c.chave }))
)

function abrirModal() {
  Object.assign(state, {
    nomeCliente: '',
    telefoneCliente: '',
    enderecoRetirada: '',
    enderecoEntrega: '',
    categoriaVolume: '',
    entregadorId: undefined
  })
  modalAberto.value = true
}

function fecharModal() {
  modalAberto.value = false
}

async function onSubmit() {
  loading.value = true
  try {
    await $fetch('/api/entregas', {
      method: 'POST',
      body: {
        nomeCliente: state.nomeCliente,
        telefoneCliente: state.telefoneCliente,
        enderecoRetirada: state.enderecoRetirada,
        enderecoEntrega: state.enderecoEntrega,
        categoriaVolume: state.categoriaVolume,
        entregadorId: state.entregadorId
      }
    })
    await refresh()
    fecharModal()
    toast.add({ title: 'Entrega criada', color: 'success' })
  } catch (err: unknown) {
    toast.add({ title: getApiErrorMessage(err) || 'Erro ao criar entrega', color: 'error' })
  } finally {
    loading.value = false
  }
}

const rotuloStatus: Record<StatusEntrega, string> = {
  pendente: 'Pendente',
  atribuida: 'Atribuída',
  em_andamento: 'Em andamento',
  entregue: 'Entregue',
  cancelada: 'Cancelada'
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">
        Entregas
      </h1>
      <UButton
        color="primary"
        icon="lucide:plus"
        @click="abrirModal"
      >
        Nova entrega
      </UButton>
    </div>

    <USkeleton
      v-if="pending"
      class="h-32"
    />
    <UTable
      v-else
      :data="entregas"
      :columns="[
        { accessorKey: 'id', header: 'ID' },
        { accessorKey: 'nomeCliente', header: 'Cliente' },
        { accessorKey: 'enderecoEntrega', header: 'Endereço de entrega' },
        { accessorKey: 'entregador.usuario.nome', header: 'Entregador' },
        { accessorKey: 'status', header: 'Status', cell: ({ row }) => rotuloStatus[row.getValue('status') as StatusEntrega] },
        { accessorKey: 'preco', header: 'Valor entrega', cell: ({ row }) => `R$ ${Number(row.getValue('preco')).toFixed(2)}` },
        { accessorKey: 'taxaPlataforma', header: 'Taxa', cell: ({ row }) => `R$ ${Number(row.getValue('taxaPlataforma')).toFixed(2)}` },
        { accessorKey: 'precoFinal', header: 'Total', cell: ({ row }) => `R$ ${Number(row.getValue('precoFinal')).toFixed(2)}` }
      ]"
    />

    <UModal v-model:open="modalAberto">
      <template #content>
        <UCard>
          <template #header>
            <h2 class="font-semibold">
              Nova entrega
            </h2>
          </template>

          <form
            class="space-y-4"
            @submit.prevent="onSubmit"
          >
            <UFormField
              label="Nome do cliente"
              required
            >
              <UInput
                v-model="state.nomeCliente"
                required
              />
            </UFormField>

            <UFormField label="Telefone do cliente">
              <UInput v-model="state.telefoneCliente" />
            </UFormField>

            <UFormField
              label="Endereço de retirada"
              hint="Deixe em branco para usar o endereço base do coletivo"
            >
              <UInput
                v-model="state.enderecoRetirada"
                placeholder="Rua, número, bairro, cidade"
              />
            </UFormField>

            <UFormField
              label="Endereço de entrega"
              required
            >
              <UInput
                v-model="state.enderecoEntrega"
                placeholder="Rua, número, bairro, cidade"
                required
              />
            </UFormField>

            <div class="grid grid-cols-2 gap-4">
              <UFormField
                label="Categoria de volume"
                required
              >
                <USelect
                  v-model="state.categoriaVolume"
                  :items="opcoesCategorias"
                  value-key="value"
                  label-key="label"
                  required
                />
              </UFormField>

              <UFormField label="Entregador">
                <USelect
                  v-model="state.entregadorId"
                  :items="opcoesEntregadores"
                  value-key="value"
                  label-key="label"
                />
              </UFormField>
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <UButton
                variant="ghost"
                @click="fecharModal"
              >
                Cancelar
              </UButton>
              <UButton
                type="submit"
                color="primary"
                :loading="loading"
              >
                Criar entrega
              </UButton>
            </div>
          </form>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
