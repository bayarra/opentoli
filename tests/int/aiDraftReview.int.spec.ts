import { enqueueGenerationJob, processGenerationJob } from '@/ai/pipeline/jobs'
import { DeterministicAIProvider } from '@/ai/providers/deterministic'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { decideAIDraft, parseAIDraftDecisionInput } from '@/review/decideAIDraft'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let payload: Payload
let admin: User
let reviewer: User | undefined
let languageExpert: User | undefined
let domainReviewer: User | undefined
let moderator: User | undefined
let contributor: User | undefined
let technologyCategoryId: number
let medicineCategoryId: number
let medicineCategoryCreated = false
let medicineCategoryName: string
const termIds: number[] = []
const translationIds: number[] = []
const sourceIds: number[] = []
const jobIds: number[] = []
const draftIds: number[] = []
const decisionIds: number[] = []
const suffix = `${process.pid}-${Date.now()}`

const createPreparedDraft = async ({
  categoryId,
  categoryName,
  categorySlug,
  headword,
}: {
  categoryId: number
  categoryName: string
  categorySlug: string
  headword: string
}) => {
  const term = await payload.create({
    collection: 'terms',
    data: {
      categories: [categoryId],
      explanationEn: `Source container for ${headword}.`,
      explanationMn: `Source container for ${headword}.`,
      headwordEn: headword,
      reviewStatus: 'not_reviewed',
      shortDefinitionEn: `Source container for ${headword}.`,
      workflowStatus: 'needs_review',
    },
    draft: true,
    overrideAccess: true,
  })
  termIds.push(term.id)
  const source = await payload.create({
    collection: 'sources',
    data: {
      isVerified: true,
      publisher: 'OpenToli Review Tests',
      sourceType: 'official_documentation',
      term: term.id,
      title: `Review source for ${headword}`,
      url: `https://example.com/${encodeURIComponent(headword)}`,
    },
    overrideAccess: true,
  })
  sourceIds.push(source.id)
  const provider = new DeterministicAIProvider()
  const queued = await enqueueGenerationJob({
    payload,
    preparation: {
      category: { id: categoryId, nameEn: categoryName, slug: categorySlug },
      headwordEn: headword,
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
  jobIds.push(queued.job.id)
  const result = await processGenerationJob({ jobId: queued.job.id, payload, provider })
  if (!result.draft) throw new Error('Review test AI draft was not generated.')
  draftIds.push(result.draft.id)
  return result.draft
}

const recordDecisionIds = async (draftId: number) => {
  const decisions = await payload.find({
    collection: 'ai-draft-decisions',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    where: { aiDraft: { equals: draftId } },
  })
  for (const decision of decisions.docs) {
    if (!decisionIds.includes(decision.id)) decisionIds.push(decision.id)
    const translationId =
      typeof decision.resultingTranslation === 'number'
        ? decision.resultingTranslation
        : decision.resultingTranslation?.id
    if (translationId && !translationIds.includes(translationId)) translationIds.push(translationId)
  }
}

describe('AI draft reviewer workflow', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    admin = await payload.create({
      collection: 'users',
      data: {
        email: `review-admin-${suffix}@opentoli.local`,
        name: 'Review Admin',
        password: `review-admin-${suffix}-password`,
        role: 'admin',
      },
      overrideAccess: true,
    })
    const technology = await payload.create({
      collection: 'categories',
      data: {
        displayOrder: 996,
        isActive: true,
        nameEn: `Review Technology ${suffix}`,
        nameMn: `Review Technology ${suffix}`,
        slug: `review-technology-${suffix}`,
      },
      overrideAccess: true,
    })
    technologyCategoryId = technology.id
    const existingMedicine = await payload.find({
      collection: 'categories',
      limit: 1,
      overrideAccess: true,
      where: { slug: { equals: 'medicine-health' } },
    })
    const medicine =
      existingMedicine.docs[0] ||
      (await payload.create({
        collection: 'categories',
        data: {
          displayOrder: 997,
          isActive: true,
          nameEn: `Review Medicine ${suffix}`,
          nameMn: `Review Medicine ${suffix}`,
          slug: 'medicine-health',
        },
        overrideAccess: true,
      }))
    medicineCategoryCreated = !existingMedicine.docs[0]
    medicineCategoryId = medicine.id
    medicineCategoryName = medicine.nameEn

    const createUser = (name: string, role: User['role'], areasOfExpertise?: number[]) =>
      payload.create({
        collection: 'users',
        data: {
          areasOfExpertise,
          email: `${name.toLocaleLowerCase('en-US').replaceAll(' ', '-')}-${suffix}@opentoli.local`,
          name,
          password: `${name}-${suffix}-password`,
          role,
        },
        overrideAccess: true,
      })
    reviewer = await createUser('Review Reviewer', 'reviewer')
    languageExpert = await createUser('Review Language Expert', 'language_expert')
    domainReviewer = await createUser('Review Domain Expert', 'reviewer', [medicine.id])
    moderator = await createUser('Review Moderator', 'moderator')
    contributor = await createUser('Review Contributor', 'contributor')
  })

  afterAll(async () => {
    for (const draftId of draftIds) await recordDecisionIds(draftId)
    for (const id of decisionIds.reverse()) {
      await payload.delete({ collection: 'ai-draft-decisions', id, overrideAccess: true })
    }
    for (const id of draftIds.reverse()) {
      await payload.delete({ collection: 'ai-drafts', id, overrideAccess: true })
    }
    for (const id of jobIds.reverse()) {
      await payload.delete({ collection: 'generation-jobs', id, overrideAccess: true })
    }
    for (const id of sourceIds.reverse()) {
      await payload.delete({ collection: 'sources', id, overrideAccess: true })
    }
    for (const id of translationIds.reverse()) {
      await payload.delete({ collection: 'translations', id, overrideAccess: true })
    }
    for (const id of termIds.reverse()) {
      await payload.delete({ collection: 'terms', id, overrideAccess: true })
    }
    for (const id of [
      contributor?.id,
      moderator?.id,
      domainReviewer?.id,
      languageExpert?.id,
      reviewer?.id,
      admin?.id,
    ].filter((id): id is number => typeof id === 'number')) {
      await payload.delete({ collection: 'users', id, overrideAccess: true })
    }
    if (medicineCategoryCreated && medicineCategoryId) {
      await payload.delete({
        collection: 'categories',
        id: medicineCategoryId,
        overrideAccess: true,
      })
    }
    if (technologyCategoryId) {
      await payload.delete({
        collection: 'categories',
        id: technologyCategoryId,
        overrideAccess: true,
      })
    }
  })

  it('requires the assigned expertise and materializes modifications as unpublished drafts', async () => {
    if (!reviewer || !languageExpert || !contributor) throw new Error('Review users are missing.')
    const draft = await createPreparedDraft({
      categoryId: technologyCategoryId,
      categoryName: `Review Technology ${suffix}`,
      categorySlug: `review-technology-${suffix}`,
      headword: `review modification ${suffix}`,
    })
    expect(draft.reviewRoute).toBe('language_review')

    await expect(
      decideAIDraft({
        actorId: reviewer.id,
        draftId: draft.id,
        input: parseAIDraftDecisionInput({ action: 'accept', notes: 'General acceptance.' }),
        payload,
      }),
    ).rejects.toThrow('requires a language expert')
    await expect(
      decideAIDraft({
        actorId: contributor.id,
        draftId: draft.id,
        input: parseAIDraftDecisionInput({
          action: 'reject',
          notes: 'Not authorized.',
          rejectionReasons: ['No access'],
        }),
        payload,
      }),
    ).rejects.toThrow('Editorial reviewer access')

    const result = await decideAIDraft({
      actorId: languageExpert.id,
      draftId: draft.id,
      input: parseAIDraftDecisionInput({
        action: 'modify',
        notes: 'Selected a more natural Mongolian form.',
        selectedTranslationMn: `reviewed Mongolian wording ${suffix}`,
      }),
      payload,
    })
    decisionIds.push(result.decision.id)
    if (!result.term || !result.translation) throw new Error('Canonical drafts were not created.')
    if (!termIds.includes(result.term.id)) termIds.push(result.term.id)
    translationIds.push(result.translation.id)

    expect(result.draft).toMatchObject({
      publicVisibility: 'private',
      reviewOutcome: 'modified',
      status: 'partially_accepted',
    })
    expect(result.term).toMatchObject({
      _status: 'draft',
      reviewStatus: 'expert_reviewed',
      workflowStatus: 'reviewed',
    })
    expect(result.translation).toMatchObject({ status: 'needs_review' })
    const publicTerms = await payload.find({
      collection: 'terms',
      overrideAccess: false,
      where: { id: { equals: result.term.id } },
    })
    expect(publicTerms.docs).toHaveLength(0)
    await expect(
      payload.update({
        collection: 'ai-drafts',
        data: { status: 'rejected' },
        id: draft.id,
        overrideAccess: true,
      }),
    ).rejects.toThrow('reviewer workspace')
  })

  it('prevents high-risk route reduction and accepts only a matching domain expert', async () => {
    if (!reviewer || !moderator || !domainReviewer) throw new Error('Review users are missing.')
    const draft = await createPreparedDraft({
      categoryId: medicineCategoryId,
      categoryName: medicineCategoryName,
      categorySlug: 'medicine-health',
      headword: `review medical term ${suffix}`,
    })
    expect(draft).toMatchObject({ reviewRoute: 'domain_review', riskLevel: 'high' })

    await expect(
      decideAIDraft({
        actorId: reviewer.id,
        draftId: draft.id,
        input: parseAIDraftDecisionInput({ action: 'accept', notes: 'No domain expertise.' }),
        payload,
      }),
    ).rejects.toThrow('expertise in its category')
    await expect(
      decideAIDraft({
        actorId: moderator.id,
        draftId: draft.id,
        input: parseAIDraftDecisionInput({
          action: 'reroute',
          newReviewRoute: 'fast_review',
          notes: 'Attempted reduced route.',
        }),
        payload,
      }),
    ).rejects.toThrow('cannot be moved to a reduced review route')

    const result = await decideAIDraft({
      actorId: domainReviewer.id,
      draftId: draft.id,
      input: parseAIDraftDecisionInput({ action: 'accept', notes: 'Domain meaning verified.' }),
      payload,
    })
    decisionIds.push(result.decision.id)
    if (!result.translation || !result.term) throw new Error('Domain drafts were not materialized.')
    translationIds.push(result.translation.id)
    expect(result.draft.status).toBe('accepted')
    expect(result.term._status).toBe('draft')
  })

  it('records reroute and merge actions without mutating the merge target', async () => {
    if (!moderator) throw new Error('Review moderator is missing.')
    const draft = await createPreparedDraft({
      categoryId: technologyCategoryId,
      categoryName: `Review Technology ${suffix}`,
      categorySlug: `review-technology-${suffix}`,
      headword: `review duplicate ${suffix}`,
    })
    const target = await payload.create({
      collection: 'terms',
      data: {
        categories: [technologyCategoryId],
        explanationEn: 'Canonical duplicate target.',
        explanationMn: 'Canonical duplicate target.',
        headwordEn: `canonical duplicate ${suffix}`,
        reviewStatus: 'human_reviewed',
        shortDefinitionEn: 'Canonical duplicate target.',
        workflowStatus: 'reviewed',
      },
      draft: true,
      overrideAccess: true,
    })
    termIds.push(target.id)

    const rerouted = await decideAIDraft({
      actorId: moderator.id,
      draftId: draft.id,
      input: parseAIDraftDecisionInput({
        action: 'reroute',
        newReviewRoute: 'duplicate_review',
        notes: 'Likely duplicate found.',
      }),
      payload,
    })
    decisionIds.push(rerouted.decision.id)
    expect(rerouted.draft.reviewRoute).toBe('duplicate_review')

    const merged = await decideAIDraft({
      actorId: moderator.id,
      draftId: draft.id,
      input: parseAIDraftDecisionInput({
        action: 'merge',
        mergeTargetTermId: target.id,
        notes: 'Confirmed duplicate of canonical target.',
      }),
      payload,
    })
    decisionIds.push(merged.decision.id)
    expect(merged.draft).toMatchObject({ reviewOutcome: 'merged', status: 'rejected' })
    const unchangedTarget = await payload.findByID({
      collection: 'terms',
      draft: true,
      id: target.id,
      overrideAccess: true,
    })
    expect(unchangedTarget.explanationEn).toBe('Canonical duplicate target.')
  })

  it('requires and retains rejection reasons in the immutable decision ledger', async () => {
    if (!reviewer) throw new Error('Review reviewer is missing.')
    const draft = await createPreparedDraft({
      categoryId: technologyCategoryId,
      categoryName: `Review Technology ${suffix}`,
      categorySlug: `review-technology-${suffix}`,
      headword: `review rejection ${suffix}`,
    })
    await expect(
      decideAIDraft({
        actorId: reviewer.id,
        draftId: draft.id,
        input: parseAIDraftDecisionInput({ action: 'reject', notes: 'Rejected after review.' }),
        payload,
      }),
    ).rejects.toThrow('rejection reason')

    const result = await decideAIDraft({
      actorId: reviewer.id,
      draftId: draft.id,
      input: parseAIDraftDecisionInput({
        action: 'reject',
        notes: 'Source meaning does not support this wording.',
        rejectionReasons: ['Unsupported semantic claim'],
      }),
      payload,
    })
    decisionIds.push(result.decision.id)
    expect(result.draft).toMatchObject({ reviewOutcome: 'rejected', status: 'rejected' })
    expect(result.decision.rejectionReasons).toEqual(['Unsupported semantic claim'])
    await expect(
      payload.update({
        collection: 'ai-draft-decisions',
        data: { notes: 'Tampered audit entry.' },
        id: result.decision.id,
        overrideAccess: false,
        user: admin,
      }),
    ).rejects.toThrow()
  })
})
