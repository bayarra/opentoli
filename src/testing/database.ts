export const resolveTestDatabaseUrl = (
  environment: { DATABASE_URL?: string; TEST_DATABASE_URL?: string } = process.env as unknown as {
    DATABASE_URL?: string
    TEST_DATABASE_URL?: string
  },
) => {
  const configured = environment.TEST_DATABASE_URL || environment.DATABASE_URL
  if (!configured) throw new Error('DATABASE_URL or TEST_DATABASE_URL is required for integration tests.')

  const url = new URL(configured)
  const currentName = url.pathname.replace(/^\//, '')
  if (!currentName) throw new Error('The integration-test database name is missing.')

  if (!environment.TEST_DATABASE_URL && !currentName.endsWith('_test')) {
    url.pathname = `/${currentName}_test`
  }
  const testName = url.pathname.replace(/^\//, '')
  if (!testName.endsWith('_test')) {
    throw new Error('TEST_DATABASE_URL must name a database ending in "_test".')
  }
  return url.toString()
}
