import { enqueueGenerationJob, processGenerationJob } from '@/ai/pipeline/jobs'
import { routeAIDraft } from '@/ai/pipeline/riskRouting'
import { DeterministicAIProvider } from '@/ai/providers/deterministic'
import type { AIProvider, PreparationInput } from '@/ai/providers/types'
import {
  validateCritiqueOutputV1,
  validateGenerationOutputV1,
  validateResearchPacketV1,
} from '@/ai/schemas/v1'
import config from '@/payload.config'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let payload: Payload
let categoryId: number
let termId: number
let sourceId: number
const jobIds: number[] = []
const draftIds: number[] = []
const suffix = `${process.pid}-${Date.now()}`

const buildPreparation = (): PreparationInput => ({
  category: {
    id: categoryId,
    nameEn: 'Technology & Software',
    slug: 'technology-software',
  },
  headwordEn: `execution test ${suffix}`,
  sources: [
    {
      id: sourceId,
      publisher: 'OpenToli Test Publisher',
      sourceType: 'official_documentation',
      title: 'AI execution integration source',
      url: 'https://example.com/opentoli-ai-execution-test',
    },
  ],
  termId,
})

describe('AI preparation execution', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    const category = await payload.create({
      collection: 'categories',
      data: {
        displayOrder: 999,
        isActive: true,
        nameEn: `AI execution category ${suffix}`,
        nameMn: `AI execution category ${suffix}`,
        slug: `ai-execution-${suffix}`,
      },
      overrideAccess: true,
    })
    categoryId = category.id

    const term = await payload.create({
      collection: 'terms',
      data: {
        categories: [categoryId],
        explanationEn: 'A private term used to verify AI job execution.',
        explanationMn: 'AI execution integration test term.',
        headwordEn: `execution test ${suffix}`,
        reviewStatus: 'not_reviewed',
        shortDefinitionEn: 'A private integration-test term.',
        workflowStatus: 'draft',
      },
      draft: true,
      overrideAccess: true,
    })
    termId = term.id

    const source = await payload.create({
      collection: 'sources',
      data: {
        isVerified: false,
        publisher: 'OpenToli Test Publisher',
        sourceType: 'official_documentation',
        term: termId,
        title: 'AI execution integration source',
        url: 'https://example.com/opentoli-ai-execution-test',
      },
      overrideAccess: true,
    })
    sourceId = source.id
  })

  afterAll(async () => {
    for (const id of [...new Set(draftIds)].reverse()) {
      await payload.delete({ collection: 'ai-drafts', id, overrideAccess: true })
    }
    for (const id of [...new Set(jobIds)].reverse()) {
      await payload.delete({ collection: 'generation-jobs', id, overrideAccess: true })
    }
    if (sourceId) {
      await payload.delete({ collection: 'sources', id: sourceId, overrideAccess: true })
    }
    if (termId) {
      await payload.delete({ collection: 'terms', id: termId, overrideAccess: true })
    }
    if (categoryId) {
      await payload.delete({ collection: 'categories', id: categoryId, overrideAccess: true })
    }
  })

  it('reuses an idempotent job and creates one private needs-review draft', async () => {
    const provider = new DeterministicAIProvider()
    const preparation = buildPreparation()
    const first = await enqueueGenerationJob({ payload, preparation, provider })
    const duplicate = await enqueueGenerationJob({ payload, preparation, provider })
    jobIds.push(first.job.id)

    expect(first.created).toBe(true)
    expect(duplicate.created).toBe(false)
    expect(duplicate.job.id).toBe(first.job.id)

    const processed = await processGenerationJob({
      jobId: first.job.id,
      payload,
      provider,
    })
    expect(processed.outcome).toBe('completed')
    expect(processed.draft?.status).toBe('needs_review')
    expect(processed.draft?.reviewRoute).toBe('language_review')
    expect(provider.calls).toEqual({ critique: 1, generate: 1, research: 1 })
    if (processed.draft) draftIds.push(processed.draft.id)

    const repeated = await processGenerationJob({
      jobId: first.job.id,
      payload,
      provider,
    })
    expect(repeated.draft?.id).toBe(processed.draft?.id)
    expect(provider.calls).toEqual({ critique: 1, generate: 1, research: 1 })

    const unchangedTerm = await payload.findByID({
      collection: 'terms',
      depth: 0,
      draft: true,
      id: termId,
      overrideAccess: true,
    })
    expect(unchangedTerm._status).toBe('draft')
    expect(unchangedTerm.reviewStatus).toBe('not_reviewed')
  })

  it('retains successful research and resumes at the failed stage', async () => {
    const base = new DeterministicAIProvider()
    let generationAttempts = 0
    const provider: AIProvider = {
      critique: (input) => base.critique(input),
      generate: async (input) => {
        generationAttempts += 1
        if (generationAttempts === 1) throw new Error('Temporary generation failure.')
        return base.generate(input)
      },
      metadata: { ...base.metadata, modelName: 'deterministic-flaky-v1' },
      research: async (input) => ({
        ...(await base.research(input)),
        usage: { estimatedCostUsd: 0.01, inputTokens: 7, outputTokens: 3 },
      }),
    }
    const queued = await enqueueGenerationJob({
      payload,
      preparation: buildPreparation(),
      provider,
    })
    jobIds.push(queued.job.id)

    const failedAttempt = await processGenerationJob({
      jobId: queued.job.id,
      payload,
      provider,
      retryDelayMs: 0,
    })
    expect(failedAttempt.outcome).toBe('retry_scheduled')
    expect(failedAttempt.job.researchRawOutput).toBeTruthy()
    expect(failedAttempt.job.inputTokens).toBe(7)
    expect(base.calls.research).toBe(1)

    const retry = await processGenerationJob({
      jobId: queued.job.id,
      now: new Date(Date.now() + 1_000),
      payload,
      provider,
      retryDelayMs: 0,
    })
    expect(retry.outcome).toBe('completed')
    expect(base.calls.research).toBe(1)
    expect(generationAttempts).toBe(2)
    expect(base.calls.critique).toBe(1)
    expect(retry.job.inputTokens).toBe(7)
    if (retry.draft) draftIds.push(retry.draft.id)
  })

  it('recovers a completed job that stopped before draft creation without provider calls', async () => {
    const provider = new DeterministicAIProvider()
    const recoveryProvider: AIProvider = {
      critique: (input) => provider.critique(input),
      generate: (input) => provider.generate(input),
      metadata: { ...provider.metadata, modelName: 'deterministic-recovery-v1' },
      research: (input) => provider.research(input),
    }
    const preparation = buildPreparation()
    const queued = await enqueueGenerationJob({
      payload,
      preparation,
      provider: recoveryProvider,
    })
    jobIds.push(queued.job.id)

    const research = validateResearchPacketV1(
      (await recoveryProvider.research({ preparation })).output,
    )
    const generation = validateGenerationOutputV1(
      (await recoveryProvider.generate({ preparation, research })).output,
    )
    const critique = validateCritiqueOutputV1(
      (await recoveryProvider.critique({ generation, preparation, research })).output,
    )
    await payload.update({
      collection: 'generation-jobs',
      data: {
        critiqueRawOutput: critique,
        generationRawOutput: generation,
        researchRawOutput: research,
        status: 'completed',
      },
      id: queued.job.id,
      overrideAccess: true,
    })
    provider.calls.critique = 0
    provider.calls.generate = 0
    provider.calls.research = 0

    const recovered = await processGenerationJob({
      jobId: queued.job.id,
      payload,
      provider: recoveryProvider,
    })
    expect(recovered.outcome).toBe('completed')
    expect(recovered.draft?.status).toBe('needs_review')
    expect(provider.calls).toEqual({ critique: 0, generate: 0, research: 0 })
    if (recovered.draft) draftIds.push(recovered.draft.id)
  })

  it('routes sourced high-risk terminology to domain review', async () => {
    const provider = new DeterministicAIProvider()
    const preparation = {
      ...buildPreparation(),
      category: {
        id: categoryId,
        nameEn: 'Medicine & Health',
        slug: 'medicine-health',
      },
    }
    const research = validateResearchPacketV1((await provider.research({ preparation })).output)
    const generation = validateGenerationOutputV1(
      (await provider.generate({ preparation, research })).output,
    )
    const critique = validateCritiqueOutputV1(
      (await provider.critique({ generation, preparation, research })).output,
    )

    expect(routeAIDraft({ critique, generation, preparation, research })).toEqual({
      reviewRoute: 'domain_review',
      riskLevel: 'high',
    })
  })
})
