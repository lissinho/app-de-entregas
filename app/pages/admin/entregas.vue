<script setup lang="ts">
definePageMeta({
  middleware: ['admin']
})

const { data, pending } = await useFetch('/api/entregas', { server: false })
const entregas = computed(() => data.value?.entregas ?? [])

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
        to="/admin/entregas/nova"
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

    <NuxtPage />
  </div>
</template>
