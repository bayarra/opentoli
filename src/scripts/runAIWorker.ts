import 'dotenv/config'

import { getPayload } from 'payload'

import { runNextGenerationJob } from '../ai/pipeline/jobs'
import { createConfiguredAIProvider } from '../ai/providers/factory'

const { default: config } = await import('../payload.config')
const payload = await getPayload({ config })

try {
  const result = await runNextGenerationJob({
    payload,
    provider: createConfiguredAIProvider(),
  })

  payload.logger.info(
    result
      ? `Generation job ${result.job.id} finished worker run with ${result.outcome}.`
      : 'No configured generation job is ready.',
  )
} finally {
  await payload.destroy()
}
