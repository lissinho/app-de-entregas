<script setup lang="ts">
definePageMeta({
  middleware: ['admin']
})

const { data: deliveriesData, pending } = await useFetch('/api/deliveries', { server: false })
const deliveries = computed(() => deliveriesData.value?.deliveries ?? [])

const stats = computed(() => {
  const all = deliveries.value
  return {
    total: all.length,
    pending: all.filter(d => d.status === 'pending').length,
    inProgress: all.filter(d => d.status === 'in_progress').length,
    delivered: all.filter(d => d.status === 'delivered').length
  }
})

const statusLabel: Record<DeliveryStatus, string> = {
  pending: 'Pendente',
  assigned: 'Atribuída',
  in_progress: 'Em andamento',
  delivered: 'Entregue',
  cancelled: 'Cancelada'
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">
      Dashboard
    </h1>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard>
        <div class="text-sm text-muted">
          Total de entregas
        </div>
        <div class="text-3xl font-bold">
          {{ stats.total }}
        </div>
      </UCard>

      <UCard>
        <div class="text-sm text-muted">
          Pendentes
        </div>
        <div class="text-3xl font-bold">
          {{ stats.pending }}
        </div>
      </UCard>

      <UCard>
        <div class="text-sm text-muted">
          Em andamento
        </div>
        <div class="text-3xl font-bold">
          {{ stats.inProgress }}
        </div>
      </UCard>

      <UCard>
        <div class="text-sm text-muted">
          Entregues
        </div>
        <div class="text-3xl font-bold">
          {{ stats.delivered }}
        </div>
      </UCard>
    </div>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="font-semibold">
            Entregas recentes
          </h2>
          <UButton
            to="/admin/deliveries"
            color="primary"
            size="sm"
          >
            Ver todas
          </UButton>
        </div>
      </template>

      <USkeleton
        v-if="pending"
        class="h-32"
      />
      <UTable
        v-else
        :data="deliveries.slice(0, 5)"
        :columns="[
          { accessorKey: 'customerName', header: 'Cliente' },
          { accessorKey: 'deliveryAddress', header: 'Endereço' },
          { accessorKey: 'status', header: 'Status', cell: ({ row }) => statusLabel[row.getValue('status') as DeliveryStatus] },
          { accessorKey: 'finalPrice', header: 'Valor total', cell: ({ row }) => `R$ ${Number(row.getValue('finalPrice')).toFixed(2)}` }
        ]"
      />
    </UCard>
  </div>
</template>
