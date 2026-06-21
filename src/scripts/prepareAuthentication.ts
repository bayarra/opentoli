import 'dotenv/config'

import { getPayload } from 'payload'

import { enqueueGenerationJob, processGenerationJob } from '../ai/pipeline/jobs'
import { createConfiguredAIProvider } from '../ai/providers/factory'

const requiredEnvironmentVariables = ['DATABASE_URL', 'PAYLOAD_SECRET'] as const
const missingEnvironmentVariables = requiredEnvironmentVariables.filter(
  (name) => !process.env[name],
)
if (missingEnvironmentVariables.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvironmentVariables.join(', ')}`,
  )
}

const { default: config } = await import('../payload.config')
const payload = await getPayload({ config })

try {
  const terms = await payload.find({
    collection: 'terms',
    depth: 0,
    draft: true,
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: 'authentication' } },
  })
  const term = terms.docs[0]
  if (!term) throw new Error('Run the seed before preparing the authentication AI draft.')

  const categories = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: 'technology-software' } },
  })
  const category = categories.docs[0]
  if (!category) throw new Error('The Technology & Software category is missing.')

  const contexts = await payload.find({
    collection: 'contexts',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: 'software-security' } },
  })
  const context = contexts.docs[0]

  const sourceDocuments = await payload.find({
    collection: 'sources',
    depth: 0,
    limit: 20,
    overrideAccess: true,
    where: { term: { equals: term.id } },
  })
  if (sourceDocuments.docs.length === 0) {
    throw new Error('The authentication term needs at least one source before AI preparation.')
  }

  const provider = createConfiguredAIProvider()
  const queued = await enqueueGenerationJob({
    payload,
    preparation: {
      category: { id: category.id, nameEn: category.nameEn, slug: category.slug },
      context: context ? { id: context.id, nameEn: context.nameEn, slug: context.slug } : undefined,
      headwordEn: term.headwordEn,
      sources: sourceDocuments.docs.map((source) => ({
        id: source.id,
        publisher: source.publisher,
        sourceType: source.sourceType,
        title: source.title,
        url: source.url,
      })),
      termId: term.id,
    },
    provider,
  })
  const result = await processGenerationJob({
    jobId: queued.job.id,
    payload,
    provider,
    retryDelayMs: 0,
  })
  if (result.outcome !== 'completed' || !result.draft) {
    throw new Error(`Authentication preparation ended with status ${result.outcome}.`)
  }

  const unchangedTerm = await payload.findByID({
    collection: 'terms',
    depth: 0,
    draft: true,
    id: term.id,
    overrideAccess: true,
  })
  if (unchangedTerm._status !== term._status) {
    throw new Error('AI preparation changed the Term publication state.')
  }

  payload.logger.info(
    `AI preparation ${queued.created ? 'created' : 'reused'} job ${result.job.id}; ` +
      `draft ${result.draft.id} is ${result.draft.status}/${result.draft.reviewRoute}; ` +
      `Term remained ${unchangedTerm._status}.`,
  )
} finally {
  await payload.destroy()
}
