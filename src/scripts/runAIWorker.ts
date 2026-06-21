import 'dotenv/config'

import { getPayload } from 'payload'

import { runNextGenerationJob } from '../ai/pipeline/jobs'
import { DeterministicAIProvider } from '../ai/providers/deterministic'

const { default: config } = await import('../payload.config')
const payload = await getPayload({ config })

try {
  const result = await runNextGenerationJob({
    payload,
    provider: new DeterministicAIProvider(),
  })

  payload.logger.info(
    result
      ? `Generation job ${result.job.id} finished worker run with ${result.outcome}.`
      : 'No deterministic generation job is ready.',
  )
} finally {
  await payload.destroy()
}
