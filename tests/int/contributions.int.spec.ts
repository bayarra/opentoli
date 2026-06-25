import { getUserContributions } from '@/lib/contributions'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let payload: Payload
let moderator: User
let contributor: User
let otherContributor: User
let categoryId: number
let termId: number
let translationId: number
const commentIds: number[] = []
const suffix = `${process.pid}-${Date.now()}`

describe('contributor dashboard data', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    moderator = await payload.create({
      collection: 'users',
      data: {
        email: `contrib-moderator-${suffix}@opentoli.local`,
        name: 'Contribution Moderator',
        password: `contrib-moderator-${suffix}-password`,
        role: 'moderator',
      },
      overrideAccess: true,
    })
    contributor = await payload.create({
      collection: 'users',
      data: {
        email: `contrib-user-${suffix}@opentoli.local`,
        name: 'Contribution User',
        password: `contrib-user-${suffix}-password`,
        role: 'contributor',
      },
      overrideAccess: true,
    })
    otherContributor = await payload.create({
      collection: 'users',
      data: {
        email: `contrib-other-${suffix}@opentoli.local`,
        name: 'Other Contribution User',
        password: `contrib-other-${suffix}-password`,
        role: 'contributor',
      },
      overrideAccess: true,
    })

    const category = await payload.create({
      collection: 'categories',
      data: {
        displayOrder: 993,
        isActive: true,
        nameEn: `Contribution category ${suffix}`,
        nameMn: `Contribution category ${suffix}`,
        slug: `contribution-category-${suffix}`,
      },
      overrideAccess: true,
    })
    categoryId = category.id

    const term = await payload.create({
      collection: 'terms',
      data: {
        categories: [category.id],
        explanationEn: 'A published term for contribution dashboard tests.',
        explanationMn: 'Contribution dashboard test term.',
        headwordEn: `contribution term ${suffix}`,
        reviewStatus: 'human_reviewed',
        shortDefinitionEn: 'Used to verify contributor dashboard data.',
        workflowStatus: 'approved',
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
        status: 'approved',
        term: term.id,
        translationMn: `contribution translation ${suffix}`,
        translationType: 'recommended',
      },
      overrideAccess: true,
    })
    translationId = translation.id

    await payload.update({
      collection: 'terms',
      context: { trustedSeed: true },
      data: {
        _status: 'published',
        recommendedTranslation: translation.id,
      },
      draft: false,
      id: term.id,
      overrideAccess: true,
    })
  })

  afterAll(async () => {
    for (const id of commentIds.reverse()) {
      await payload.delete({ collection: 'comments', id, overrideAccess: true })
    }
    if (translationId) {
      await payload.delete({ collection: 'translations', id: translationId, overrideAccess: true })
    }
    if (termId) {
      await payload.delete({ collection: 'terms', id: termId, overrideAccess: true })
    }
    if (categoryId) {
      await payload.delete({ collection: 'categories', id: categoryId, overrideAccess: true })
    }
    for (const id of [otherContributor?.id, contributor?.id, moderator?.id].filter(Boolean)) {
      await payload.delete({ collection: 'users', id: id as number, overrideAccess: true })
    }
  })

  it('returns only the signed-in contributor contributions with safe target links', async () => {
    const ownComment = await payload.create({
      collection: 'comments',
      data: {
        body: `Contribution dashboard body ${suffix}`,
        commentType: 'translation_suggestion',
        status: 'pending',
        suggestedTranslationMn: `санал ${suffix}`,
        term: termId,
        user: contributor.id,
      },
      draft: false,
      overrideAccess: false,
      user: contributor,
    })
    commentIds.push(ownComment.id)

    const otherComment = await payload.create({
      collection: 'comments',
      data: {
        body: `Other contribution dashboard body ${suffix}`,
        commentType: 'general',
        status: 'pending',
        term: termId,
        user: otherContributor.id,
      },
      draft: false,
      overrideAccess: false,
      user: otherContributor,
    })
    commentIds.push(otherComment.id)

    await payload.update({
      collection: 'comments',
      data: {
        moderatorNote: 'Looks useful for the dashboard.',
        status: 'approved',
      },
      id: ownComment.id,
      overrideAccess: false,
      user: moderator,
    })

    const contributions = await getUserContributions(contributor)
    expect(contributions).toHaveLength(1)
    expect(contributions[0]).toMatchObject({
      body: `Contribution dashboard body ${suffix}`,
      commentType: 'translation_suggestion',
      moderatorNote: 'Looks useful for the dashboard.',
      status: 'approved',
      suggestedTranslationMn: `санал ${suffix}`,
      target: {
        href: expect.stringMatching(/^\/terms\//),
        label: `contribution term ${suffix}`,
        type: 'Term',
      },
    })
  })
})
