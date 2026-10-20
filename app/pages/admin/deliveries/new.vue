<script setup lang="ts">
definePageMeta({
  middleware: ['admin']
})

const toast = useToast()
const router = useRouter()

const { data: deliverersData } = await useFetch('/api/users/deliverers', { server: false })
const deliverers = computed(() => deliverersData.value?.deliverers ?? [])

const { data: categoriesData } = await useFetch('/api/volume-categories', { server: false })
const categories = computed(() => categoriesData.value?.categories ?? [])

const state = reactive({
  customerName: '',
  customerPhone: '',
  pickupAddress: '',
  deliveryAddress: '',
  volumeCategory: '',
  delivererId: undefined as number | undefined
})

const loading = ref(false)
const isOpen = ref(true)

watch(isOpen, (value) => {
  if (!value) {
    router.back()
  }
})

const delivererOptions = computed(() =>
  deliverers.value
    .filter(d => d.active)
    .map(d => ({ label: d.user?.name || `Entregador #${d.id}`, value: d.id }))
)

const categoryOptions = computed(() =>
  categories.value.map(c => ({ label: `${c.label} (fator ${c.factor})`, value: c.key }))
)

async function onSubmit() {
  loading.value = true
  try {
    await $fetch('/api/deliveries', {
      method: 'POST',
      body: {
        customerName: state.customerName,
        customerPhone: state.customerPhone,
        pickupAddress: state.pickupAddress,
        deliveryAddress: state.deliveryAddress,
        volumeCategory: state.volumeCategory,
        delivererId: state.delivererId
      }
    })
    toast.add({ title: 'Entrega criada', color: 'success' })
    await navigateTo('/admin/deliveries')
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
            v-model="state.customerName"
            required
          />
        </UFormField>

        <UFormField label="Telefone do cliente">
          <UInput v-model="state.customerPhone" />
        </UFormField>

        <UFormField
          label="Endereço de retirada"
          hint="Deixe em branco para usar o endereço base do coletivo"
        >
          <UInput
            v-model="state.pickupAddress"
            placeholder="Rua, número, bairro, cidade"
          />
        </UFormField>

        <UFormField
          label="Endereço de entrega"
          required
        >
          <UInput
            v-model="state.deliveryAddress"
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
              v-model="state.volumeCategory"
              :items="categoryOptions"
              value-key="value"
              label-key="label"
              required
            />
          </UFormField>

          <UFormField label="Entregador">
            <USelect
              v-model="state.delivererId"
              :items="delivererOptions"
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
