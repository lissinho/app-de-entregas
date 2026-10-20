export default defineEventHandler(async (event) => {
  const sessao = await obterSessaoApp(event)
  if (!sessao.data.usuarioId) {
    return { usuario: null }
  }
  const usuario = await obterUsuarioPorId(sessao.data.usuarioId)
  return { usuario }
})
