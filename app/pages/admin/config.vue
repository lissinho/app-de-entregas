<script setup lang="ts">
definePageMeta({
  middleware: ['admin']
})

const { fetchCollective, collective } = useCollective()
const toast = useToast()

const { data: categoriesData, refresh: refreshCategories } = await useFetch('/api/volume-categories')
const categories = computed(() => categoriesData.value?.categories ?? [])

const colorOptions = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
  'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink',
  'rose', 'slate', 'gray', 'zinc', 'neutral', 'stone'
]

const loading = ref(false)
const savingCategories = ref(false)

const state = reactive({
  name: '',
  primaryColor: 'orange',
  neutralColor: 'neutral',
  baseAddress: '',
  deliveryRadiusKm: 10,
  basePrice: 0,
  pricePerKm: 0,
  platformFeeType: 'percent' as PlatformFeeType,
  platformFeeValue: 0
})

watchEffect(() => {
  if (collective.value) {
    state.name = collective.value.name
    state.primaryColor = collective.value.primaryColor
    state.neutralColor = collective.value.neutralColor
    state.baseAddress = collective.value.baseAddress || ''
    state.deliveryRadiusKm = collective.value.deliveryRadiusKm
    state.basePrice = collective.value.basePrice
    state.pricePerKm = collective.value.pricePerKm
    state.platformFeeType = collective.value.platformFeeType
    state.platformFeeValue = collective.value.platformFeeValue
  }
})

async function onSubmit() {
  loading.value = true
  try {
    await $fetch('/api/collective', {
      method: 'PATCH',
      body: {
        name: state.name,
        primaryColor: state.primaryColor,
        neutralColor: state.neutralColor,
        baseAddress: state.baseAddress,
        deliveryRadiusKm: state.deliveryRadiusKm,
        basePrice: state.basePrice,
        pricePerKm: state.pricePerKm,
        platformFeeType: state.platformFeeType,
        platformFeeValue: state.platformFeeValue
      }
    })
    await fetchCollective()
    toast.add({ title: 'Configurações salvas', color: 'success' })
  } catch (err: unknown) {
    toast.add({ title: getApiErrorMessage(err) || 'Erro ao salvar', color: 'error' })
  } finally {
    loading.value = false
  }
}

const editableCategories = ref<{ key: string, label: string, factor: number }[]>([])

watch(categories, (list) => {
  editableCategories.value = list.map(c => ({ key: c.key, label: c.label, factor: c.factor }))
}, { immediate: true })

function addCategory() {
  editableCategories.value.push({ key: `cat-${Date.now()}`, label: '', factor: 1 })
}

function removeCategory(index: number) {
  editableCategories.value.splice(index, 1)
}

async function saveCategories() {
  savingCategories.value = true
  try {
    await $fetch('/api/volume-categories', {
      method: 'PATCH',
      body: { categories: editableCategories.value }
    })
    await refreshCategories()
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
            v-model="state.name"
            required
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField
            label="Cor primária"
            required
          >
            <USelect
              v-model="state.primaryColor"
              :items="colorOptions"
              required
            />
          </UFormField>

          <UFormField
            label="Cor neutra"
            required
          >
            <USelect
              v-model="state.neutralColor"
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
            v-model="state.baseAddress"
            placeholder="Rua, número, bairro, cidade"
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField
            label="Raio de entrega (km)"
            required
          >
            <UInput
              v-model.number="state.deliveryRadiusKm"
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
              v-model.number="state.basePrice"
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
              v-model.number="state.pricePerKm"
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
                v-model="state.platformFeeType"
                :items="[{ label: 'Percentual', value: 'percent' }, { label: 'Fixo', value: 'fixed' }]"
                class="w-40"
                required
              />
              <UInput
                v-model.number="state.platformFeeValue"
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
          v-for="(category, index) in editableCategories"
          :key="category.key"
          class="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-end"
        >
          <UFormField label="Identificador">
            <UInput v-model="category.key" />
          </UFormField>

          <UFormField label="Nome">
            <UInput v-model="category.label" />
          </UFormField>

          <UFormField label="Fator">
            <UInput
              v-model.number="category.factor"
              type="number"
              min="0"
              step="0.01"
            />
          </UFormField>

          <UButton
            color="error"
            variant="ghost"
            icon="lucide:trash"
            @click="removeCategory(index)"
          />
        </div>

        <div class="flex gap-2">
          <UButton
            variant="outline"
            icon="lucide:plus"
            @click="addCategory"
          >
            Adicionar categoria
          </UButton>
          <UButton
            color="primary"
            :loading="savingCategories"
            @click="saveCategories"
          >
            Salvar categorias
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>
