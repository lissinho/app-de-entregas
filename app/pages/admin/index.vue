<script setup lang="ts">
definePageMeta({
  middleware: ['admin']
})

const { data: entregasData, pending } = await useFetch('/api/entregas', { server: false })
const entregas = computed(() => entregasData.value?.entregas ?? [])

const estatisticas = computed(() => {
  const all = entregas.value
  return {
    total: all.length,
    pendentes: all.filter(e => e.status === 'pendente').length,
    emAndamento: all.filter(e => e.status === 'em_andamento').length,
    entregues: all.filter(e => e.status === 'entregue').length
  }
})

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
    <h1 class="text-2xl font-bold">
      Painel
    </h1>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard>
        <div class="text-sm text-muted">
          Total de entregas
        </div>
        <div class="text-3xl font-bold">
          {{ estatisticas.total }}
        </div>
      </UCard>

      <UCard>
        <div class="text-sm text-muted">
          Pendentes
        </div>
        <div class="text-3xl font-bold">
          {{ estatisticas.pendentes }}
        </div>
      </UCard>

      <UCard>
        <div class="text-sm text-muted">
          Em andamento
        </div>
        <div class="text-3xl font-bold">
          {{ estatisticas.emAndamento }}
        </div>
      </UCard>

      <UCard>
        <div class="text-sm text-muted">
          Entregues
        </div>
        <div class="text-3xl font-bold">
          {{ estatisticas.entregues }}
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
            to="/admin/entregas"
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
        :data="entregas.slice(0, 5)"
        :columns="[
          { accessorKey: 'nomeCliente', header: 'Cliente' },
          { accessorKey: 'enderecoEntrega', header: 'Endereço' },
          { accessorKey: 'status', header: 'Status', cell: ({ row }) => rotuloStatus[row.getValue('status') as StatusEntrega] },
          { accessorKey: 'precoFinal', header: 'Valor total', cell: ({ row }) => `R$ ${Number(row.getValue('precoFinal')).toFixed(2)}` }
        ]"
      />
    </UCard>
  </div>
</template>
