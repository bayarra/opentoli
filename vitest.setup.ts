// Any setup scripts you might need go here

// Load .env files
import 'dotenv/config'

import { resolveTestDatabaseUrl } from './src/testing/database'

process.env.DATABASE_URL = resolveTestDatabaseUrl()
