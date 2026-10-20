export function getApiErrorMessage(err: unknown): string {
  if (!err) return 'Erro inesperado'
  if (typeof err === 'string') return err
  if (err instanceof Error) return err.message

  const error = err as { data?: { statusMessage?: string }, statusMessage?: string, message?: string }
  return error.data?.statusMessage || error.statusMessage || error.message || 'Erro inesperado'
}
