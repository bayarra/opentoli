import 'dotenv/config'

import { spawnSync } from 'node:child_process'

import { resolveTestDatabaseUrl } from '../testing/database'

const testDatabaseUrl = resolveTestDatabaseUrl()
const packageManagerEntry = process.env.npm_execpath
if (!packageManagerEntry) throw new Error('The package manager entry point is unavailable.')

const environment: NodeJS.ProcessEnv = {
  ...process.env,
  DATABASE_URL: testDatabaseUrl,
  NODE_ENV: 'test' as const,
  TEST_DATABASE_URL: testDatabaseUrl,
}

const runPackageScript = (name: string, args: string[] = []) => {
  const result = spawnSync(process.execPath, [packageManagerEntry, 'run', name, ...args], {
    env: environment,
    stdio: 'inherit',
  })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status || 1)
}

console.log(`Using isolated integration database: ${new URL(testDatabaseUrl).pathname.slice(1)}`)
runPackageScript('payload', ['--', 'migrate'])
runPackageScript('test:int:run')
