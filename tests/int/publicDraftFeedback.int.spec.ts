import { processGenerationJob, enqueueGenerationJob } from '@/ai/pipeline/jobs'
import { DeterministicAIProvider } from '@/ai/providers/deterministic'
import { POST as register } from '@/app/(frontend)/api/register/route'
import { moderateFeedback } from '@/editor/feedback'
import { getPublicAIDraftById } from '@/lib/publicAIDrafts'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let payload: Payload
let admin: User
let moderator: User
let contributor: User
let categoryId: number
let termId: number
let sourceId: number
let generationJobId: number
let aiDraftId: number
const commentIds: number[] = []
const suffix = `${process.pid}-${Date.now()}`

describe('public AI draft feedback', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    admin = await payload.create({
      collection: 'users',
      data: {
        email: `m4-admin-${suffix}@opentoli.local`,
        name: 'M4 Admin',
        password: `m4-admin-${suffix}-password`,
        role: 'admin',
      },
      overrideAccess: true,
    })
    moderator = await payload.create({
      collection: 'users',
      data: {
        email: `m4-moderator-${suffix}@opentoli.local`,
        name: 'M4 Moderator',
        password: `m4-moderator-${suffix}-password`,
        role: 'moderator',
      },
      overrideAccess: true,
    })

    const category = await payload.create({
      collection: 'categories',
      data: {
        displayOrder: 998,
        isActive: true,
        nameEn: `M4 integration category ${suffix}`,
        nameMn: `M4 integration category ${suffix}`,
        slug: `m4-integration-${suffix}`,
      },
      overrideAccess: true,
    })
    categoryId = category.id

    const term = await payload.create({
      collection: 'terms',
      data: {
        categories: [category.id],
        explanationEn: 'A private source container for the M4 integration draft.',
        explanationMn: 'M4 integration draft source container.',
        headwordEn: `public draft term ${suffix}`,
        reviewStatus: 'not_reviewed',
        shortDefinitionEn: 'Used to verify public AI draft feedback.',
        workflowStatus: 'needs_review',
      },
      draft: true,
      overrideAccess: true,
    })
    termId = term.id

    const source = await payload.create({
      collection: 'sources',
      data: {
        isVerified: true,
        publisher: 'OpenToli Integration Tests',
        sourceType: 'official_documentation',
        term: term.id,
        title: 'M4 public draft fixture',
        url: 'https://example.com/opentoli-m4-fixture',
      },
      overrideAccess: true,
    })
    sourceId = source.id

    const provider = new DeterministicAIProvider()
    const preparation = {
      category: { id: category.id, nameEn: category.nameEn, slug: category.slug },
      headwordEn: `public draft term ${suffix}`,
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
    }
    const queued = await enqueueGenerationJob({ payload, preparation, provider })
    generationJobId = queued.job.id
    const processed = await processGenerationJob({
      jobId: queued.job.id,
      payload,
      provider,
    })
    if (!processed.draft) throw new Error('The M4 AI draft fixture was not generated.')
    aiDraftId = processed.draft.id
  })

  afterAll(async () => {
    for (const id of commentIds.reverse()) {
      await payload.delete({ collection: 'comments', id, overrideAccess: true })
    }
    if (aiDraftId) {
      await payload.delete({ collection: 'ai-drafts', id: aiDraftId, overrideAccess: true })
    }
    if (generationJobId) {
      await payload.delete({
        collection: 'generation-jobs',
        id: generationJobId,
        overrideAccess: true,
      })
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
    if (contributor?.id) {
      await payload.delete({ collection: 'users', id: contributor.id, overrideAccess: true })
    }
    if (moderator?.id) {
      await payload.delete({ collection: 'users', id: moderator.id, overrideAccess: true })
    }
    if (admin?.id) {
      await payload.delete({ collection: 'users', id: admin.id, overrideAccess: true })
    }
  })

  it('exposes only an explicitly public, redacted projection', async () => {
    expect(await getPublicAIDraftById(aiDraftId)).toBeNull()

    await payload.update({
      collection: 'ai-drafts',
      data: { publicVisibility: 'public' },
      id: aiDraftId,
      overrideAccess: false,
      user: moderator,
    })

    const publicDraft = await getPublicAIDraftById(aiDraftId)
    expect(publicDraft).toMatchObject({
      headwordEn: `public draft term ${suffix}`,
      id: aiDraftId,
      reviewRoute: 'language_review',
    })
    expect(publicDraft?.sources).toHaveLength(1)
    expect(publicDraft).not.toHaveProperty('researchPayload')
    expect(publicDraft).not.toHaveProperty('generatedPayload')
    expect(publicDraft).not.toHaveProperty('critiquePayload')
    expect(publicDraft).not.toHaveProperty('generationJob')
    expect(publicDraft).not.toHaveProperty('modelName')
    expect(publicDraft).not.toHaveProperty('promptVersion')
  })

  it('registers contributors without opening anonymous user creation', async () => {
    const email = `m4-contributor-${suffix}@opentoli.local`
    const response = await register(
      new Request('http://localhost/api/register', {
        body: JSON.stringify({
          email,
          isActive: false,
          name: 'M4 Contributor',
          password: `m4-contributor-${suffix}-password`,
          role: 'admin',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      }),
    )
    expect(response.status).toBe(201)

    const registered = await payload.find({
      collection: 'users',
      limit: 1,
      overrideAccess: true,
      where: { email: { equals: email } },
    })
    contributor = registered.docs[0] as User
    expect(contributor).toMatchObject({ isActive: true, role: 'contributor' })

    const duplicateResponse = await register(
      new Request('http://localhost/api/register', {
        body: JSON.stringify({
          email: email.toLocaleUpperCase('en-US'),
          name: 'Duplicate M4 Contributor',
          password: `duplicate-m4-contributor-${suffix}`,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      }),
    )
    expect(duplicateResponse.status).toBe(409)
    await expect(duplicateResponse.json()).resolves.toMatchObject({
      message: 'An account with this email already exists. Sign in instead.',
    })

    await expect(
      payload.create({
        collection: 'users',
        data: {
          email: `direct-anonymous-${suffix}@opentoli.local`,
          name: 'Direct Anonymous User',
          password: `direct-anonymous-${suffix}-password`,
          role: 'contributor',
        },
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('keeps authenticated feedback pending until a moderator approves it', async () => {
    await expect(
      payload.create({
        collection: 'comments',
        data: {
          aiDraft: aiDraftId,
          body: 'Anonymous feedback must not be accepted.',
          commentType: 'general',
          status: 'pending',
          user: admin.id,
        },
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    const comment = await payload.create({
      collection: 'comments',
      data: {
        aiDraft: aiDraftId,
        body: 'This wording needs a more natural Mongolian noun form.',
        commentType: 'translation_suggestion',
        status: 'approved',
        suggestedTranslationMn: 'сайжруулсан нэр томьёо',
        user: moderator.id,
      },
      overrideAccess: false,
      user: contributor,
    })
    commentIds.push(comment.id)
    expect(comment.status).toBe('pending')
    expect(typeof comment.user === 'object' ? comment.user.id : comment.user).toBe(contributor.id)

    const anonymousBeforeApproval = await payload.find({
      collection: 'comments',
      overrideAccess: false,
      where: { aiDraft: { equals: aiDraftId } },
    })
    expect(anonymousBeforeApproval.docs).toHaveLength(0)

    await expect(
      payload.create({
        collection: 'comments',
        data: {
          aiDraft: aiDraftId,
          body: comment.body,
          commentType: 'general',
          status: 'pending',
          user: contributor.id,
        },
        overrideAccess: false,
        user: contributor,
      }),
    ).rejects.toThrow('already been submitted')

    await expect(
      payload.create({
        collection: 'comments',
        data: {
          aiDraft: aiDraftId,
          body: 'A suggestion without its proposed wording.',
          commentType: 'translation_suggestion',
          status: 'pending',
          user: contributor.id,
        },
        overrideAccess: false,
        user: contributor,
      }),
    ).rejects.toThrow('requires Mongolian wording')

    const approved = await moderateFeedback({
      actor: moderator,
      commentId: comment.id,
      payload,
      status: 'approved',
    })
    expect(approved.moderatedBy).toBeTruthy()
    expect(approved.moderatedAt).toBeTruthy()

    const anonymousAfterApproval = await payload.find({
      collection: 'comments',
      overrideAccess: false,
      where: { aiDraft: { equals: aiDraftId } },
    })
    expect(anonymousAfterApproval.docs).toHaveLength(1)
    expect((await getPublicAIDraftById(aiDraftId))?.comments).toHaveLength(1)
  })

  it('throttles contribution bursts and hides a private draft', async () => {
    for (let index = 0; index < 4; index += 1) {
      const comment = await payload.create({
        collection: 'comments',
        data: {
          aiDraft: aiDraftId,
          body: `Rate-limit fixture ${index} for ${suffix}.`,
          commentType: 'general',
          status: 'pending',
          user: contributor.id,
        },
        overrideAccess: false,
        user: contributor,
      })
      commentIds.push(comment.id)
    }

    await expect(
      payload.create({
        collection: 'comments',
        data: {
          aiDraft: aiDraftId,
          body: `Rate-limit rejection for ${suffix}.`,
          commentType: 'general',
          status: 'pending',
          user: contributor.id,
        },
        overrideAccess: false,
        user: contributor,
      }),
    ).rejects.toThrow('Too many contributions')

    await payload.update({
      collection: 'ai-drafts',
      data: { publicVisibility: 'private' },
      id: aiDraftId,
      overrideAccess: false,
      user: moderator,
    })
    expect(await getPublicAIDraftById(aiDraftId)).toBeNull()
  })
})
