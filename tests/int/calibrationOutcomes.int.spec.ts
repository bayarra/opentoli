import { enqueueGenerationJob, processGenerationJob } from '@/ai/pipeline/jobs'
import { DeterministicAIProvider } from '@/ai/providers/deterministic'
import {
  buildCalibrationRollup,
  isM5CalibrationDraft,
  parseCalibrationOutcomeFields,
  parseDraftQualityFields,
  recordCalibrationOutcome,
} from '@/calibration/outcomes'
import config from '@/payload.config'
import type { AiDraft, User } from '@/payload-types'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let payload: Payload
let editor: User
let contributor: User
let categoryId: number
let termId: number
let sourceId: number
let jobId: number
let draftId: number
const outcomeIds: number[] = []
const suffix = `${process.pid}-${Date.now()}`

const relationId = (value: unknown): number | null => {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'number' ? id : null
  }
  return null
}

describe('M5 calibration outcomes', () => {
  it('maps the compact Review Queue rating and detects immutable M5 provenance', async () => {
    expect(
      parseDraftQualityFields(
        { qualityNotes: '', qualityRating: 'rewritten' },
        42,
        'publish',
      ),
    ).toMatchObject({
      aiDraftId: 42,
      domainAssessment: 'not_checked',
      editLevel: 'rewrite',
      languageAssessment: 'not_checked',
      outcome: 'accepted_with_edits',
    })
    expect(
      parseDraftQualityFields({ qualityRating: 'incorrect' }, 42, 'hide'),
    ).toMatchObject({ editLevel: 'rewrite', outcome: 'rejected' })
    await expect(
      isM5CalibrationDraft({
        generationJob: { inputHeadword: 'cache' },
        inputCategory: { slug: 'technology-software' },
        inputHeadword: 'edited headword',
      } as unknown as AiDraft),
    ).resolves.toBe(true)
  })

  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    editor = await payload.create({
      collection: 'users',
      data: {
        email: `calibration-editor-${suffix}@opentoli.local`,
        name: 'Calibration Editor',
        password: `calibration-editor-${suffix}-password`,
        role: 'reviewer',
      },
      overrideAccess: true,
    })
    contributor = await payload.create({
      collection: 'users',
      data: {
        email: `calibration-contributor-${suffix}@opentoli.local`,
        name: 'Calibration Contributor',
        password: `calibration-contributor-${suffix}-password`,
        role: 'contributor',
      },
      overrideAccess: true,
    })

    const category = await payload.create({
      collection: 'categories',
      data: {
        displayOrder: 992,
        isActive: true,
        nameEn: `Calibration category ${suffix}`,
        nameMn: `Calibration category ${suffix}`,
        slug: `calibration-category-${suffix}`,
      },
      overrideAccess: true,
    })
    categoryId = category.id

    const term = await payload.create({
      collection: 'terms',
      data: {
        categories: [category.id],
        explanationEn: 'A source container for calibration outcome tests.',
        explanationMn: 'Calibration outcome test source container.',
        headwordEn: `calibration term ${suffix}`,
        reviewStatus: 'not_reviewed',
        shortDefinitionEn: 'Used to verify calibration outcome recording.',
        workflowStatus: 'needs_review',
      },
      draft: true,
      overrideAccess: true,
    })
    termId = term.id

    const source = await payload.create({
      collection: 'sources',
      data: {
        publisher: 'OpenToli Calibration Tests',
        sourceType: 'official_documentation',
        term: term.id,
        title: `Calibration source ${suffix}`,
        url: `https://example.com/calibration-${suffix}`,
      },
      overrideAccess: true,
    })
    sourceId = source.id

    const provider = new DeterministicAIProvider()
    const queued = await enqueueGenerationJob({
      payload,
      preparation: {
        category: { id: category.id, nameEn: category.nameEn, slug: category.slug },
        headwordEn: `calibration term ${suffix}`,
        sources: [
          {
            id: source.id,
            publisher: source.publisher,
            sourceType: source.sourceType,
            title: source.title,
            url: source.url,
          },
        ],
        termId: term.id,
      },
      provider,
    })
    jobId = queued.job.id

    const processed = await processGenerationJob({ jobId, payload, provider })
    if (!processed.draft) throw new Error('Calibration test draft was not generated.')
    draftId = processed.draft.id
  })

  afterAll(async () => {
    const outcomes = await payload.find({
      collection: 'calibration-outcomes',
      limit: 20,
      overrideAccess: true,
      where: { aiDraft: { equals: draftId } },
    })
    for (const outcome of outcomes.docs) {
      if (!outcomeIds.includes(outcome.id)) outcomeIds.push(outcome.id)
    }

    for (const id of outcomeIds.reverse()) {
      await payload.delete({ collection: 'calibration-outcomes', id, overrideAccess: true })
    }
    if (draftId) {
      await payload.delete({ collection: 'ai-drafts', id: draftId, overrideAccess: true })
    }
    if (jobId) {
      await payload.delete({ collection: 'generation-jobs', id: jobId, overrideAccess: true })
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
    for (const id of [contributor?.id, editor?.id].filter(Boolean)) {
      await payload.delete({ collection: 'users', id: id as number, overrideAccess: true })
    }
  })

  it('lets Editors record one outcome per draft with safe job evidence', async () => {
    const fields = parseCalibrationOutcomeFields({
      aiDraftId: draftId,
      domainAssessment: 'needs_expert_review',
      editLevel: 'major',
      goNoGoRecommendation: 'tune_prompt',
      languageAssessment: 'major_edits',
      notes: 'The candidate is useful, but the English/Mongolian explanation needs substantial human editing.',
      outcome: 'accepted_with_edits',
    })

    await expect(
      recordCalibrationOutcome({ actor: contributor, fields, payload }),
    ).rejects.toThrow('Editor access')

    const created = await recordCalibrationOutcome({ actor: editor, fields, payload })
    outcomeIds.push(created.id)

    expect(relationId(created.aiDraft)).toBe(draftId)
    expect(relationId(created.generationJob)).toBe(jobId)
    expect(relationId(created.reviewedBy)).toBe(editor.id)
    expect(created).toMatchObject({
      editLevel: 'major',
      goNoGoRecommendation: 'tune_prompt',
      headwordEn: `calibration term ${suffix}`,
      languageAssessment: 'major_edits',
      modelProvider: 'deterministic',
      outcome: 'accepted_with_edits',
    })
    expect(created.latencyMs).toBeGreaterThan(0)
    expect(created.estimatedCostUsd).toBe(0)

    const updated = await recordCalibrationOutcome({
      actor: editor,
      fields: parseCalibrationOutcomeFields({
        ...fields,
        notes: 'Updated after a second human pass; the wording needs regeneration.',
        outcome: 'needs_regeneration',
      }),
      payload,
    })
    expect(updated.id).toBe(created.id)
    expect(updated).toMatchObject({
      notes: 'Updated after a second human pass; the wording needs regeneration.',
      outcome: 'needs_regeneration',
    })

    const saved = await payload.find({
      collection: 'calibration-outcomes',
      limit: 10,
      overrideAccess: true,
      where: { aiDraft: { equals: draftId } },
    })
    expect(saved.docs).toHaveLength(1)
  })

  it('derives first-batch, quality, cost, and decision-readiness metrics', () => {
    const rollup = buildCalibrationRollup(
      [
        {
          job: {
            estimatedCostUsd: 0.1,
            inputTokens: 100,
            latencyMs: 1000,
            modelName: 'model-a',
            modelProvider: 'provider-a',
            outputTokens: 50,
            promptVersion: 'prompt-v1',
            status: 'completed',
          },
          outcome: {
            domainAssessment: 'accurate',
            editLevel: 'none',
            goNoGoRecommendation: 'continue',
            languageAssessment: 'natural',
            outcome: 'accepted_as_is',
          },
          priority: 1,
        },
        {
          job: {
            estimatedCostUsd: 0.2,
            inputTokens: 200,
            latencyMs: 3000,
            modelName: 'model-a',
            modelProvider: 'provider-a',
            outputTokens: 100,
            promptVersion: 'prompt-v1',
            status: 'completed',
          },
          outcome: {
            domainAssessment: 'needs_expert_review',
            editLevel: 'major',
            goNoGoRecommendation: 'tune_prompt',
            languageAssessment: 'major_edits',
            outcome: 'accepted_with_edits',
          },
          priority: 2,
        },
        {
          job: {
            estimatedCostUsd: null,
            inputTokens: null,
            latencyMs: null,
            outputTokens: null,
            status: 'queued',
          },
          outcome: null,
          priority: 3,
        },
      ],
      2,
      5,
    )

    expect(rollup).toMatchObject({
      acceptanceRate: 100,
      averageInputTokens: 150,
      averageLatencyMs: 2000,
      averageOutputTokens: 75,
      decisionReady: false,
      disagreementRate: 50,
      editRate: 50,
      firstBatch: { complete: true, outcomesRecorded: 2, size: 2 },
      preliminarySignal: 'continue',
      remainingOutcomes: 3,
      totalCostUsd: 0.3,
    })
  })
})
