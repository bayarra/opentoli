import { DeterministicAIProvider } from '@/ai/providers/deterministic'
import { AI_SCHEMA_VERSION } from '@/ai/schemas/v1'
import { GET as apiJobDetail } from '@/app/(frontend)/api/v1/editor/jobs/[id]/route'
import { POST as retryJobRoute } from '@/app/(frontend)/api/editor/jobs/[id]/route'
import { getEditorJob, retryEditorJobNow } from '@/editor/jobs'
import config from '@/payload.config'
import type { GenerationJob, User } from '@/payload-types'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let payload: Payload
let editor: User
let contributor: User
let categoryId: number
const jobIds: number[] = []
const suffix = `${process.pid}-${Date.now()}`

const provider = new DeterministicAIProvider()

const createJob = async ({
  attemptCount = 1,
  errorMessage,
  maxAttempts = 3,
  status,
}: {
  attemptCount?: number
  errorMessage?: string
  maxAttempts?: number
  status: GenerationJob['status']
}) => {
  const job = await payload.create({
    collection: 'generation-jobs',
    data: {
      attemptCount,
      category: categoryId,
      critiquePromptVersion: provider.metadata.critiquePromptVersion,
      errorCode: errorMessage ? 'PROCESSING_ERROR' : undefined,
      errorMessage,
      generationPromptVersion: provider.metadata.generationPromptVersion,
      idempotencyKey: `editor-jobs-${status}-${attemptCount}-${maxAttempts}-${jobIds.length}-${suffix}`,
      inputHeadword: `editor job ${status} ${suffix}`,
      inputPayload: {
        category: { id: categoryId, nameEn: `Editor Jobs ${suffix}`, slug: `editor-jobs-${suffix}` },
        headwordEn: `editor job ${status} ${suffix}`,
      },
      maxAttempts,
      modelName: provider.metadata.modelName,
      modelProvider: provider.metadata.provider,
      queuedAt: new Date().toISOString(),
      researchPromptVersion: provider.metadata.researchPromptVersion,
      schemaVersion: AI_SCHEMA_VERSION,
      sourceInputSnapshot: { sources: [] },
      stage: status === 'completed' ? 'complete' : 'generation',
      status,
      validationErrors: errorMessage ? ['temporary provider timeout'] : undefined,
    },
    overrideAccess: true,
  })
  jobIds.push(job.id)
  return job
}

describe('Editor generation job controls', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    const category = await payload.create({
      collection: 'categories',
      data: {
        displayOrder: 994,
        isActive: true,
        nameEn: `Editor Jobs ${suffix}`,
        nameMn: `Editor Jobs ${suffix}`,
        slug: `editor-jobs-${suffix}`,
      },
      overrideAccess: true,
    })
    categoryId = category.id

    editor = await payload.create({
      collection: 'users',
      data: {
        email: `editor-jobs-reviewer-${suffix}@opentoli.local`,
        name: 'Editor Jobs Reviewer',
        password: `editor-jobs-reviewer-${suffix}-password`,
        role: 'reviewer',
      },
      overrideAccess: true,
    })
    contributor = await payload.create({
      collection: 'users',
      data: {
        email: `editor-jobs-contributor-${suffix}@opentoli.local`,
        name: 'Editor Jobs Contributor',
        password: `editor-jobs-contributor-${suffix}-password`,
        role: 'contributor',
      },
      overrideAccess: true,
    })
  })

  afterAll(async () => {
    for (const id of jobIds.reverse()) {
      await payload.delete({ collection: 'generation-jobs', id, overrideAccess: true })
    }
    if (categoryId) {
      await payload.delete({ collection: 'categories', id: categoryId, overrideAccess: true })
    }
    if (contributor?.id) {
      await payload.delete({ collection: 'users', id: contributor.id, overrideAccess: true })
    }
    if (editor?.id) {
      await payload.delete({ collection: 'users', id: editor.id, overrideAccess: true })
    }
  })

  it('shows safe job details without raw private failure text', async () => {
    const privateError = 'SECRET_PROVIDER_DETAIL: upstream key was rejected'
    const job = await createJob({ errorMessage: privateError, status: 'failed' })

    const detail = await getEditorJob(job.id, editor)
    expect(detail).toMatchObject({
      diagnostic: {
        errorCode: 'PROCESSING_ERROR',
        message:
          'The worker could not complete this job. Private provider details remain in server logs.',
      },
      id: job.id,
      retry: { canRetry: true },
      status: 'failed',
    })
    expect(JSON.stringify(detail)).not.toContain(privateError)
    expect(detail).not.toHaveProperty('inputPayload')
    expect(detail).not.toHaveProperty('researchRawOutput')
    expect(detail).not.toHaveProperty('generationRawOutput')
    expect(detail).not.toHaveProperty('critiqueRawOutput')
  })

  it('lets Editors queue a retry without running the worker', async () => {
    const job = await createJob({
      errorMessage: 'SECRET_PROVIDER_DETAIL: retryable outage',
      status: 'failed',
    })

    await expect(
      retryEditorJobNow({ actor: contributor, jobId: job.id, payload }),
    ).rejects.toThrow('Editor')

    const retried = await retryEditorJobNow({ actor: editor, jobId: job.id, payload })
    expect(retried).toMatchObject({
      id: job.id,
      status: 'retry_scheduled',
    })
    expect(retried.timing.nextRetryAt).toBeTruthy()
    expect(retried.evidence).toEqual({
      critiqueRetained: false,
      generationRetained: false,
      researchRetained: false,
    })

    const stored = await payload.findByID({
      collection: 'generation-jobs',
      id: job.id,
      overrideAccess: true,
    })
    expect(stored.status).toBe('retry_scheduled')
    expect(stored.attemptCount).toBe(job.attemptCount)
    expect(stored.researchRawOutput).toBeFalsy()
  })

  it('rejects non-retryable job states and exhausted attempts', async () => {
    const queued = await createJob({ attemptCount: 0, status: 'queued' })
    await expect(retryEditorJobNow({ actor: editor, jobId: queued.id, payload })).rejects.toThrow(
      'already queued',
    )

    const exhausted = await createJob({
      attemptCount: 3,
      errorMessage: 'SECRET_PROVIDER_DETAIL: exhausted',
      maxAttempts: 3,
      status: 'failed',
    })
    await expect(
      retryEditorJobNow({ actor: editor, jobId: exhausted.id, payload }),
    ).rejects.toThrow('No retry attempts remain')
  })

  it('requires authentication on job detail and retry routes', async () => {
    const job = await createJob({ errorMessage: 'SECRET_PROVIDER_DETAIL: route auth', status: 'failed' })

    const detailResponse = await apiJobDetail(
      new Request(`http://localhost/api/v1/editor/jobs/${job.id}`),
      { params: Promise.resolve({ id: String(job.id) }) },
    )
    expect(detailResponse.status).toBe(401)

    const retryResponse = await retryJobRoute(
      new Request(`http://localhost/api/editor/jobs/${job.id}`, {
        body: JSON.stringify({ action: 'retry-now' }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      }),
      { params: Promise.resolve({ id: String(job.id) }) },
    )
    expect(retryResponse.status).toBe(401)
  })
})
