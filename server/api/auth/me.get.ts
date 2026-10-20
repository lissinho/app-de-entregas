export default defineEventHandler(async (event) => {
  const session = await getAppSession(event)
  if (!session.data.userId) {
    return { user: null }
  }
  const user = await getUserById(session.data.userId)
  return { user }
})
