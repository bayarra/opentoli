import config from '@/payload.config'
import type { GenerationJob, User } from '@/payload-types'
import { getPayload, type Payload } from 'payload'

import { isEditorUser } from './permissions'

export class EditorJobError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

const retryableStatuses = ['failed', 'retry_scheduled'] as const

const relationSummary = (
  value: unknown,
  fields: { label: 'name' | 'nameEn'; slug?: boolean } = { label: 'nameEn' },
) => {
  if (!value || typeof value !== 'object' || !('id' in value)) return null
  const record = value as Record<string, unknown>
  const label = record[fields.label]
  return {
    id: typeof record.id === 'number' ? record.id : null,
    label: typeof label === 'string' ? label : null,
    slug: fields.slug && typeof record.slug === 'string' ? record.slug : null,
  }
}

const validationIssueStrings = (job: GenerationJob): string[] => {
  if (job.errorCode !== 'VALIDATION_ERROR') return []
  if (!Array.isArray(job.validationErrors)) return []
  return job.validationErrors.filter((issue): issue is string => typeof issue === 'string')
}

export const retryStateForJob = (job: GenerationJob) => {
  const attemptsRemaining = Math.max(job.maxAttempts - job.attemptCount, 0)

  if (!retryableStatuses.includes(job.status as (typeof retryableStatuses)[number])) {
    return {
      attemptsRemaining,
      canRetry: false,
      reason:
        job.status === 'queued'
          ? 'This job is already queued for the worker.'
          : job.status === 'running'
            ? 'This job is currently running.'
            : job.status === 'completed'
              ? 'Completed jobs are not retried.'
              : job.status === 'cancelled'
                ? 'Cancelled jobs are not retried from the web.'
                : 'This job is not in a retryable state.',
    }
  }

  if (attemptsRemaining < 1) {
    return {
      attemptsRemaining,
      canRetry: false,
      reason: 'No retry attempts remain.',
    }
  }

  return {
    attemptsRemaining,
    canRetry: true,
    reason: 'This job can be moved to the front of the retry queue.',
  }
}

export const safeJobResource = (job: GenerationJob) => {
  const validationIssues = validationIssueStrings(job)
  const retry = retryStateForJob(job)

  return {
    category: relationSummary(job.category, { label: 'nameEn', slug: true }),
    context: relationSummary(job.context, { label: 'nameEn', slug: true }),
    createdAt: job.createdAt,
    diagnostic:
      job.errorCode || job.status === 'failed'
        ? {
            errorCode: job.errorCode || 'UNKNOWN_ERROR',
            message:
              job.errorCode === 'VALIDATION_ERROR'
                ? 'AI output did not match the OpenToli schema.'
                : 'The worker could not complete this job. Private provider details remain in server logs.',
            stage: job.stage,
            validationIssueCount:
              Array.isArray(job.validationErrors) && job.errorCode === 'VALIDATION_ERROR'
                ? job.validationErrors.length
                : null,
            validationIssues: validationIssues.slice(0, 10),
          }
        : null,
    evidence: {
      critiqueRetained: Boolean(job.critiqueRawOutput),
      generationRetained: Boolean(job.generationRawOutput),
      researchRetained: Boolean(job.researchRawOutput),
    },
    id: job.id,
    importBatch: relationSummary(job.importBatch, { label: 'name' }),
    inputHeadword: job.inputHeadword,
    model: {
      name: job.modelName,
      provider: job.modelProvider,
      schemaVersion: job.schemaVersion,
    },
    promptVersions: {
      critique: job.critiquePromptVersion,
      generation: job.generationPromptVersion,
      research: job.researchPromptVersion,
    },
    attempts: {
      count: job.attemptCount,
      max: job.maxAttempts,
      remaining: retry.attemptsRemaining,
    },
    retry,
    stage: job.stage,
    status: job.status,
    timing: {
      completedAt: job.completedAt || null,
      latencyMs: job.latencyMs ?? null,
      nextRetryAt: job.nextRetryAt || null,
      queuedAt: job.queuedAt,
      startedAt: job.startedAt || null,
      updatedAt: job.updatedAt,
    },
    usage: {
      estimatedCostUsd: job.estimatedCostUsd ?? null,
      inputTokens: job.inputTokens ?? null,
      outputTokens: job.outputTokens ?? null,
    },
  }
}

export type SafeJobResource = ReturnType<typeof safeJobResource>

export const getEditorJob = async (id: number, user: User) => {
  if (!isEditorUser(user)) return null

  const payload = await getPayload({ config: await config })
  const job = await payload
    .findByID({
      collection: 'generation-jobs',
      depth: 2,
      id,
      overrideAccess: true,
    })
    .catch(() => null)

  return job ? safeJobResource(job) : null
}

export const retryEditorJobNow = async ({
  actor,
  jobId,
  payload,
}: {
  actor: User
  jobId: number
  payload: Payload
}) => {
  if (!isEditorUser(actor)) {
    throw new EditorJobError('Sign in as an Editor to retry jobs.', 403)
  }

  const job = await payload
    .findByID({
      collection: 'generation-jobs',
      depth: 0,
      id: jobId,
      overrideAccess: true,
    })
    .catch(() => null)
  if (!job) throw new EditorJobError('Generation job was not found.', 404)

  const retry = retryStateForJob(job)
  if (!retry.canRetry) throw new EditorJobError(retry.reason, 409)

  const updated = await payload.update({
    collection: 'generation-jobs',
    data: {
      nextRetryAt: new Date().toISOString(),
      status: 'retry_scheduled',
    },
    id: job.id,
    overrideAccess: false,
    user: actor,
  })

  return safeJobResource(updated)
}

export const jobLabel = (job: Pick<SafeJobResource, 'category' | 'context' | 'importBatch'>) => ({
  category: job.category?.label || 'Uncategorized',
  context: job.context?.label || null,
  importBatch: job.importBatch?.label || null,
})
