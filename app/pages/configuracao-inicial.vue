<script setup lang="ts">
const colorOptions = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
  'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink',
  'rose', 'slate', 'gray', 'zinc', 'neutral', 'stone'
]

const state = reactive({
  nomeColetivo: '',
  corPrimaria: 'orange',
  corNeutra: 'neutral',
  nomeAdmin: '',
  emailAdmin: '',
  senhaAdmin: '',
  confirmarSenha: ''
})

const error = ref('')
const loading = ref(false)
const statusConfiguracao = useState<{ inicializado: boolean, coletivo: Coletivo | null }>('status-configuracao')

async function onSubmit() {
  error.value = ''

  if (state.senhaAdmin !== state.confirmarSenha) {
    error.value = 'As senhas não conferem'
    return
  }

  loading.value = true
  try {
    const resultado = await $fetch<{ coletivo: Coletivo, usuario: Usuario }>('/api/configuracao-inicial', {
      method: 'POST',
      body: {
        nomeColetivo: state.nomeColetivo,
        corPrimaria: state.corPrimaria,
        corNeutra: state.corNeutra,
        nomeAdmin: state.nomeAdmin,
        emailAdmin: state.emailAdmin,
        senhaAdmin: state.senhaAdmin
      }
    })

    statusConfiguracao.value = { inicializado: true, coletivo: resultado.coletivo }

    const { buscarMe } = useAutenticacao()
    await buscarMe()
    return navigateTo('/admin')
  } catch (err: unknown) {
    error.value = getApiErrorMessage(err) || 'Erro ao criar coletivo'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-200px)] flex items-center justify-center p-4">
    <UCard class="w-full max-w-lg">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold">
            Bem-vindo! 👋
          </h1>
          <p class="text-muted">
            Configure o coletivo para começar.
          </p>
        </div>
      </template>

      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        class="mb-4"
        :title="error"
      />

      <form
        class="space-y-4"
        @submit.prevent="onSubmit"
      >
        <UFormField
          label="Nome do coletivo"
          required
        >
          <UInput
            v-model="state.nomeColetivo"
            placeholder="Ex: Coletivo Entregas ZL"
            required
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField
            label="Cor primária"
            required
          >
            <USelect
              v-model="state.corPrimaria"
              :items="colorOptions"
              required
            />
          </UFormField>

          <UFormField
            label="Cor neutra"
            required
          >
            <USelect
              v-model="state.corNeutra"
              :items="colorOptions"
              required
            />
          </UFormField>
        </div>

        <hr class="border-border">

        <UFormField
          label="Nome do administrador"
          required
        >
          <UInput
            v-model="state.nomeAdmin"
            placeholder="Seu nome"
            required
          />
        </UFormField>

        <UFormField
          label="E-mail do administrador"
          required
        >
          <UInput
            v-model="state.emailAdmin"
            type="email"
            placeholder="admin@coletivo.org"
            required
          />
        </UFormField>

        <UFormField
          label="Senha"
          required
        >
          <UInput
            v-model="state.senhaAdmin"
            type="password"
            placeholder="Mínimo 6 caracteres"
            required
          />
        </UFormField>

        <UFormField
          label="Confirme a senha"
          required
        >
          <UInput
            v-model="state.confirmarSenha"
            type="password"
            required
          />
        </UFormField>

        <UButton
          type="submit"
          color="primary"
          block
          :loading="loading"
        >
          Criar coletivo
        </UButton>
      </form>
    </UCard>
  </div>
</template>
