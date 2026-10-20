<script setup lang="ts">
const { login, redirecionarPorPerfil, buscarMe } = useAutenticacao()

const state = reactive({
  email: '',
  senha: ''
})
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    const usuario = await login(state.email, state.senha)
    await redirecionarPorPerfil(usuario.perfil)
  } catch (err: unknown) {
    error.value = getApiErrorMessage(err) || 'Erro ao entrar'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const usuario = await buscarMe()
  if (usuario) {
    await redirecionarPorPerfil(usuario.perfil)
  }
})
</script>

<template>
  <div class="min-h-[calc(100vh-200px)] flex items-center justify-center p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold">
            Entrar
          </h1>
          <p class="text-muted">
            Acesse sua conta no aplicativo de entregas.
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
          label="E-mail"
          required
        >
          <UInput
            v-model="state.email"
            type="email"
            required
          />
        </UFormField>

        <UFormField
          label="Senha"
          required
        >
          <UInput
            v-model="state.senha"
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
          Entrar
        </UButton>
      </form>
    </UCard>
  </div>
</template>
