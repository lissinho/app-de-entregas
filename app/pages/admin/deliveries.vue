<script setup lang="ts">
definePageMeta({
  middleware: ['admin']
})

const { data, pending } = await useFetch('/api/deliveries', { server: false })
const deliveries = computed(() => data.value?.deliveries ?? [])

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
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">
        Entregas
      </h1>
      <UButton
        to="/admin/deliveries/new"
        color="primary"
        icon="lucide:plus"
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
      :data="deliveries"
      :columns="[
        { accessorKey: 'id', header: 'ID' },
        { accessorKey: 'customerName', header: 'Cliente' },
        { accessorKey: 'deliveryAddress', header: 'Endereço de entrega' },
        { accessorKey: 'deliverer.user.name', header: 'Entregador' },
        { accessorKey: 'status', header: 'Status', cell: ({ row }) => statusLabel[row.getValue('status') as DeliveryStatus] },
        { accessorKey: 'price', header: 'Valor entrega', cell: ({ row }) => `R$ ${Number(row.getValue('price')).toFixed(2)}` },
        { accessorKey: 'platformFee', header: 'Taxa', cell: ({ row }) => `R$ ${Number(row.getValue('platformFee')).toFixed(2)}` },
        { accessorKey: 'finalPrice', header: 'Total', cell: ({ row }) => `R$ ${Number(row.getValue('finalPrice')).toFixed(2)}` }
      ]"
    />

    <NuxtPage />
  </div>
</template>
