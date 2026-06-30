import 'dotenv/config'

import { getPayload } from 'payload'

import { loadM5Manifest, type M5Manifest, type M5Source, type M5Term } from '../calibration/m5Manifest'
import { enqueueGenerationJob } from '../ai/pipeline/jobs'
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

type CliOptions = {
  all: boolean
  limit?: number
  offset: number
}

const parseIntegerArg = (name: string): number | undefined => {
  const prefix = `--${name}=`
  const environmentName = `M5_${name.toUpperCase()}`
  const raw =
    process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ||
    process.env[environmentName]
  if (!raw) return undefined

  const value = Number(raw)
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`--${name} or ${environmentName} must be a non-negative integer.`)
  }
  return value
}

const parseCliOptions = (manifest: M5Manifest): CliOptions => {
  const all = process.argv.includes('--all') || process.env.M5_ALL === 'true'
  const offset = parseIntegerArg('offset') ?? 0
  const limit = all ? undefined : (parseIntegerArg('limit') ?? manifest.runPolicy.firstBatchSize)

  if (offset >= manifest.terms.length) {
    throw new Error(`--offset must be less than ${manifest.terms.length}.`)
  }
  if (limit !== undefined && limit < 1) throw new Error('--limit must be at least 1.')

  return { all, limit, offset }
}

const byPriority = (left: M5Term, right: M5Term) => left.priority - right.priority

const selectedTerms = (manifest: M5Manifest, options: CliOptions): M5Term[] => {
  const terms = [...manifest.terms].sort(byPriority)
  const limit = options.limit ?? terms.length - options.offset
  return terms.slice(options.offset, options.offset + limit)
}

const createDraftTermData = (term: M5Term, categoryId: number) => ({
  categories: [categoryId],
  explanationEn:
    'M5 calibration placeholder. The AI preparation pipeline must create the sourced explanation.',
  explanationMn:
    'M5 calibration placeholder. Human review is required before any Mongolian wording is published.',
  headwordEn: term.headwordEn,
  reviewStatus: 'ai_draft' as const,
  shortDefinitionEn: `M5 calibration candidate for ${term.headwordEn}.`,
  usageNoteEn: [
    `M5 calibration item ${term.priority}.`,
    `Subcategory: ${term.subcategory}.`,
    `Context: ${term.context}.`,
    term.notes ? `Note: ${term.notes}` : '',
  ]
    .filter(Boolean)
    .join(' '),
  workflowStatus: 'draft' as const,
})

const referenceData = (source: M5Source, termId: number, headwordEn: string) => ({
  excerptNote: `M5 calibration source for ${headwordEn}. Use for concept grounding only; do not copy definitions verbatim.`,
  licenseNote: source.licenseNote,
  publisher: source.publisher,
  sourceType: source.sourceType,
  term: termId,
  title: source.title,
  url: source.url,
})

const { default: config } = await import('../payload.config')
const manifest = await loadM5Manifest()
const options = parseCliOptions(manifest)
const slice = selectedTerms(manifest, options)

const provider = createConfiguredAIProvider()
const payload = await getPayload({ config })

let createdJobs = 0
let createdSources = 0
let createdTerms = 0
let reusedJobs = 0
let reusedSources = 0
let reusedTerms = 0

try {
  const categories = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: manifest.categorySlug } },
  })
  const category = categories.docs[0]
  if (!category) {
    throw new Error(`Category "${manifest.categorySlug}" is missing. Run npm run seed first.`)
  }

  const batchName = manifest.name
  const existingBatch = await payload.find({
    collection: 'import-batches',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { name: { equals: batchName } },
  })
  const batchData = {
    acceptedRows: slice.length,
    category: category.id,
    modelName: provider.metadata.modelName,
    inputMode: 'manifest' as const,
    name: batchName,
    promptVersion: [
      provider.metadata.researchPromptVersion,
      provider.metadata.generationPromptVersion,
      provider.metadata.critiquePromptVersion,
    ].join('|'),
    rejectedRows: 0,
    schemaVersion: '1.0.0',
    sourceTitle: 'data/calibration/m5-technology-software.json',
    status: 'pending' as const,
    totalRows: manifest.terms.length,
    validationReport: {
      preparedCount: slice.length,
      preparedPriorities: slice.map((term) => term.priority),
      provider: provider.metadata.provider,
      runMode: 'enqueue_only',
    },
  }

  if (existingBatch.docs[0]) {
    await payload.update({
      collection: 'import-batches',
      data: batchData,
      depth: 0,
      id: existingBatch.docs[0].id,
      overrideAccess: true,
    })
  } else {
    await payload.create({
      collection: 'import-batches',
      data: batchData,
      depth: 0,
      overrideAccess: true,
    })
  }

  const sourceById = new Map(manifest.sources.map((source) => [source.id, source]))

  for (const termInput of slice) {
    const existingTerm = await payload.find({
      collection: 'terms',
      depth: 0,
      draft: true,
      limit: 1,
      overrideAccess: true,
      where: {
        normalizedHeadwordEn: {
          equals: termInput.headwordEn.trim().toLocaleLowerCase('en-US'),
        },
      },
    })

    const term = existingTerm.docs[0]
      ? existingTerm.docs[0]
      : await payload.create({
          collection: 'terms',
          data: createDraftTermData(termInput, category.id),
          depth: 0,
          draft: true,
          overrideAccess: true,
        })

    if (existingTerm.docs[0]) reusedTerms += 1
    else createdTerms += 1

    const sources = []
    for (const sourceRef of termInput.sourceRefs || []) {
      const source = sourceById.get(sourceRef)
      if (!source) throw new Error(`Unknown source ref "${sourceRef}" for ${termInput.headwordEn}.`)

      const existingSource = await payload.find({
        collection: 'sources',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        where: {
          and: [{ term: { equals: term.id } }, { url: { equals: source.url } }],
        },
      })

      const sourceRecord = existingSource.docs[0]
        ? await payload.update({
            collection: 'sources',
            data: referenceData(source, term.id, termInput.headwordEn),
            depth: 0,
            id: existingSource.docs[0].id,
            overrideAccess: true,
          })
        : await payload.create({
            collection: 'sources',
            data: referenceData(source, term.id, termInput.headwordEn),
            depth: 0,
            overrideAccess: true,
          })

      if (existingSource.docs[0]) reusedSources += 1
      else createdSources += 1
      sources.push({
        id: sourceRecord.id,
        publisher: sourceRecord.publisher,
        sourceType: sourceRecord.sourceType,
        title: sourceRecord.title,
        url: sourceRecord.url,
      })
    }

    const queued = await enqueueGenerationJob({
      payload,
      preparation: {
        category: { id: category.id, nameEn: category.nameEn, slug: category.slug },
        headwordEn: termInput.headwordEn,
        sources,
        termId: term.id,
      },
      provider,
    })

    if (queued.created) createdJobs += 1
    else reusedJobs += 1
  }

  payload.logger.info(
    `Prepared ${slice.length} M5 calibration terms; ` +
      `terms created/reused ${createdTerms}/${reusedTerms}; ` +
      `references created/reused ${createdSources}/${reusedSources}; ` +
      `jobs created/reused ${createdJobs}/${reusedJobs}. ` +
      'No AI provider calls were made. Run npm run ai:work to process one queued job.',
  )
} finally {
  await payload.destroy()
}
