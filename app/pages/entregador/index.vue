<script setup lang="ts">
definePageMeta({
  middleware: ['entregador']
})

const toast = useToast()
const { data, pending, refresh } = await useFetch('/api/entregas', { server: false })
const entregas = computed(() => data.value?.entregas ?? [])

const rotuloStatus: Record<StatusEntrega, string> = {
  pendente: 'Pendente',
  atribuida: 'Atribuída',
  em_andamento: 'Em andamento',
  entregue: 'Entregue',
  cancelada: 'Cancelada'
}

const proximoStatus: Record<StatusEntrega, StatusEntrega | null> = {
  pendente: null,
  atribuida: 'em_andamento',
  em_andamento: 'entregue',
  entregue: null,
  cancelada: null
}

async function avancar(entrega: Entrega) {
  const proximo = proximoStatus[entrega.status]
  if (!proximo) return

  try {
    await $fetch(`/api/entregas/${entrega.id}`, {
      method: 'PATCH',
      body: { status: proximo }
    })
    await refresh()
    toast.add({ title: 'Status atualizado', color: 'success' })
  } catch (err: unknown) {
    toast.add({ title: getApiErrorMessage(err) || 'Erro ao atualizar', color: 'error' })
  }
}

const rotuloAcao: Record<StatusEntrega, string> = {
  pendente: 'Aguardando atribuição',
  atribuida: 'Iniciar entrega',
  em_andamento: 'Marcar entregue',
  entregue: 'Concluída',
  cancelada: 'Cancelada'
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
      :data="entregas"
      :columns="[
        { accessorKey: 'id', header: 'ID' },
        { accessorKey: 'nomeCliente', header: 'Cliente' },
        { accessorKey: 'enderecoEntrega', header: 'Endereço' },
        { accessorKey: 'status', header: 'Status', cell: ({ row }) => rotuloStatus[row.getValue('status') as StatusEntrega] },
        { accessorKey: 'preco', header: 'Valor', cell: ({ row }) => `R$ ${Number(row.getValue('preco')).toFixed(2)}` },
        { id: 'actions',
          header: 'Ação',
          cell: ({ row }) => h('button', {
            class: 'inline-flex items-center rounded px-2 py-1 text-xs font-medium bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed',
            disabled: !proximoStatus[row.original.status],
            onClick: () => avancar(row.original)
          }, () => rotuloAcao[row.original.status]) }
      ]"
    />
  </div>
</template>
