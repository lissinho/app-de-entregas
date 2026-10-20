<script setup lang="ts">
definePageMeta({
  middleware: ['deliverer']
})

const toast = useToast()
const { data, pending, refresh } = await useFetch('/api/deliveries', { server: false })
const deliveries = computed(() => data.value?.deliveries ?? [])

const statusLabel: Record<DeliveryStatus, string> = {
  pending: 'Pendente',
  assigned: 'Atribuída',
  in_progress: 'Em andamento',
  delivered: 'Entregue',
  cancelled: 'Cancelada'
}

const nextStatus: Record<DeliveryStatus, DeliveryStatus | null> = {
  pending: null,
  assigned: 'in_progress',
  in_progress: 'delivered',
  delivered: null,
  cancelled: null
}

async function advance(delivery: Delivery) {
  const next = nextStatus[delivery.status]
  if (!next) return

  try {
    await $fetch(`/api/deliveries/${delivery.id}`, {
      method: 'PATCH',
      body: { status: next }
    })
    await refresh()
    toast.add({ title: 'Status atualizado', color: 'success' })
  } catch (err: unknown) {
    toast.add({ title: getApiErrorMessage(err) || 'Erro ao atualizar', color: 'error' })
  }
}

const actionLabel: Record<DeliveryStatus, string> = {
  pending: 'Aguardando atribuição',
  assigned: 'Iniciar entrega',
  in_progress: 'Marcar entregue',
  delivered: 'Concluída',
  cancelled: 'Cancelada'
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">
      Minhas entregas
    </h1>

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
        { accessorKey: 'deliveryAddress', header: 'Endereço' },
        { accessorKey: 'status', header: 'Status', cell: ({ row }) => statusLabel[row.getValue('status') as DeliveryStatus] },
        { accessorKey: 'price', header: 'Valor', cell: ({ row }) => `R$ ${Number(row.getValue('price')).toFixed(2)}` },
        { id: 'actions',
          header: 'Ação',
          cell: ({ row }) => h('button', {
            class: 'inline-flex items-center rounded px-2 py-1 text-xs font-medium bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed',
            disabled: !nextStatus[row.original.status],
            onClick: () => advance(row.original)
          }, () => actionLabel[row.original.status]) }
      ]"
    />
  </div>
</template>
