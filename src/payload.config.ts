import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Comments } from './collections/Comments'
import { Contexts } from './collections/Contexts'
import { AIDrafts } from './collections/AIDrafts'
import { AIDraftDecisions } from './collections/AIDraftDecisions'
import { CalibrationOutcomes } from './collections/CalibrationOutcomes'
import { Examples } from './collections/Examples'
import { GenerationJobs } from './collections/GenerationJobs'
import { ImportBatches } from './collections/ImportBatches'
import { ImportBatchItems } from './collections/ImportBatchItems'
import { Reviews } from './collections/Reviews'
import { Sources } from './collections/Sources'
import { Terms } from './collections/Terms'
import { Translations } from './collections/Translations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    Categories,
    Contexts,
    Terms,
    Translations,
    Sources,
    Examples,
    Reviews,
    ImportBatches,
    ImportBatchItems,
    GenerationJobs,
    AIDrafts,
    AIDraftDecisions,
    CalibrationOutcomes,
    Comments,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    push: false,
  }),
  sharp,
  plugins: [],
})
