<script setup lang="ts">
definePageMeta({
  middleware: ['admin']
})

const toast = useToast()
const router = useRouter()

const { data: entregadoresData } = await useFetch('/api/entregadores', { server: false })
const entregadores = computed(() => entregadoresData.value?.entregadores ?? [])

const { data: categoriasData } = await useFetch('/api/categorias-de-volume', { server: false })
const categorias = computed(() => categoriasData.value?.categorias ?? [])

const state = reactive({
  nomeCliente: '',
  telefoneCliente: '',
  enderecoRetirada: '',
  enderecoEntrega: '',
  categoriaVolume: '',
  entregadorId: undefined as number | undefined
})

const loading = ref(false)
const isOpen = ref(true)

watch(isOpen, (value) => {
  if (!value) {
    router.back()
  }
})

const opcoesEntregadores = computed(() =>
  entregadores.value
    .filter(e => e.ativo)
    .map(e => ({ label: e.usuario?.nome || `Entregador #${e.id}`, value: e.id }))
)

const opcoesCategorias = computed(() =>
  categorias.value.map(c => ({ label: `${c.rotulo} (fator ${c.fator})`, value: c.chave }))
)

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
    toast.add({ title: 'Entrega criada', color: 'success' })
    await navigateTo('/admin/entregas')
  } catch (err: unknown) {
    toast.add({ title: getApiErrorMessage(err) || 'Erro ao criar entrega', color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
  >
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
            @click="$router.back()"
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
  </UModal>
</template>
