export default defineNitroPlugin(async () => {
  try {
    await executarMigracoes()
    console.log('Migrações do banco de dados aplicadas com sucesso')
  } catch (error) {
    console.error('Falha ao aplicar migrações do banco de dados:', error)
    throw error
  }
})
