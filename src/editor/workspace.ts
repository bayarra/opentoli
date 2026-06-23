import config from '@/payload.config'
import type { Category, GenerationJob, ImportBatch, Term, User } from '@/payload-types'
import { getPayload } from 'payload'

import { isEditorUser } from './permissions'

const activeDraftStatuses = ['editing', 'needs_review'] as const
const resolvedDraftStatuses = ['accepted', 'partially_accepted', 'rejected'] as const
const jobStatuses = ['queued', 'running', 'retry_scheduled', 'completed', 'failed'] as const

const relationName = (value: unknown): string | null => {
  if (!value || typeof value !== 'object') return null
  if ('nameEn' in value && typeof (value as Category).nameEn === 'string') {
    return (value as Category).nameEn
  }
  if ('name' in value && typeof (value as { name?: unknown }).name === 'string') {
    return String((value as { name: string }).name)
  }
  return null
}

const formatCurrency = (value?: number | null) =>
  typeof value === 'number' ? `$${value.toFixed(4)}` : null

const formatDuration = (value?: number | null) =>
  typeof value === 'number' ? `${Math.round(value / 1000)}s` : null

export const getEditorWorkspace = async (user: User) => {
  if (!isEditorUser(user)) return null

  const payload = await getPayload({ config: await config })

  const [
    activeDrafts,
    publicDrafts,
    resolvedDrafts,
    pendingFeedback,
    publishedTerms,
    jobCounts,
    recentJobs,
    recentBatches,
    recentPublishedTerms,
  ] = await Promise.all([
    payload.count({
      collection: 'ai-drafts',
      overrideAccess: true,
      where: { status: { in: [...activeDraftStatuses] } },
    }),
    payload.count({
      collection: 'ai-drafts',
      overrideAccess: true,
      where: {
        and: [
          { publicVisibility: { equals: 'public' } },
          { status: { in: [...activeDraftStatuses] } },
        ],
      },
    }),
    payload.count({
      collection: 'ai-drafts',
      overrideAccess: true,
      where: { status: { in: [...resolvedDraftStatuses] } },
    }),
    payload.count({
      collection: 'comments',
      overrideAccess: true,
      where: { status: { equals: 'pending' } },
    }),
    payload.count({
      collection: 'terms',
      overrideAccess: true,
      where: { _status: { equals: 'published' } },
    }),
    Promise.all(
      jobStatuses.map(async (status) => {
        const result = await payload.count({
          collection: 'generation-jobs',
          overrideAccess: true,
          where: { status: { equals: status } },
        })
        return [status, result.totalDocs] as const
      }),
    ),
    payload.find({
      collection: 'generation-jobs',
      depth: 1,
      limit: 8,
      overrideAccess: true,
      sort: '-updatedAt',
    }),
    payload.find({
      collection: 'import-batches',
      depth: 1,
      limit: 5,
      overrideAccess: true,
      sort: '-updatedAt',
    }),
    payload.find({
      collection: 'terms',
      depth: 0,
      limit: 6,
      overrideAccess: true,
      sort: '-updatedAt',
      where: { _status: { equals: 'published' } },
    }),
  ])

  const jobCountsByStatus = Object.fromEntries(jobCounts) as Record<(typeof jobStatuses)[number], number>

  return {
    batches: (recentBatches.docs as ImportBatch[]).map((batch) => ({
      acceptedRows: batch.acceptedRows || 0,
      duplicateRows: batch.duplicateRows || 0,
      id: batch.id,
      name: batch.name,
      rejectedRows: batch.rejectedRows || 0,
      sourceTitle: batch.sourceTitle,
      status: batch.status,
      totalRows: batch.totalRows || 0,
      updatedAt: batch.updatedAt,
    })),
    counts: {
      activeDrafts: activeDrafts.totalDocs,
      completedJobs: jobCountsByStatus.completed,
      failedJobs: jobCountsByStatus.failed,
      pendingFeedback: pendingFeedback.totalDocs,
      publicDrafts: publicDrafts.totalDocs,
      publishedTerms: publishedTerms.totalDocs,
      queuedJobs: jobCountsByStatus.queued,
      resolvedDrafts: resolvedDrafts.totalDocs,
      retryJobs: jobCountsByStatus.retry_scheduled,
      runningJobs: jobCountsByStatus.running,
    },
    jobs: (recentJobs.docs as GenerationJob[]).map((job) => ({
      attempts: `${job.attemptCount}/${job.maxAttempts}`,
      category: relationName(job.category),
      cost: formatCurrency(job.estimatedCostUsd),
      duration: formatDuration(job.latencyMs),
      id: job.id,
      inputHeadword: job.inputHeadword,
      modelName: job.modelName,
      stage: job.stage,
      status: job.status,
      tokens:
        typeof job.inputTokens === 'number' || typeof job.outputTokens === 'number'
          ? `${job.inputTokens || 0} in / ${job.outputTokens || 0} out`
          : null,
      updatedAt: job.updatedAt,
    })),
    terms: (recentPublishedTerms.docs as Term[]).map((term) => ({
      headwordEn: term.headwordEn,
      id: term.id,
      reviewStatus: term.reviewStatus,
      slug: term.slug,
      updatedAt: term.updatedAt,
    })),
  }
}
