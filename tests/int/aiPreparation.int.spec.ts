import {
  AI_SCHEMA_VERSION,
  validateCritiqueOutputV1,
  validateGenerationOutputV1,
  validateResearchPacketV1,
} from '@/ai/schemas/v1'
import config from '@/payload.config'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let payload: Payload
let categoryId: number
const generationJobIds: number[] = []
const aiDraftIds: number[] = []
const suffix = `${process.pid}-${Date.now()}`

const researchPayload = {
  ambiguities: ['The term can refer to a process or a protocol step.'],
  canonicalMeaning: 'Verification that a claimed identity is genuine.',
  confusedTerms: ['authorization'],
  domainMeanings: ['Identity verification in software security.'],
  existingMongolianUsage: [],
  headwordEn: `authentication ${suffix}`,
  reviewerQuestions: ['Is the noun form natural in general technical writing?'],
  schemaVersion: AI_SCHEMA_VERSION,
  sourceIds: [],
}

const confidenceDimensions = {
  ambiguity: 'low' as const,
  conceptUnderstanding: 'high' as const,
  domainAccuracy: 'medium' as const,
  sourceSupport: 'medium' as const,
  translationNaturalness: 'medium' as const,
}

const generatedPayload = {
  alternativeTranslations: [
    {
      context: 'software security',
      translationMn: 'alternative authentication wording',
      type: 'alternative' as const,
    },
  ],
  categories: ['Technology & Software'],
  confidenceDimensions,
  contexts: ['software security'],
  examples: [
    {
      exampleEn: 'The service requires authentication.',
      exampleMn: 'The service requires identity verification.',
    },
  ],
  explanationEn: 'The process of verifying a claimed identity.',
  explanationMn: 'A Mongolian explanation prepared for integration testing.',
  headwordEn: `authentication ${suffix}`,
  humanReviewRequired: true as const,
  recommendedTranslationMn: 'recommended authentication wording',
  relatedTerms: ['authorization'],
  reviewerQuestions: ['Should a more established professional form be preferred?'],
  reviewRoute: 'language_review' as const,
  riskLevel: 'medium' as const,
  schemaVersion: AI_SCHEMA_VERSION,
  searchKeywords: ['identity', 'login'],
}

const critiqueCheck = { assessment: 'pass' as const, notes: [] as string[] }
const critiquePayload = {
  blockingIssues: [],
  checks: {
    literalTranslationArtifacts: critiqueCheck,
    mongolianNaturalness: { assessment: 'warning' as const, notes: ['Human review required.'] },
    semanticAccuracy: critiqueCheck,
    sourceQuality: critiqueCheck,
    terminologyConflicts: critiqueCheck,
    unsupportedClaims: critiqueCheck,
  },
  recommendedReviewRoute: 'language_review' as const,
  recommendedRiskLevel: 'medium' as const,
  requiredExpertise: ['language' as const],
  schemaVersion: AI_SCHEMA_VERSION,
  summary: 'The concept is clear; the Mongolian wording requires language review.',
}

const createQueuedJob = async (idempotencyKey: string) => {
  const job = await payload.create({
    collection: 'generation-jobs',
    data: {
      category: categoryId,
      critiquePromptVersion: 'critique.v1',
      generationPromptVersion: 'generation.v1',
      idempotencyKey,
      inputHeadword: `authentication ${suffix}`,
      inputPayload: { headwordEn: `authentication ${suffix}` },
      attemptCount: 0,
      maxAttempts: 3,
      modelName: 'deterministic-test-model',
      modelProvider: 'test',
      queuedAt: new Date().toISOString(),
      researchPromptVersion: 'research.v1',
      schemaVersion: AI_SCHEMA_VERSION,
      sourceInputSnapshot: { sources: [] },
      stage: 'research' as const,
      status: 'queued' as const,
    },
    overrideAccess: true,
  })
  generationJobIds.push(job.id)
  return job
}

const completeJob = async (id: number) =>
  payload.update({
    collection: 'generation-jobs',
    data: {
      critiqueRawOutput: critiquePayload,
      generationRawOutput: generatedPayload,
      researchRawOutput: researchPayload,
      status: 'completed',
      validationErrors: [],
    },
    id,
    overrideAccess: true,
  })

describe('AI preparation foundation', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    const category = await payload.create({
      collection: 'categories',
      data: {
        displayOrder: 999,
        isActive: true,
        nameEn: `AI integration category ${suffix}`,
        nameMn: `AI integration category ${suffix}`,
        slug: `ai-integration-${suffix}`,
      },
      overrideAccess: true,
    })
    categoryId = category.id
  })

  afterAll(async () => {
    for (const id of aiDraftIds.reverse()) {
      await payload.delete({ collection: 'ai-drafts', id, overrideAccess: true })
    }
    for (const id of generationJobIds.reverse()) {
      await payload.delete({ collection: 'generation-jobs', id, overrideAccess: true })
    }
    if (categoryId) {
      await payload.delete({ collection: 'categories', id: categoryId, overrideAccess: true })
    }
  })

  it('validates the versioned research, generation, and critique contracts', () => {
    expect(validateResearchPacketV1(researchPayload)).toEqual(researchPayload)
    expect(validateGenerationOutputV1(generatedPayload)).toEqual(generatedPayload)
    expect(validateCritiqueOutputV1(critiquePayload)).toEqual(critiquePayload)

    expect(() =>
      validateGenerationOutputV1({ ...generatedPayload, humanReviewRequired: false }),
    ).toThrow('humanReviewRequired must be true')
  })

  it('persists complete provenance while keeping jobs and AI drafts private', async () => {
    const job = await createQueuedJob(`ai-foundation-${suffix}`)
    const completedJob = await completeJob(job.id)

    expect(completedJob.status).toBe('completed')
    expect(completedJob.stage).toBe('complete')
    expect(completedJob.completedAt).toBeTruthy()

    const draft = await payload.create({
      collection: 'ai-drafts',
      data: {
        confidenceDimensions,
        critiquePayload,
        generatedBy: 'integration-test-pipeline',
        generatedPayload,
        generationJob: job.id,
        inputCategory: categoryId,
        inputHeadword: `authentication ${suffix}`,
        modelName: 'deterministic-test-model',
        modelProvider: 'test',
        promptVersion: 'ai-preparation.v1',
        publicVisibility: 'private',
        researchPayload,
        reviewRoute: 'language_review',
        riskLevel: 'medium',
        schemaVersion: AI_SCHEMA_VERSION,
        status: 'needs_review',
      },
      overrideAccess: true,
    })
    aiDraftIds.push(draft.id)

    await expect(
      payload.find({
        collection: 'generation-jobs',
        overrideAccess: false,
        where: { id: { equals: job.id } },
      }),
    ).rejects.toThrow('not allowed')
    await expect(
      payload.find({
        collection: 'ai-drafts',
        overrideAccess: false,
        where: { id: { equals: draft.id } },
      }),
    ).rejects.toThrow('not allowed')
    expect(draft.status).toBe('needs_review')
  })

  it('enforces idempotency and retry invariants', async () => {
    const idempotencyKey = `duplicate-${suffix}`
    await createQueuedJob(idempotencyKey)

    await expect(createQueuedJob(idempotencyKey)).rejects.toThrow()
    await expect(
      payload.create({
        collection: 'generation-jobs',
        data: {
          attemptCount: 3,
          category: categoryId,
          critiquePromptVersion: 'critique.v1',
          generationPromptVersion: 'generation.v1',
          idempotencyKey: `invalid-retry-${suffix}`,
          inputHeadword: `authentication ${suffix}`,
          inputPayload: { headwordEn: `authentication ${suffix}` },
          maxAttempts: 3,
          modelName: 'deterministic-test-model',
          modelProvider: 'test',
          nextRetryAt: new Date().toISOString(),
          queuedAt: new Date().toISOString(),
          researchPromptVersion: 'research.v1',
          schemaVersion: AI_SCHEMA_VERSION,
          sourceInputSnapshot: { sources: [] },
          stage: 'research',
          status: 'retry_scheduled',
        },
        overrideAccess: true,
      }),
    ).rejects.toThrow('no attempts remaining')
  })

  it('rejects invalid structured output before an AI draft is stored', async () => {
    const job = await createQueuedJob(`invalid-draft-${suffix}`)
    await completeJob(job.id)

    await expect(
      payload.create({
        collection: 'ai-drafts',
        data: {
          confidenceDimensions,
          critiquePayload,
          generatedBy: 'integration-test-pipeline',
          generatedPayload: { ...generatedPayload, humanReviewRequired: false },
          generationJob: job.id,
          inputCategory: categoryId,
          inputHeadword: `authentication ${suffix}`,
          modelName: 'deterministic-test-model',
          modelProvider: 'test',
          promptVersion: 'ai-preparation.v1',
          publicVisibility: 'private',
          researchPayload,
          reviewRoute: 'language_review',
          riskLevel: 'medium',
          schemaVersion: AI_SCHEMA_VERSION,
          status: 'needs_review',
        },
        overrideAccess: true,
      }),
    ).rejects.toThrow('humanReviewRequired must be true')
  })
})
