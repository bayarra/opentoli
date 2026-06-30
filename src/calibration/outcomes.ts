import { isEditorUser, relationshipId } from '@/editor/permissions'
import config from '@/payload.config'
import type { AiDraft, CalibrationOutcome, GenerationJob, User } from '@/payload-types'
import { getPayload, type Payload } from 'payload'

import { loadM5Manifest, type M5Term, validateM5Manifest } from './m5Manifest'
import {
  calibrationDomainAssessments,
  calibrationEditLevels,
  calibrationGoNoGoRecommendations,
  calibrationLanguageAssessments,
  calibrationOutcomeValues,
} from './options'

export class CalibrationOutcomeError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

type CalibrationOutcomeInput = {
  aiDraftId: number
  domainAssessment: CalibrationOutcome['domainAssessment']
  editLevel: CalibrationOutcome['editLevel']
  goNoGoRecommendation?: NonNullable<CalibrationOutcome['goNoGoRecommendation']>
  languageAssessment: CalibrationOutcome['languageAssessment']
  notes: string
  outcome: CalibrationOutcome['outcome']
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const normalizeHeadword = (value: string) => value.trim().toLocaleLowerCase('en-US')

const numberFrom = (value: unknown, label: string): number => {
  const parsed = typeof value === 'string' ? Number(value) : value
  if (!Number.isInteger(parsed) || Number(parsed) < 1) {
    throw new CalibrationOutcomeError(`Invalid ${label}.`)
  }
  return Number(parsed)
}

const allowedValue = <T extends readonly string[]>(
  value: unknown,
  allowed: T,
  label: string,
): T[number] => {
  if (typeof value === 'string' && allowed.includes(value)) return value
  throw new CalibrationOutcomeError(`Invalid ${label}.`)
}

const optionalAllowedValue = <T extends readonly string[]>(
  value: unknown,
  allowed: T,
  label: string,
): T[number] | undefined => {
  if (value === null || value === undefined || value === '') return undefined
  return allowedValue(value, allowed, label)
}

const formatCurrency = (value?: number | null) =>
  typeof value === 'number' ? `$${value.toFixed(4)}` : null

const formatDuration = (value?: number | null) =>
  typeof value === 'number' ? `${Math.round(value / 1000)}s` : null

const percent = (value: number, total: number) =>
  total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0

type RollupItem = {
  job: null | {
    estimatedCostUsd: number | null
    inputTokens: number | null
    latencyMs: number | null
    modelName?: string | null
    modelProvider?: string | null
    outputTokens: number | null
    promptVersion?: string | null
    status: GenerationJob['status']
  }
  outcome: null | {
    domainAssessment: CalibrationOutcome['domainAssessment']
    editLevel: CalibrationOutcome['editLevel']
    goNoGoRecommendation: CalibrationOutcome['goNoGoRecommendation'] | null
    languageAssessment: CalibrationOutcome['languageAssessment']
    outcome: CalibrationOutcome['outcome']
  }
  priority: number
}

export const buildCalibrationRollup = (
  items: RollupItem[],
  firstBatchSize: number,
  totalTerms = items.length,
) => {
  const recorded = items.filter((item) => item.outcome)
  const completedJobs = items.filter((item) => item.job?.status === 'completed')
  const firstBatch = items.filter((item) => item.priority <= firstBatchSize)
  const accepted = recorded.filter((item) =>
    ['accepted_as_is', 'accepted_with_edits'].includes(item.outcome!.outcome),
  ).length
  const edited = recorded.filter((item) =>
    ['minor', 'major', 'rewrite'].includes(item.outcome!.editLevel),
  ).length
  const regenerationOrRejected = recorded.filter((item) =>
    ['needs_regeneration', 'rejected'].includes(item.outcome!.outcome),
  ).length
  const disagreements = recorded.filter(
    (item) =>
      ['needs_expert_review', 'incorrect'].includes(item.outcome!.domainAssessment) ||
      item.outcome!.languageAssessment === 'major_edits',
  ).length
  const recommendationCounts = Object.fromEntries(
    calibrationGoNoGoRecommendations.map((value) => [value, 0]),
  ) as Record<(typeof calibrationGoNoGoRecommendations)[number], number>
  for (const item of recorded) {
    const recommendation = item.outcome?.goNoGoRecommendation
    if (recommendation) recommendationCounts[recommendation] += 1
  }

  const preliminarySignal =
    recorded.length === 0
      ? 'not_ready'
      : recommendationCounts.pause_batch > 0
        ? 'pause_batch'
        : recommendationCounts.not_ready > 0
          ? 'not_ready'
          : recommendationCounts.tune_prompt > recommendationCounts.continue
            ? 'tune_prompt'
            : 'continue'
  const totalInputTokens = completedJobs.reduce((total, item) => total + (item.job?.inputTokens || 0), 0)
  const totalOutputTokens = completedJobs.reduce((total, item) => total + (item.job?.outputTokens || 0), 0)
  const totalLatencyMs = completedJobs.reduce((total, item) => total + (item.job?.latencyMs || 0), 0)
  const totalCostUsd = completedJobs.reduce((total, item) => total + (item.job?.estimatedCostUsd || 0), 0)
  const outcomesRecorded = recorded.length
  const remainingOutcomes = Math.max(0, totalTerms - outcomesRecorded)

  return {
    acceptanceRate: percent(accepted, outcomesRecorded),
    accepted,
    averageInputTokens: completedJobs.length ? Math.round(totalInputTokens / completedJobs.length) : 0,
    averageLatencyMs: completedJobs.length ? Math.round(totalLatencyMs / completedJobs.length) : 0,
    averageOutputTokens: completedJobs.length ? Math.round(totalOutputTokens / completedJobs.length) : 0,
    decisionReady: outcomesRecorded === totalTerms && totalTerms > 0,
    disagreementRate: percent(disagreements, outcomesRecorded),
    disagreements,
    editRate: percent(edited, outcomesRecorded),
    edited,
    firstBatch: {
      complete: firstBatch.length === firstBatchSize && firstBatch.every((item) => item.outcome),
      outcomesRecorded: firstBatch.filter((item) => item.outcome).length,
      size: firstBatchSize,
    },
    preliminarySignal,
    modelNames: [...new Set(completedJobs.map((item) => item.job?.modelName).filter((value): value is string => Boolean(value)))],
    modelProviders: [...new Set(completedJobs.map((item) => item.job?.modelProvider).filter((value): value is string => Boolean(value)))],
    promptVersions: [...new Set(completedJobs.map((item) => item.job?.promptVersion).filter((value): value is string => Boolean(value)))],
    recommendationCounts,
    regenerationOrRejected,
    remainingOutcomes,
    totalCostUsd: Number(totalCostUsd.toFixed(4)),
    totalInputTokens,
    totalLatencyMs,
    totalOutputTokens,
  }
}

const safeOutcome = (outcome: CalibrationOutcome) => ({
  domainAssessment: outcome.domainAssessment,
  editLevel: outcome.editLevel,
  goNoGoRecommendation: outcome.goNoGoRecommendation || null,
  id: outcome.id,
  notes: outcome.notes,
  outcome: outcome.outcome,
  reviewedAt: outcome.reviewedAt,
  languageAssessment: outcome.languageAssessment,
})

export const parseCalibrationOutcomeFields = (input: unknown): CalibrationOutcomeInput => {
  if (!isRecord(input)) throw new CalibrationOutcomeError('Invalid calibration outcome.')

  const notes = typeof input.notes === 'string' ? input.notes.trim() : ''
  if (notes.length === 0) {
    throw new CalibrationOutcomeError('Calibration notes are required.')
  }

  return {
    aiDraftId: numberFrom(input.aiDraftId, 'AI draft ID'),
    domainAssessment: allowedValue(
      input.domainAssessment,
      calibrationDomainAssessments,
      'domain assessment',
    ),
    editLevel: allowedValue(input.editLevel, calibrationEditLevels, 'edit level'),
    goNoGoRecommendation: optionalAllowedValue(
      input.goNoGoRecommendation,
      calibrationGoNoGoRecommendations,
      'go/no-go recommendation',
    ),
    languageAssessment: allowedValue(
      input.languageAssessment,
      calibrationLanguageAssessments,
      'language assessment',
    ),
    notes,
    outcome: allowedValue(input.outcome, calibrationOutcomeValues, 'outcome'),
  }
}

export const recordCalibrationOutcome = async ({
  actor,
  fields,
  payload: providedPayload,
}: {
  actor: User
  fields: CalibrationOutcomeInput
  payload?: Payload
}) => {
  if (!isEditorUser(actor)) {
    throw new CalibrationOutcomeError('Editor access is required.', 403)
  }

  const payload = providedPayload || (await getPayload({ config: await config }))
  const draft = (await payload.findByID({
    collection: 'ai-drafts',
    depth: 1,
    id: fields.aiDraftId,
    overrideAccess: true,
  })) as AiDraft

  const generationJobId = relationshipId(draft.generationJob)
  if (!generationJobId) {
    throw new CalibrationOutcomeError('The AI draft is missing generation-job evidence.', 400)
  }

  const job = (await payload.findByID({
    collection: 'generation-jobs',
    depth: 0,
    id: generationJobId,
    overrideAccess: true,
  })) as GenerationJob

  const existing = await payload.find({
    collection: 'calibration-outcomes',
    limit: 1,
    overrideAccess: true,
    where: { aiDraft: { equals: draft.id } },
  })

  const data = {
    aiDraft: draft.id,
    domainAssessment: fields.domainAssessment,
    editLevel: fields.editLevel,
    estimatedCostUsd: job.estimatedCostUsd ?? undefined,
    generationJob: generationJobId,
    goNoGoRecommendation: fields.goNoGoRecommendation,
    headwordEn: draft.inputHeadword,
    inputTokens: job.inputTokens ?? undefined,
    jobCompletedAt: job.completedAt ?? undefined,
    languageAssessment: fields.languageAssessment,
    latencyMs: job.latencyMs ?? undefined,
    milestone: 'M5',
    modelName: draft.modelName || job.modelName,
    modelProvider: draft.modelProvider || job.modelProvider,
    notes: fields.notes,
    outcome: fields.outcome,
    outputTokens: job.outputTokens ?? undefined,
    promptVersion: draft.promptVersion || job.generationPromptVersion,
    reviewedAt: new Date().toISOString(),
    reviewedBy: actor.id,
    schemaVersion: draft.schemaVersion || job.schemaVersion,
    term: relationshipId(draft.term),
  }

  const outcome = existing.docs[0]
    ? await payload.update({
        collection: 'calibration-outcomes',
        data,
        id: existing.docs[0].id,
        overrideAccess: true,
      })
    : await payload.create({
        collection: 'calibration-outcomes',
        data,
        overrideAccess: true,
      })

  return outcome as CalibrationOutcome
}

export const getM5CalibrationDashboard = async (
  user: User,
  providedPayload?: Payload,
) => {
  if (!isEditorUser(user)) return null

  const payload = providedPayload || (await getPayload({ config: await config }))
  const manifest = await loadM5Manifest()
  const validation = validateM5Manifest(manifest)
  const headwords = manifest.terms.map((term) => term.headwordEn)

  const [jobs, drafts, outcomes] = await Promise.all([
    payload.find({
      collection: 'generation-jobs',
      depth: 0,
      limit: headwords.length,
      overrideAccess: true,
      sort: '-updatedAt',
      where: { inputHeadword: { in: headwords } },
    }),
    payload.find({
      collection: 'ai-drafts',
      depth: 1,
      limit: headwords.length,
      overrideAccess: true,
      sort: '-updatedAt',
      where: { inputHeadword: { in: headwords } },
    }),
    payload.find({
      collection: 'calibration-outcomes',
      depth: 1,
      limit: headwords.length,
      overrideAccess: true,
      sort: '-reviewedAt',
      where: { headwordEn: { in: headwords } },
    }),
  ])

  const jobsByHeadword = new Map<string, GenerationJob>()
  for (const job of jobs.docs as GenerationJob[]) {
    const key = normalizeHeadword(job.inputHeadword)
    if (!jobsByHeadword.has(key)) jobsByHeadword.set(key, job)
  }

  const draftsByHeadword = new Map<string, AiDraft>()
  for (const draft of drafts.docs as AiDraft[]) {
    const key = normalizeHeadword(draft.inputHeadword)
    if (!draftsByHeadword.has(key)) draftsByHeadword.set(key, draft)
  }

  const outcomesByDraft = new Map<number, CalibrationOutcome>()
  for (const outcome of outcomes.docs as CalibrationOutcome[]) {
    const draftId = relationshipId(outcome.aiDraft)
    if (draftId && !outcomesByDraft.has(draftId)) outcomesByDraft.set(draftId, outcome)
  }

  const outcomeCounts = Object.fromEntries(
    calibrationOutcomeValues.map((outcome) => [outcome, 0]),
  ) as Record<CalibrationOutcome['outcome'], number>

  const items = manifest.terms
    .slice()
    .sort((left, right) => left.priority - right.priority)
    .map((term: M5Term) => {
      const key = normalizeHeadword(term.headwordEn)
      const job = jobsByHeadword.get(key)
      const draft = draftsByHeadword.get(key)
      const outcome = draft ? outcomesByDraft.get(draft.id) : undefined
      if (outcome) outcomeCounts[outcome.outcome] += 1

      return {
        context: term.context,
        difficulty: term.difficulty,
        draft: draft
          ? {
              id: draft.id,
              publicVisibility: draft.publicVisibility,
              reviewRoute: draft.reviewRoute,
              riskLevel: draft.riskLevel,
              status: draft.status,
            }
          : null,
        headwordEn: term.headwordEn,
        id: term.id,
        job: job
          ? {
              cost: formatCurrency(job.estimatedCostUsd),
              duration: formatDuration(job.latencyMs),
              estimatedCostUsd: job.estimatedCostUsd ?? null,
              id: job.id,
              inputTokens: job.inputTokens ?? null,
              latencyMs: job.latencyMs ?? null,
              modelName: job.modelName,
              modelProvider: job.modelProvider,
              outputTokens: job.outputTokens ?? null,
              promptVersion: job.generationPromptVersion,
              status: job.status,
              tokens:
                typeof job.inputTokens === 'number' || typeof job.outputTokens === 'number'
                  ? `${job.inputTokens || 0} in / ${job.outputTokens || 0} out`
                  : null,
              updatedAt: job.updatedAt,
            }
          : null,
        notes: term.notes || null,
        outcome: outcome ? safeOutcome(outcome) : null,
        priority: term.priority,
        subcategory: term.subcategory,
      }
    })

  const rollup = buildCalibrationRollup(
    items,
    manifest.runPolicy.firstBatchSize,
    manifest.terms.length,
  )

  return {
    items,
    manifest: {
      categoryName: manifest.categoryName,
      categorySlug: manifest.categorySlug,
      description: manifest.description,
      milestone: manifest.milestone,
      name: manifest.name,
      runPolicy: manifest.runPolicy,
      validation,
      version: manifest.version,
    },
    summary: {
      draftsGenerated: items.filter((item) => item.draft).length,
      jobsCompleted: items.filter((item) => item.job?.status === 'completed').length,
      jobsQueued: items.filter((item) => item.job?.status === 'queued').length,
      outcomeCounts,
      outcomesRecorded: items.filter((item) => item.outcome).length,
      rollup,
      terms: manifest.terms.length,
    },
  }
}
