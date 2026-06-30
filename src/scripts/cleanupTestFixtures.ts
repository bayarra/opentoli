import 'dotenv/config'

import config from '@/payload.config'
import { getPayload } from 'payload'

const suffixPattern = /(?:\s|-)(?:\d+-)?\d{13}$/
const termPrefixes = [
  'api v1 published term ',
  'authentication ',
  'blocked public feedback ',
  'calibration term ',
  'contribution term ',
  'execution test ',
  'existing import term ',
  'human resolved block ',
  'new import alpha ',
  'new import beta ',
  'optional reference removal ',
  'private test term ',
  'proposal term ',
  'public draft term ',
  'public feedback visibility ',
  'published editor term ',
  'published integration term ',
  'reference management ',
  'simple editing ',
  'simple hidden draft ',
  'simple publishing ',
  'source management ',
  'source removal closes public ',
  'unsafe public feedback ',
  'workflow term ',
] as const
const categoryPrefixes = [
  'accessibility-technology-',
  'ai-execution-',
  'ai-integration-',
  'api-v1-category-',
  'calibration-category-',
  'contribution-category-',
  'editor-jobs-',
  'editor-technology-',
  'import-category-',
  'integration-test-',
  'm4-integration-',
  'proposal-category-',
  'term-editor-category-',
] as const
const batchPrefixes = ['Editor job batch ', 'Web import '] as const

const isFixtureTerm = (value: string) =>
  suffixPattern.test(value) && termPrefixes.some((prefix) => value.startsWith(prefix))
const isFixtureCategory = (value: string) =>
  suffixPattern.test(value) && categoryPrefixes.some((prefix) => value.startsWith(prefix))
const isFixtureBatch = (value: string) =>
  suffixPattern.test(value) && batchPrefixes.some((prefix) => value.startsWith(prefix))
const relationId = (value: unknown): number | null => {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'number' ? id : null
  }
  return null
}
const relationIds = (value: unknown): number[] =>
  Array.isArray(value)
    ? value.map(relationId).filter((id): id is number => typeof id === 'number')
    : []

const payload = await getPayload({ config: await config })
const apply = process.env.APPLY_TEST_FIXTURE_CLEANUP === 'true' || process.argv.includes('--apply')

try {
  const [termsResult, jobsResult, draftsResult, batchesResult, categoriesResult, contextsResult] =
    await Promise.all([
      payload.find({ collection: 'terms', depth: 0, draft: true, limit: 10_000, overrideAccess: true }),
      payload.find({ collection: 'generation-jobs', depth: 0, limit: 10_000, overrideAccess: true }),
      payload.find({ collection: 'ai-drafts', depth: 0, limit: 10_000, overrideAccess: true }),
      payload.find({ collection: 'import-batches', depth: 0, limit: 10_000, overrideAccess: true }),
      payload.find({ collection: 'categories', depth: 0, limit: 10_000, overrideAccess: true }),
      payload.find({ collection: 'contexts', depth: 0, limit: 10_000, overrideAccess: true }),
    ])
  const categories = categoriesResult.docs.filter((category) => isFixtureCategory(category.slug))
  const categoryIds = new Set(categories.map((category) => category.id))
  const terms = termsResult.docs.filter(
    (term) =>
      isFixtureTerm(term.headwordEn) ||
      relationIds(term.categories).some((categoryId) => categoryIds.has(categoryId)),
  )
  const termIds = new Set(terms.map((term) => term.id))
  const jobs = jobsResult.docs.filter(
    (job) =>
      isFixtureTerm(job.inputHeadword) || categoryIds.has(relationId(job.category) || -1),
  )
  const jobIds = new Set(jobs.map((job) => job.id))
  const drafts = draftsResult.docs.filter(
    (draft) =>
      isFixtureTerm(draft.inputHeadword) ||
      termIds.has(relationId(draft.term) || -1) ||
      jobIds.has(relationId(draft.generationJob) || -1),
  )
  for (const draft of drafts) {
    const jobId = relationId(draft.generationJob)
    if (jobId) jobIds.add(jobId)
  }
  const draftIds = new Set(drafts.map((draft) => draft.id))
  const batches = batchesResult.docs.filter((batch) => isFixtureBatch(batch.name))
  const batchIds = new Set(batches.map((batch) => batch.id))
  const contexts = contextsResult.docs.filter(
    (context) =>
      (suffixPattern.test(context.slug) && context.slug.startsWith('term-context-')) ||
      categoryIds.has(relationId(context.category) || -1),
  )

  console.log(`Fixture terms: ${terms.length}`)
  for (const term of terms) console.log(`- ${term.id}: ${term.headwordEn}`)
  console.log(`Related drafts/jobs: ${draftIds.size}/${jobIds.size}`)
  console.log(`Fixture batches/categories/contexts: ${batchIds.size}/${categoryIds.size}/${contexts.length}`)
  if (!apply) {
    console.log('Preview only. Re-run with --apply to delete these known test fixtures.')
    process.exitCode = 0
  } else {
    const [comments, outcomes, decisions, reviews, examples, references, translations, items] =
      await Promise.all([
        payload.find({ collection: 'comments', depth: 0, limit: 10_000, overrideAccess: true }),
        payload.find({ collection: 'calibration-outcomes', depth: 0, limit: 10_000, overrideAccess: true }),
        payload.find({ collection: 'ai-draft-decisions', depth: 0, limit: 10_000, overrideAccess: true }),
        payload.find({ collection: 'reviews', depth: 0, limit: 10_000, overrideAccess: true }),
        payload.find({ collection: 'examples', depth: 0, limit: 10_000, overrideAccess: true }),
        payload.find({ collection: 'sources', depth: 0, limit: 10_000, overrideAccess: true }),
        payload.find({ collection: 'translations', depth: 0, limit: 10_000, overrideAccess: true }),
        payload.find({ collection: 'import-batch-items', depth: 0, limit: 10_000, overrideAccess: true }),
      ])
    const translationIds = new Set(
      translations.docs.filter((item) => termIds.has(relationId(item.term) || -1)).map((item) => item.id),
    )

    for (const item of comments.docs.filter((item) => termIds.has(relationId(item.term) || -1) || draftIds.has(relationId(item.aiDraft) || -1))) await payload.delete({ collection: 'comments', id: item.id, overrideAccess: true })
    for (const item of outcomes.docs.filter((item) => termIds.has(relationId(item.term) || -1) || draftIds.has(relationId(item.aiDraft) || -1) || jobIds.has(relationId(item.generationJob) || -1))) await payload.delete({ collection: 'calibration-outcomes', id: item.id, overrideAccess: true })
    for (const item of decisions.docs.filter((item) => draftIds.has(relationId(item.aiDraft) || -1) || termIds.has(relationId(item.resultingTerm) || -1))) await payload.delete({ collection: 'ai-draft-decisions', id: item.id, overrideAccess: true })
    for (const item of reviews.docs.filter((item) => termIds.has(relationId(item.term) || -1) || translationIds.has(relationId(item.translation) || -1))) await payload.delete({ collection: 'reviews', id: item.id, overrideAccess: true })
    for (const item of examples.docs.filter((item) => termIds.has(relationId(item.term) || -1))) await payload.delete({ collection: 'examples', id: item.id, overrideAccess: true })
    for (const item of references.docs.filter((item) => termIds.has(relationId(item.term) || -1))) await payload.delete({ collection: 'sources', id: item.id, overrideAccess: true })
    for (const item of items.docs.filter((item) => termIds.has(relationId(item.term) || -1) || jobIds.has(relationId(item.generationJob) || -1) || batchIds.has(relationId(item.importBatch) || -1))) await payload.delete({ collection: 'import-batch-items', id: item.id, overrideAccess: true })
    for (const draft of drafts) await payload.delete({ collection: 'ai-drafts', id: draft.id, overrideAccess: true })
    for (const jobId of jobIds) await payload.delete({ collection: 'generation-jobs', id: jobId, overrideAccess: true })
    for (const item of translations.docs.filter((item) => translationIds.has(item.id))) await payload.delete({ collection: 'translations', id: item.id, overrideAccess: true })
    for (const term of terms) await payload.delete({ collection: 'terms', id: term.id, overrideAccess: true })
    for (const batch of batches) await payload.delete({ collection: 'import-batches', id: batch.id, overrideAccess: true })
    for (const context of contexts) await payload.delete({ collection: 'contexts', id: context.id, overrideAccess: true })
    for (const category of categories) await payload.delete({ collection: 'categories', id: category.id, overrideAccess: true })
    console.log('Known leaked test fixtures removed.')
  }
} finally {
  await payload.destroy()
}

process.exit(process.exitCode || 0)
