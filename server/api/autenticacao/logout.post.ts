export default defineEventHandler(async (event) => {
  const sessao = await obterSessaoApp(event)
  await sessao.clear()
  return { sucesso: true }
})
