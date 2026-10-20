import type { Coletivo } from '~/types'

export const useColetivo = () => {
  const coletivo = useState<Coletivo | null | undefined>('coletivo', () => undefined)

  async function buscarColetivo() {
    const { coletivo: obtido } = await $fetch<{ coletivo: Coletivo | null }>('/api/coletivo')
    coletivo.value = obtido
    return obtido
  }

  return {
    coletivo: readonly(coletivo),
    buscarColetivo
  }
}
