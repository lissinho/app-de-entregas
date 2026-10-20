<script setup lang="ts">
definePageMeta({
  middleware: ['admin']
})

const { buscarColetivo, coletivo } = useColetivo()
const toast = useToast()

const { data: categoriasData, refresh: recarregarCategorias } = await useFetch('/api/categorias-de-volume')
const categorias = computed(() => categoriasData.value?.categorias ?? [])

const colorOptions = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
  'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink',
  'rose', 'slate', 'gray', 'zinc', 'neutral', 'stone'
]

const loading = ref(false)
const savingCategories = ref(false)

const state = reactive({
  nome: '',
  corPrimaria: 'orange',
  corNeutra: 'neutral',
  enderecoBase: '',
  raioEntregaKm: 10,
  precoBase: 0,
  precoPorKm: 0,
  tipoTaxaPlataforma: 'percentual' as TipoTaxaPlataforma,
  valorTaxaPlataforma: 0
})

watchEffect(() => {
  if (coletivo.value) {
    state.nome = coletivo.value.nome
    state.corPrimaria = coletivo.value.corPrimaria
    state.corNeutra = coletivo.value.corNeutra
    state.enderecoBase = coletivo.value.enderecoBase || ''
    state.raioEntregaKm = coletivo.value.raioEntregaKm
    state.precoBase = coletivo.value.precoBase
    state.precoPorKm = coletivo.value.precoPorKm
    state.tipoTaxaPlataforma = coletivo.value.tipoTaxaPlataforma
    state.valorTaxaPlataforma = coletivo.value.valorTaxaPlataforma
  }
})

async function onSubmit() {
  loading.value = true
  try {
    await $fetch('/api/coletivo', {
      method: 'PATCH',
      body: {
        nome: state.nome,
        corPrimaria: state.corPrimaria,
        corNeutra: state.corNeutra,
        enderecoBase: state.enderecoBase,
        raioEntregaKm: state.raioEntregaKm,
        precoBase: state.precoBase,
        precoPorKm: state.precoPorKm,
        tipoTaxaPlataforma: state.tipoTaxaPlataforma,
        valorTaxaPlataforma: state.valorTaxaPlataforma
      }
    })
    await buscarColetivo()
    toast.add({ title: 'Configurações salvas', color: 'success' })
  } catch (err: unknown) {
    toast.add({ title: getApiErrorMessage(err) || 'Erro ao salvar', color: 'error' })
  } finally {
    loading.value = false
  }
}

const categoriasEditaveis = ref<{ chave: string, rotulo: string, fator: number }[]>([])

watch(categorias, (list) => {
  categoriasEditaveis.value = list.map(c => ({ chave: c.chave, rotulo: c.rotulo, fator: c.fator }))
}, { immediate: true })

function adicionarCategoria() {
  categoriasEditaveis.value.push({ chave: `cat-${Date.now()}`, rotulo: '', fator: 1 })
}

function removerCategoria(index: number) {
  categoriasEditaveis.value.splice(index, 1)
}

async function salvarCategorias() {
  savingCategories.value = true
  try {
    await $fetch('/api/categorias-de-volume', {
      method: 'PATCH',
      body: { categorias: categoriasEditaveis.value }
    })
    await recarregarCategorias()
    toast.add({ title: 'Categorias salvas', color: 'success' })
  } catch (err: unknown) {
    toast.add({ title: getApiErrorMessage(err) || 'Erro ao salvar', color: 'error' })
  } finally {
    savingCategories.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">
      Configurações do coletivo
    </h1>

    <UCard>
      <template #header>
        <h2 class="font-semibold">
          Identidade e preços
        </h2>
      </template>

      <form
        class="space-y-4"
        @submit.prevent="onSubmit"
      >
        <UFormField
          label="Nome do coletivo"
          required
        >
          <UInput
            v-model="state.nome"
            required
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField
            label="Cor primária"
            required
          >
            <USelect
              v-model="state.corPrimaria"
              :items="colorOptions"
              required
            />
          </UFormField>

          <UFormField
            label="Cor neutra"
            required
          >
            <USelect
              v-model="state.corNeutra"
              :items="colorOptions"
              required
            />
          </UFormField>
        </div>

        <UFormField
          label="Endereço base do coletivo"
          hint="Usado para calcular raio de entrega"
        >
          <UInput
            v-model="state.enderecoBase"
            placeholder="Rua, número, bairro, cidade"
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField
            label="Raio de entrega (km)"
            required
          >
            <UInput
              v-model.number="state.raioEntregaKm"
              type="number"
              min="0.1"
              step="0.1"
              required
            />
          </UFormField>

          <UFormField
            label="Preço base (R$)"
            required
          >
            <UInput
              v-model.number="state.precoBase"
              type="number"
              min="0"
              step="0.01"
              required
            />
          </UFormField>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <UFormField
            label="Preço por km (R$)"
            required
          >
            <UInput
              v-model.number="state.precoPorKm"
              type="number"
              min="0"
              step="0.01"
              required
            />
          </UFormField>

          <UFormField
            label="Taxa da plataforma"
            required
          >
            <div class="flex gap-2">
              <USelect
                v-model="state.tipoTaxaPlataforma"
                :items="[{ label: 'Percentual', value: 'percentual' }, { label: 'Fixo', value: 'fixo' }]"
                class="w-40"
                required
              />
              <UInput
                v-model.number="state.valorTaxaPlataforma"
                type="number"
                min="0"
                step="0.01"
                required
              />
            </div>
          </UFormField>
        </div>

        <UButton
          type="submit"
          color="primary"
          :loading="loading"
        >
          Salvar configurações
        </UButton>
      </form>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-semibold">
          Categorias de volume
        </h2>
      </template>

      <div class="space-y-3">
        <div
          v-for="(categoria, index) in categoriasEditaveis"
          :key="categoria.chave"
          class="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-end"
        >
          <UFormField label="Identificador">
            <UInput v-model="categoria.chave" />
          </UFormField>

          <UFormField label="Nome">
            <UInput v-model="categoria.rotulo" />
          </UFormField>

          <UFormField label="Fator">
            <UInput
              v-model.number="categoria.fator"
              type="number"
              min="0"
              step="0.01"
            />
          </UFormField>

          <UButton
            color="error"
            variant="ghost"
            icon="lucide:trash"
            @click="removerCategoria(index)"
          />
        </div>

        <div class="flex gap-2">
          <UButton
            variant="outline"
            icon="lucide:plus"
            @click="adicionarCategoria"
          >
            Adicionar categoria
          </UButton>
          <UButton
            color="primary"
            :loading="savingCategories"
            @click="salvarCategorias"
          >
            Salvar categorias
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>
