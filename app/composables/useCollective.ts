import type { Collective } from '~/types'

export const useCollective = () => {
  const collective = useState<Collective | null | undefined>('collective', () => undefined)

  async function fetchCollective() {
    const { collective: fetched } = await $fetch<{ collective: Collective | null }>('/api/collective')
    collective.value = fetched
    return fetched
  }

  return {
    collective: readonly(collective),
    fetchCollective
  }
}
