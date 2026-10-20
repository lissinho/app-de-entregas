export default defineNitroPlugin(async () => {
  try {
    await runMigrations()
    console.log('Database migrations applied successfully')
  } catch (error) {
    console.error('Failed to apply database migrations:', error)
    throw error
  }
})
