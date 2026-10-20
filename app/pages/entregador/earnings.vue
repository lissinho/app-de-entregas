<script setup lang="ts">
definePageMeta({
  middleware: ['deliverer']
})

const { data, pending } = await useFetch('/api/deliveries', { server: false })
const deliveries = computed(() => data.value?.deliveries ?? [])

const delivered = computed(() => deliveries.value.filter(d => d.status === 'delivered'))

const earnings = computed(() => ({
  totalDeliveries: delivered.value.length,
  totalValue: delivered.value.reduce((sum, d) => sum + d.price, 0),
  totalFees: delivered.value.reduce((sum, d) => sum + d.platformFee, 0),
  totalFinal: delivered.value.reduce((sum, d) => sum + d.finalPrice, 0)
}))
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">
      Ganhos
    </h1>

    <USkeleton
      v-if="pending"
      class="h-32"
    />
    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      <UCard>
        <div class="text-sm text-muted">
          Entregas concluídas
        </div>
        <div class="text-3xl font-bold">
          {{ earnings.totalDeliveries }}
        </div>
      </UCard>

      <UCard>
        <div class="text-sm text-muted">
          Valor das entregas
        </div>
        <div class="text-3xl font-bold">
          R$ {{ earnings.totalValue.toFixed(2) }}
        </div>
      </UCard>

      <UCard>
        <div class="text-sm text-muted">
          Taxa do coletivo
        </div>
        <div class="text-3xl font-bold">
          R$ {{ earnings.totalFees.toFixed(2) }}
        </div>
      </UCard>

      <UCard>
        <div class="text-sm text-muted">
          Total cobrado do cliente
        </div>
        <div class="text-3xl font-bold">
          R$ {{ earnings.totalFinal.toFixed(2) }}
        </div>
      </UCard>
    </div>
  </div>
</template>
