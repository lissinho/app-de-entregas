<script setup lang="ts">
definePageMeta({
  middleware: ['entregador']
})

const { data, pending } = await useFetch('/api/entregas', { server: false })
const entregas = computed(() => data.value?.entregas ?? [])

const entregues = computed(() => entregas.value.filter(e => e.status === 'entregue'))

const ganhos = computed(() => ({
  totalEntregues: entregues.value.length,
  valorEntregues: entregues.value.reduce((soma, e) => soma + e.preco, 0),
  taxaColetivo: entregues.value.reduce((soma, e) => soma + e.taxaPlataforma, 0),
  totalCobradoCliente: entregues.value.reduce((soma, e) => soma + e.precoFinal, 0)
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
          {{ ganhos.totalEntregues }}
        </div>
      </UCard>

      <UCard>
        <div class="text-sm text-muted">
          Valor das entregas
        </div>
        <div class="text-3xl font-bold">
          R$ {{ ganhos.valorEntregues.toFixed(2) }}
        </div>
      </UCard>

      <UCard>
        <div class="text-sm text-muted">
          Taxa do coletivo
        </div>
        <div class="text-3xl font-bold">
          R$ {{ ganhos.taxaColetivo.toFixed(2) }}
        </div>
      </UCard>

      <UCard>
        <div class="text-sm text-muted">
          Total cobrado do cliente
        </div>
        <div class="text-3xl font-bold">
          R$ {{ ganhos.totalCobradoCliente.toFixed(2) }}
        </div>
      </UCard>
    </div>
  </div>
</template>
