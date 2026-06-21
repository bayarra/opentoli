import { createHash } from 'node:crypto'

import type { AiDraft, GenerationJob } from '@/payload-types'
import type { Payload } from 'payload'

import {
  AIOutputValidationError,
  AI_SCHEMA_VERSION,
  validateCritiqueOutputV1,
  validateGenerationOutputV1,
  validateResearchPacketV1,
} from '../schemas/v1'
import type { AIProvider, PreparationInput, ValidatedProviderOutputs } from '../providers/types'
import { routeAIDraft } from './riskRouting'

type JobOutcome = 'completed' | 'failed' | 'not_due' | 'retry_scheduled'

export type ProcessGenerationJobResult = {
  draft?: AiDraft
  job: GenerationJob
  outcome: JobOutcome
}

export type EnqueueGenerationJobResult = {
  created: boolean
  job: GenerationJob
}

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, stableValue(nested)]),
    )
  }
  return value
}

export const createGenerationIdempotencyKey = (
  preparation: PreparationInput,
  provider: AIProvider,
): string => {
  const identity = {
    preparation: {
      ...preparation,
      headwordEn: preparation.headwordEn.trim().toLocaleLowerCase('en-US'),
      sources: [...preparation.sources].sort((left, right) => left.id - right.id),
    },
    provider: provider.metadata,
    schemaVersion: AI_SCHEMA_VERSION,
  }

  return createHash('sha256')
    .update(JSON.stringify(stableValue(identity)))
    .digest('hex')
}

const findJobByKey = async (payload: Payload, idempotencyKey: string) => {
  const existing = await payload.find({
    collection: 'generation-jobs',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { idempotencyKey: { equals: idempotencyKey } },
  })
  return existing.docs[0]
}

export const enqueueGenerationJob = async ({
  maxAttempts = 3,
  payload,
  preparation,
  provider,
}: {
  maxAttempts?: number
  payload: Payload
  preparation: PreparationInput
  provider: AIProvider
}): Promise<EnqueueGenerationJobResult> => {
  const idempotencyKey = createGenerationIdempotencyKey(preparation, provider)
  const existing = await findJobByKey(payload, idempotencyKey)
  if (existing) return { created: false, job: existing }

  const queuedAt = new Date().toISOString()
  try {
    const job = await payload.create({
      collection: 'generation-jobs',
      data: {
        attemptCount: 0,
        category: preparation.category.id,
        context: preparation.context?.id,
        critiquePromptVersion: provider.metadata.critiquePromptVersion,
        generationPromptVersion: provider.metadata.generationPromptVersion,
        idempotencyKey,
        inputHeadword: preparation.headwordEn,
        inputPayload: {
          category: preparation.category,
          context: preparation.context,
          headwordEn: preparation.headwordEn,
          sourceIds: preparation.sources.map((source) => source.id),
          termId: preparation.termId,
        },
        maxAttempts,
        modelName: provider.metadata.modelName,
        modelProvider: provider.metadata.provider,
        queuedAt,
        researchPromptVersion: provider.metadata.researchPromptVersion,
        schemaVersion: AI_SCHEMA_VERSION,
        sourceInputSnapshot: { sources: preparation.sources },
        stage: 'research',
        status: 'queued',
      },
      depth: 0,
      overrideAccess: true,
    })
    return { created: true, job }
  } catch (error) {
    const racedJob = await findJobByKey(payload, idempotencyKey)
    if (racedJob) return { created: false, job: racedJob }
    throw error
  }
}

const readPreparation = (job: GenerationJob): PreparationInput => {
  if (
    !job.inputPayload ||
    typeof job.inputPayload !== 'object' ||
    Array.isArray(job.inputPayload)
  ) {
    throw new Error('Generation job inputPayload must be an object.')
  }
  if (
    !job.sourceInputSnapshot ||
    typeof job.sourceInputSnapshot !== 'object' ||
    Array.isArray(job.sourceInputSnapshot)
  ) {
    throw new Error('Generation job sourceInputSnapshot must be an object.')
  }

  const input = job.inputPayload as Record<string, unknown>
  const snapshot = job.sourceInputSnapshot as Record<string, unknown>
  const category = input.category
  const context = input.context
  const sources = snapshot.sources

  if (!category || typeof category !== 'object' || Array.isArray(category)) {
    throw new Error('Generation job category snapshot is missing.')
  }
  if (!Array.isArray(sources)) throw new Error('Generation job source snapshot is missing.')

  return {
    category: category as PreparationInput['category'],
    context:
      context && typeof context === 'object' && !Array.isArray(context)
        ? (context as PreparationInput['context'])
        : undefined,
    headwordEn: String(input.headwordEn || job.inputHeadword),
    sources: sources as PreparationInput['sources'],
    termId: typeof input.termId === 'number' ? input.termId : undefined,
  }
}

const assertProviderMatchesJob = (job: GenerationJob, provider: AIProvider): void => {
  const expected = provider.metadata
  if (
    job.modelProvider !== expected.provider ||
    job.modelName !== expected.modelName ||
    job.researchPromptVersion !== expected.researchPromptVersion ||
    job.generationPromptVersion !== expected.generationPromptVersion ||
    job.critiquePromptVersion !== expected.critiquePromptVersion
  ) {
    throw new Error('The worker provider does not match the generation job provenance.')
  }
}

const findDraftForJob = async (payload: Payload, jobId: number): Promise<AiDraft | undefined> => {
  const result = await payload.find({
    collection: 'ai-drafts',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { generationJob: { equals: jobId } },
  })
  return result.docs[0]
}

const claimJob = async (
  payload: Payload,
  job: GenerationJob,
): Promise<GenerationJob | undefined> => {
  const result = await payload.update({
    collection: 'generation-jobs',
    data: {
      attemptCount: job.attemptCount + 1,
      errorCode: null,
      errorMessage: null,
      nextRetryAt: null,
      status: 'running',
    },
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [{ id: { equals: job.id } }, { status: { equals: job.status } }],
    },
  })
  return result.docs[0]
}

type GenerationJobUpdate = Partial<
  Pick<
    GenerationJob,
    | 'completedAt'
    | 'critiqueRawOutput'
    | 'errorCode'
    | 'errorMessage'
    | 'estimatedCostUsd'
    | 'generationRawOutput'
    | 'inputTokens'
    | 'latencyMs'
    | 'nextRetryAt'
    | 'outputTokens'
    | 'researchRawOutput'
    | 'stage'
    | 'status'
    | 'validationErrors'
  >
>

const usageUpdate = (
  job: GenerationJob,
  usage?: {
    estimatedCostUsd?: number
    inputTokens?: number
    outputTokens?: number
  },
): GenerationJobUpdate => ({
  estimatedCostUsd: (job.estimatedCostUsd || 0) + (usage?.estimatedCostUsd || 0),
  inputTokens: (job.inputTokens || 0) + (usage?.inputTokens || 0),
  outputTokens: (job.outputTokens || 0) + (usage?.outputTokens || 0),
})

const persistStage = async (
  payload: Payload,
  id: number,
  data: GenerationJobUpdate,
): Promise<GenerationJob> =>
  payload.update({
    collection: 'generation-jobs',
    data,
    depth: 0,
    id,
    overrideAccess: true,
  })

const completeDraft = async ({
  job,
  outputs,
  payload,
  preparation,
  provider,
}: {
  job: GenerationJob
  outputs: ValidatedProviderOutputs
  payload: Payload
  preparation: PreparationInput
  provider: AIProvider
}): Promise<AiDraft> => {
  const existing = await findDraftForJob(payload, job.id)
  if (existing) return existing

  return payload.create({
    collection: 'ai-drafts',
    data: {
      confidenceDimensions: outputs.generation.confidenceDimensions,
      critiquePayload: outputs.critique,
      generatedBy: `${provider.metadata.provider}:${provider.metadata.modelName}`,
      generatedPayload: outputs.generation,
      generationJob: job.id,
      inputCategory: preparation.category.id,
      inputContext: preparation.context?.id,
      inputHeadword: preparation.headwordEn,
      modelName: provider.metadata.modelName,
      modelProvider: provider.metadata.provider,
      promptVersion: [
        provider.metadata.researchPromptVersion,
        provider.metadata.generationPromptVersion,
        provider.metadata.critiquePromptVersion,
      ].join('|'),
      publicVisibility: 'private',
      researchPayload: outputs.research,
      reviewRoute: outputs.generation.reviewRoute,
      riskLevel: outputs.generation.riskLevel,
      schemaVersion: AI_SCHEMA_VERSION,
      sources: preparation.sources.map((source) => source.id),
      status: 'needs_review',
      term: preparation.termId,
    },
    depth: 0,
    overrideAccess: true,
  })
}

const classifyError = (error: unknown) => ({
  code: error instanceof AIOutputValidationError ? 'VALIDATION_ERROR' : 'PROCESSING_ERROR',
  issues:
    error instanceof AIOutputValidationError
      ? error.issues
      : [error instanceof Error ? error.message : 'Unknown generation error.'],
  message: error instanceof Error ? error.message : 'Unknown generation error.',
})

export const processGenerationJob = async ({
  now = new Date(),
  payload,
  provider,
  retryDelayMs = 1_000,
  jobId,
}: {
  jobId: number
  now?: Date
  payload: Payload
  provider: AIProvider
  retryDelayMs?: number
}): Promise<ProcessGenerationJobResult> => {
  let job = await payload.findByID({
    collection: 'generation-jobs',
    depth: 0,
    id: jobId,
    overrideAccess: true,
  })

  const existingDraft = await findDraftForJob(payload, job.id)
  if (job.status === 'completed' && existingDraft) {
    return { draft: existingDraft, job, outcome: 'completed' }
  }
  if (job.status === 'completed') {
    assertProviderMatchesJob(job, provider)
    const preparation = readPreparation(job)
    const research = validateResearchPacketV1(job.researchRawOutput)
    const generation = validateGenerationOutputV1(job.generationRawOutput)
    const critique = validateCritiqueOutputV1(job.critiqueRawOutput)
    const draft = await completeDraft({
      job,
      outputs: { critique, generation, research },
      payload,
      preparation,
      provider,
    })
    return { draft, job, outcome: 'completed' }
  }
  if (job.status === 'retry_scheduled' && job.nextRetryAt && new Date(job.nextRetryAt) > now) {
    return { job, outcome: 'not_due' }
  }
  if (!['queued', 'retry_scheduled'].includes(job.status)) {
    throw new Error(`Generation job ${job.id} is not available for processing.`)
  }

  assertProviderMatchesJob(job, provider)
  const claimed = await claimJob(payload, job)
  if (!claimed) throw new Error(`Generation job ${job.id} was claimed by another worker.`)
  job = claimed

  const preparation = readPreparation(job)
  const startedAt = Date.now()

  try {
    let research = job.researchRawOutput
      ? validateResearchPacketV1(job.researchRawOutput)
      : undefined
    if (!research) {
      const result = await provider.research({ preparation })
      research = validateResearchPacketV1(result.output)
      job = await persistStage(payload, job.id, {
        researchRawOutput: research,
        stage: 'generation',
        ...usageUpdate(job, result.usage),
      })
    }

    let generation = job.generationRawOutput
      ? validateGenerationOutputV1(job.generationRawOutput)
      : undefined
    if (!generation) {
      const result = await provider.generate({ preparation, research })
      generation = validateGenerationOutputV1(result.output)
      job = await persistStage(payload, job.id, {
        generationRawOutput: generation,
        stage: 'critique',
        ...usageUpdate(job, result.usage),
      })
    }

    let critique = job.critiqueRawOutput
      ? validateCritiqueOutputV1(job.critiqueRawOutput)
      : undefined
    if (!critique) {
      const result = await provider.critique({ generation, preparation, research })
      critique = validateCritiqueOutputV1(result.output)
      job = await persistStage(payload, job.id, {
        critiqueRawOutput: critique,
        stage: 'validation',
        ...usageUpdate(job, result.usage),
      })
    }

    const route = routeAIDraft({ critique, generation, preparation, research })
    generation = validateGenerationOutputV1({ ...generation, ...route })
    job = await persistStage(payload, job.id, {
      critiqueRawOutput: critique,
      generationRawOutput: generation,
      latencyMs: Date.now() - startedAt,
      researchRawOutput: research,
      stage: 'routing',
      validationErrors: [],
    })

    job = await persistStage(payload, job.id, {
      completedAt: new Date().toISOString(),
      status: 'completed',
    })
    const draft = await completeDraft({
      job,
      outputs: { critique, generation, research },
      payload,
      preparation,
      provider,
    })

    return { draft, job, outcome: 'completed' }
  } catch (error) {
    const details = classifyError(error)
    const canRetry = job.attemptCount < job.maxAttempts
    job = await persistStage(payload, job.id, {
      errorCode: details.code,
      errorMessage: details.message,
      nextRetryAt: canRetry ? new Date(now.getTime() + retryDelayMs).toISOString() : null,
      status: canRetry ? 'retry_scheduled' : 'failed',
      validationErrors: details.issues,
    })
    return { job, outcome: canRetry ? 'retry_scheduled' : 'failed' }
  }
}

export const retryGenerationJobNow = async ({
  jobId,
  payload,
}: {
  jobId: number
  payload: Payload
}): Promise<GenerationJob> => {
  const job = await payload.findByID({
    collection: 'generation-jobs',
    depth: 0,
    id: jobId,
    overrideAccess: true,
  })
  if (job.status === 'completed' || job.status === 'cancelled') {
    throw new Error(`Generation job ${job.id} cannot be retried from status ${job.status}.`)
  }
  if (job.attemptCount >= job.maxAttempts) {
    throw new Error(`Generation job ${job.id} has no attempts remaining.`)
  }

  return persistStage(payload, job.id, {
    nextRetryAt: new Date().toISOString(),
    status: 'retry_scheduled',
  })
}

export const runNextGenerationJob = async ({
  payload,
  provider,
}: {
  payload: Payload
  provider: AIProvider
}): Promise<ProcessGenerationJobResult | undefined> => {
  const now = new Date()
  const queued = await payload.find({
    collection: 'generation-jobs',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    sort: 'queuedAt',
    where: {
      or: [
        { status: { equals: 'queued' } },
        {
          and: [
            { status: { equals: 'retry_scheduled' } },
            { nextRetryAt: { less_than_equal: now.toISOString() } },
          ],
        },
      ],
    },
  })
  const job = queued.docs[0]
  if (!job) return undefined

  return processGenerationJob({ jobId: job.id, now, payload, provider })
}
