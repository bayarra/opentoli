import config from '@/payload.config'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let payload: Payload
let categoryId: number
let bootstrapAdminId: number | undefined
let publishedTermId: number | undefined
let publishedTranslationId: number | undefined
let draftTermId: number | undefined
let draftTranslationId: number | undefined

describe('editorial workflow', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    const suffix = `${process.pid}-${Date.now()}`
    const bootstrapAdmin = await payload.create({
      collection: 'users',
      data: {
        email: `bootstrap-admin-${suffix}@opentoli.local`,
        name: 'Integration Test Bootstrap Admin',
        password: `bootstrap-admin-${suffix}-password`,
        role: 'admin',
      },
      overrideAccess: true,
    })
    bootstrapAdminId = bootstrapAdmin.id

    const category = await payload.create({
      collection: 'categories',
      data: {
        displayOrder: 999,
        isActive: true,
        nameEn: `Integration test category ${suffix}`,
        nameMn: `Integration test category ${suffix}`,
        slug: `integration-test-${suffix}`,
      },
      overrideAccess: true,
    })
    categoryId = category.id

    const publishedTerm = await payload.create({
      collection: 'terms',
      data: {
        categories: [categoryId],
        explanationEn: 'A published term owned by the integration test.',
        explanationMn: 'Integration test published term.',
        headwordEn: `published integration term ${suffix}`,
        reviewStatus: 'human_reviewed',
        shortDefinitionEn: 'Used to verify public term access.',
        workflowStatus: 'approved',
      },
      draft: true,
      overrideAccess: true,
    })
    publishedTermId = publishedTerm.id

    const publishedTranslation = await payload.create({
      collection: 'translations',
      data: {
        register: 'general',
        reviewStatus: 'human_reviewed',
        status: 'approved',
        term: publishedTerm.id,
        translationMn: `published integration translation ${suffix}`,
        translationType: 'recommended',
      },
      overrideAccess: true,
    })
    publishedTranslationId = publishedTranslation.id

    await payload.update({
      collection: 'terms',
      context: { trustedSeed: true },
      data: {
        _status: 'published',
        recommendedTranslation: publishedTranslation.id,
      },
      draft: false,
      id: publishedTerm.id,
      overrideAccess: true,
    })
  })

  afterAll(async () => {
    if (draftTranslationId) {
      await payload.delete({
        collection: 'translations',
        id: draftTranslationId,
        overrideAccess: true,
      })
    }
    if (draftTermId) {
      await payload.delete({ collection: 'terms', id: draftTermId, overrideAccess: true })
    }
    if (publishedTranslationId) {
      await payload.delete({
        collection: 'translations',
        id: publishedTranslationId,
        overrideAccess: true,
      })
    }
    if (publishedTermId) {
      await payload.delete({ collection: 'terms', id: publishedTermId, overrideAccess: true })
    }
    if (categoryId) {
      await payload.delete({ collection: 'categories', id: categoryId, overrideAccess: true })
    }
    if (bootstrapAdminId) {
      await payload.delete({ collection: 'users', id: bootstrapAdminId, overrideAccess: true })
    }
  })

  it('exposes a published reference term to public reads', async () => {
    if (!publishedTermId) throw new Error('Published test fixture was not created.')

    const terms = await payload.find({
      collection: 'terms',
      limit: 1,
      overrideAccess: false,
      where: { id: { equals: publishedTermId } },
    })

    expect(terms.docs).toHaveLength(1)
    expect(terms.docs[0]?._status).toBe('published')
    expect(terms.docs[0]?.reviewStatus).toBe('human_reviewed')
  })

  it('keeps drafts private and rejects publication without required review evidence', async () => {
    const suffix = Date.now().toString()
    const draft = await payload.create({
      collection: 'terms',
      data: {
        categories: [categoryId],
        explanationEn: 'A private test term.',
        explanationMn: 'Нийтлээгүй туршилтын нэр томьёо.',
        headwordEn: `private test term ${suffix}`,
        normalizedHeadwordEn: `private test term ${suffix}`,
        reviewStatus: 'ai_draft',
        shortDefinitionEn: 'Used to test publication controls.',
        slug: `private-test-term-${suffix}`,
        workflowStatus: 'approved',
      },
      draft: true,
      overrideAccess: true,
    })
    draftTermId = draft.id

    const publicRead = await payload.find({
      collection: 'terms',
      limit: 1,
      overrideAccess: false,
      where: { id: { equals: draft.id } },
    })
    expect(publicRead.docs).toHaveLength(0)

    const translation = await payload.create({
      collection: 'translations',
      data: {
        register: 'general',
        reviewStatus: 'human_reviewed',
        status: 'approved',
        term: draft.id,
        translationMn: 'нийтлээгүй орчуулга',
        translationType: 'alternative',
      },
      overrideAccess: true,
    })
    draftTranslationId = translation.id

    const publicTranslationRead = await payload.find({
      collection: 'translations',
      limit: 1,
      overrideAccess: false,
      where: { id: { equals: translation.id } },
    })
    expect(publicTranslationRead.docs).toHaveLength(0)

    await expect(
      payload.update({
        collection: 'terms',
        context: { trustedSeed: true },
        data: { _status: 'published' },
        draft: false,
        id: draft.id,
        overrideAccess: true,
      }),
    ).rejects.toThrow('human or expert review')
  })

  it('rejects publication without a recommended translation', async () => {
    if (!draftTermId) throw new Error('Publication test draft was not created.')

    await expect(
      payload.update({
        collection: 'terms',
        context: { trustedSeed: true },
        data: { _status: 'published', reviewStatus: 'human_reviewed' },
        draft: false,
        id: draftTermId,
        overrideAccess: true,
      }),
    ).rejects.toThrow('recommended translation')
  })

  it('denies editorial updates from contributors', async () => {
    if (!draftTermId) throw new Error('Publication test draft was not created.')

    const suffix = Date.now().toString()
    const contributor = await payload.create({
      collection: 'users',
      data: {
        email: `contributor-${suffix}@opentoli.local`,
        name: 'Workflow Contributor',
        password: `contributor-${suffix}-password`,
        role: 'contributor',
      },
      overrideAccess: true,
    })

    try {
      await expect(
        payload.update({
          collection: 'terms',
          data: { workflowStatus: 'approved' },
          draft: true,
          id: draftTermId,
          overrideAccess: false,
          user: contributor,
        }),
      ).rejects.toThrow()
    } finally {
      await payload.delete({ collection: 'users', id: contributor.id, overrideAccess: true })
    }
  })

  it('allows an attributed moderator workflow to publish a reviewed term', async () => {
    const suffix = Date.now().toString()
    const reviewer = await payload.create({
      collection: 'users',
      data: {
        email: `reviewer-${suffix}@opentoli.local`,
        name: 'Workflow Reviewer',
        password: `reviewer-${suffix}-password`,
        role: 'reviewer',
      },
      overrideAccess: true,
    })
    const moderator = await payload.create({
      collection: 'users',
      data: {
        email: `moderator-${suffix}@opentoli.local`,
        name: 'Workflow Moderator',
        password: `moderator-${suffix}-password`,
        role: 'moderator',
      },
      overrideAccess: true,
    })
    let termId: number | undefined
    let translationId: number | undefined
    let reviewId: number | undefined

    try {
      const term = await payload.create({
        collection: 'terms',
        data: {
          categories: [categoryId],
          explanationEn: 'A term used to test the complete editorial workflow.',
          explanationMn: 'Редакцын бүрэн үйл явцыг шалгах туршилтын нэр томьёо.',
          headwordEn: `workflow term ${suffix}`,
          normalizedHeadwordEn: `workflow term ${suffix}`,
          reviewStatus: 'not_reviewed',
          shortDefinitionEn: 'A complete workflow test term.',
          slug: `workflow-term-${suffix}`,
          workflowStatus: 'needs_review',
        },
        draft: true,
        overrideAccess: true,
      })
      termId = term.id

      const translation = await payload.create({
        collection: 'translations',
        data: {
          register: 'general',
          reviewStatus: 'human_reviewed',
          reviewedBy: reviewer.id,
          status: 'approved',
          term: term.id,
          translationMn: `ажлын урсгалын нэр томьёо ${suffix}`,
          translationType: 'recommended',
        },
        overrideAccess: true,
      })
      translationId = translation.id

      const review = await payload.create({
        collection: 'reviews',
        data: {
          decision: 'approved',
          notes: 'Integration-test approval.',
          reviewType: 'final_approval',
          reviewer: reviewer.id,
          term: term.id,
          translation: translation.id,
        },
        overrideAccess: true,
      })
      reviewId = review.id

      const published = await payload.update({
        collection: 'terms',
        data: {
          _status: 'published',
          approvedBy: moderator.id,
          recommendedTranslation: translation.id,
          reviewedBy: reviewer.id,
          reviewStatus: 'human_reviewed',
          workflowStatus: 'approved',
        },
        draft: false,
        id: term.id,
        overrideAccess: false,
        user: moderator,
      })

      expect(published._status).toBe('published')
      const publicRead = await payload.find({
        collection: 'terms',
        limit: 1,
        overrideAccess: false,
        where: { id: { equals: term.id } },
      })
      expect(publicRead.docs).toHaveLength(1)
    } finally {
      if (reviewId) {
        await payload.delete({ collection: 'reviews', id: reviewId, overrideAccess: true })
      }
      if (translationId) {
        await payload.delete({
          collection: 'translations',
          id: translationId,
          overrideAccess: true,
        })
      }
      if (termId) {
        await payload.delete({ collection: 'terms', id: termId, overrideAccess: true })
      }
      await payload.delete({ collection: 'users', id: reviewer.id, overrideAccess: true })
      await payload.delete({ collection: 'users', id: moderator.id, overrideAccess: true })
    }
  })
})
