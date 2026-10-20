<script setup lang="ts">
const colorOptions = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
  'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink',
  'rose', 'slate', 'gray', 'zinc', 'neutral', 'stone'
]

const state = reactive({
  collectiveName: '',
  primaryColor: 'orange',
  neutralColor: 'neutral',
  adminName: '',
  adminEmail: '',
  adminPassword: '',
  confirmPassword: ''
})

const error = ref('')
const loading = ref(false)

async function onSubmit() {
  error.value = ''

  if (state.adminPassword !== state.confirmPassword) {
    error.value = 'As senhas não conferem'
    return
  }

  loading.value = true
  try {
    await $fetch('/api/setup', {
      method: 'POST',
      body: {
        collectiveName: state.collectiveName,
        primaryColor: state.primaryColor,
        neutralColor: state.neutralColor,
        adminName: state.adminName,
        adminEmail: state.adminEmail,
        adminPassword: state.adminPassword
      }
    })

    const { fetchMe } = useAuth()
    await fetchMe()
    await navigateTo('/admin')
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
            v-model="state.collectiveName"
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
              v-model="state.primaryColor"
              :items="colorOptions"
              required
            />
          </UFormField>

          <UFormField
            label="Cor neutra"
            required
          >
            <USelect
              v-model="state.neutralColor"
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
            v-model="state.adminName"
            placeholder="Seu nome"
            required
          />
        </UFormField>

        <UFormField
          label="E-mail do administrador"
          required
        >
          <UInput
            v-model="state.adminEmail"
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
            v-model="state.adminPassword"
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
            v-model="state.confirmPassword"
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
