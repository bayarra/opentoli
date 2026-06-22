import { validateGenerationOutputV1, validateResearchPacketV1 } from '@/ai/schemas/v1'
import type { AiDraft, Term, Translation, User } from '@/payload-types'
import {
  commitTransaction,
  createLocalReq,
  initTransaction,
  killTransaction,
  type Payload,
} from 'payload'

import { getRole } from '../access/roles'
import {
  assertCanReviewAIDraft,
  assertSafeReroute,
  relationshipId,
  reviewActions,
  type ReviewAction,
} from './permissions'

const materializedFields = [
  'headwordEn',
  'recommendedTranslationMn',
  'explanationEn',
  'explanationMn',
] as const

type MaterializedField = (typeof materializedFields)[number]

export type AIDraftDecisionInput = {
  action: ReviewAction
  explanationEn?: string
  explanationMn?: string
  headwordEn?: string
  mergeTargetTermId?: number
  newReviewRoute?: AiDraft['reviewRoute']
  notes: string
  rejectionReasons?: string[]
  selectedTranslationMn?: string
}

export class ReviewDecisionError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message)
    this.name = 'ReviewDecisionError'
  }
}

const requiredText = (value: unknown, label: string): string => {
  if (typeof value !== 'string' || value.trim().length < 2) {
    throw new ReviewDecisionError(`${label} is required.`)
  }
  return value.trim()
}

export const parseAIDraftDecisionInput = (value: unknown): AIDraftDecisionInput => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ReviewDecisionError('Decision details are required.')
  }
  const input = value as Record<string, unknown>
  if (!reviewActions.includes(input.action as ReviewAction)) {
    throw new ReviewDecisionError('Choose a valid review action.')
  }

  const rejectionReasons = Array.isArray(input.rejectionReasons)
    ? input.rejectionReasons
        .filter((reason): reason is string => typeof reason === 'string')
        .map((reason) => reason.trim())
        .filter(Boolean)
    : typeof input.rejectionReasons === 'string'
      ? input.rejectionReasons
          .split('\n')
          .map((reason) => reason.trim())
          .filter(Boolean)
      : undefined

  const numberValue = Number(input.mergeTargetTermId)
  return {
    action: input.action as ReviewAction,
    explanationEn: typeof input.explanationEn === 'string' ? input.explanationEn.trim() : undefined,
    explanationMn: typeof input.explanationMn === 'string' ? input.explanationMn.trim() : undefined,
    headwordEn: typeof input.headwordEn === 'string' ? input.headwordEn.trim() : undefined,
    mergeTargetTermId: Number.isInteger(numberValue) && numberValue > 0 ? numberValue : undefined,
    newReviewRoute:
      typeof input.newReviewRoute === 'string'
        ? (input.newReviewRoute as AiDraft['reviewRoute'])
        : undefined,
    notes: requiredText(input.notes, 'Reviewer notes'),
    rejectionReasons,
    selectedTranslationMn:
      typeof input.selectedTranslationMn === 'string'
        ? input.selectedTranslationMn.trim()
        : undefined,
  }
}

const reviewStatusFor = (user: User): 'human_reviewed' | 'expert_reviewed' =>
  getRole(user) === 'language_expert' || (user.areasOfExpertise || []).length > 0
    ? 'expert_reviewed'
    : 'human_reviewed'

const relationIds = (values: unknown): number[] =>
  Array.isArray(values)
    ? values.map(relationshipId).filter((id): id is number => typeof id === 'number')
    : []

const decisionFieldValues = (
  draft: AiDraft,
  input: AIDraftDecisionInput,
): Record<MaterializedField, string> => {
  const generated = validateGenerationOutputV1(draft.generatedPayload)
  const accepted = {
    explanationEn: generated.explanationEn,
    explanationMn: generated.explanationMn,
    headwordEn: generated.headwordEn,
    recommendedTranslationMn: generated.recommendedTranslationMn,
  }
  if (input.action !== 'modify') return accepted

  return {
    explanationEn: requiredText(
      input.explanationEn || accepted.explanationEn,
      'English explanation',
    ),
    explanationMn: requiredText(
      input.explanationMn || accepted.explanationMn,
      'Mongolian explanation',
    ),
    headwordEn: requiredText(input.headwordEn || accepted.headwordEn, 'English headword'),
    recommendedTranslationMn: requiredText(
      input.selectedTranslationMn || accepted.recommendedTranslationMn,
      'Mongolian translation',
    ),
  }
}

const fieldOutcome = (draft: AiDraft, values: Record<MaterializedField, string>) => {
  const generated = validateGenerationOutputV1(draft.generatedPayload)
  const original: Record<MaterializedField, string> = {
    explanationEn: generated.explanationEn,
    explanationMn: generated.explanationMn,
    headwordEn: generated.headwordEn,
    recommendedTranslationMn: generated.recommendedTranslationMn,
  }
  const acceptedFields: string[] = []
  const modifiedFields: Record<string, { from: string; to: string }> = {}

  for (const field of materializedFields) {
    if (values[field] === original[field]) acceptedFields.push(field)
    else modifiedFields[field] = { from: original[field], to: values[field] }
  }
  return { acceptedFields, modifiedFields }
}

const materializeCanonicalDraft = async ({
  actor,
  draft,
  input,
  payload,
  req,
}: {
  actor: User
  draft: AiDraft
  input: AIDraftDecisionInput
  payload: Payload
  req: Awaited<ReturnType<typeof createLocalReq>>
}): Promise<{
  acceptedFields: string[]
  modifiedFields: Record<string, { from: string; to: string }>
  term: Term
  translation: Translation
  values: Record<MaterializedField, string>
}> => {
  const values = decisionFieldValues(draft, input)
  const outcomes = fieldOutcome(draft, values)
  if (input.action === 'modify' && Object.keys(outcomes.modifiedFields).length === 0) {
    throw new ReviewDecisionError('A modified decision must change at least one generated field.')
  }

  const research = validateResearchPacketV1(draft.researchPayload)
  const categoryId = relationshipId(draft.inputCategory)
  if (!categoryId) throw new ReviewDecisionError('The AI draft category is missing.')
  const contextId = relationshipId(draft.inputContext)
  const existingTermId = relationshipId(draft.term)
  let term: Term

  if (existingTermId) {
    const existingTerm = await payload.findByID({
      collection: 'terms',
      depth: 0,
      id: existingTermId,
      overrideAccess: true,
      req,
    })
    const categories = [...new Set([...relationIds(existingTerm.categories), categoryId])]
    const contexts = contextId
      ? [...new Set([...relationIds(existingTerm.contexts), contextId])]
      : relationIds(existingTerm.contexts)
    term = await payload.update({
      collection: 'terms',
      data: {
        categories,
        contexts,
        explanationEn: values.explanationEn,
        explanationMn: values.explanationMn,
        headwordEn: values.headwordEn,
        reviewedBy: actor.id,
        reviewStatus: reviewStatusFor(actor),
        shortDefinitionEn: research.canonicalMeaning,
        workflowStatus: 'reviewed',
      },
      draft: true,
      id: existingTerm.id,
      overrideAccess: true,
      req,
    })
  } else {
    const duplicate = await payload.find({
      collection: 'terms',
      depth: 0,
      draft: true,
      limit: 1,
      overrideAccess: true,
      req,
      where: {
        normalizedHeadwordEn: { equals: values.headwordEn.toLocaleLowerCase('en-US') },
      },
    })
    if (duplicate.docs[0]) {
      throw new ReviewDecisionError(
        `A canonical Term already exists for this headword. Merge into Term ${duplicate.docs[0].id} instead.`,
        409,
      )
    }
    term = await payload.create({
      collection: 'terms',
      data: {
        categories: [categoryId],
        contexts: contextId ? [contextId] : [],
        createdBy: actor.id,
        explanationEn: values.explanationEn,
        explanationMn: values.explanationMn,
        headwordEn: values.headwordEn,
        reviewedBy: actor.id,
        reviewStatus: reviewStatusFor(actor),
        shortDefinitionEn: research.canonicalMeaning,
        workflowStatus: 'reviewed',
      },
      draft: true,
      overrideAccess: true,
      req,
    })
  }

  const existingTranslations = await payload.find({
    collection: 'translations',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: {
      and: [
        { term: { equals: term.id } },
        { translationMn: { equals: values.recommendedTranslationMn } },
      ],
    },
  })
  let translation = existingTranslations.docs[0]
  if (!translation) {
    translation = await payload.create({
      collection: 'translations',
      data: {
        context: contextId,
        explanationEn: values.explanationEn,
        explanationMn: values.explanationMn,
        register: 'general',
        reviewedBy: actor.id,
        reviewStatus: reviewStatusFor(actor),
        status: 'needs_review',
        term: term.id,
        translationMn: values.recommendedTranslationMn,
        translationType: 'recommended',
      },
      overrideAccess: true,
      req,
    })
  }

  term = await payload.update({
    collection: 'terms',
    data: { recommendedTranslation: translation.id },
    draft: true,
    id: term.id,
    overrideAccess: true,
    req,
  })

  return { ...outcomes, term, translation, values }
}

export const decideAIDraft = async ({
  actorId,
  draftId,
  input,
  payload,
}: {
  actorId: number
  draftId: number
  input: AIDraftDecisionInput
  payload: Payload
}) => {
  const actor = await payload.findByID({
    collection: 'users',
    depth: 1,
    id: actorId,
    overrideAccess: true,
  })
  const draft = await payload.findByID({
    collection: 'ai-drafts',
    depth: 1,
    id: draftId,
    overrideAccess: true,
  })
  if (!['needs_review', 'editing'].includes(draft.status)) {
    throw new ReviewDecisionError(
      'This AI draft is not review-ready or has already been resolved.',
      409,
    )
  }

  try {
    assertCanReviewAIDraft({ action: input.action, draft, user: actor })
  } catch (error) {
    throw new ReviewDecisionError(error instanceof Error ? error.message : 'Review denied.', 403)
  }

  const req = await createLocalReq({ context: { aiDraftDecision: true }, user: actor }, payload)
  await initTransaction(req)

  try {
    const decisionAt = new Date().toISOString()
    if (input.action === 'reroute') {
      if (!input.newReviewRoute) throw new ReviewDecisionError('Choose a new review route.')
      try {
        assertSafeReroute(draft, input.newReviewRoute)
      } catch (error) {
        throw new ReviewDecisionError(error instanceof Error ? error.message : 'Invalid route.')
      }
      const updatedDraft = await payload.update({
        collection: 'ai-drafts',
        context: { aiDraftDecision: true },
        data: {
          publicVisibility: input.newReviewRoute === 'blocked' ? 'private' : draft.publicVisibility,
          reviewRoute: input.newReviewRoute,
        },
        id: draft.id,
        overrideAccess: true,
        req,
      })
      const decision = await payload.create({
        collection: 'ai-draft-decisions',
        data: {
          action: input.action,
          actor: actor.id,
          aiDraft: draft.id,
          decisionAt,
          newReviewRoute: input.newReviewRoute,
          newStatus: draft.status,
          notes: input.notes,
          previousReviewRoute: draft.reviewRoute,
          previousStatus: draft.status,
          riskLevel: draft.riskLevel,
        },
        overrideAccess: true,
        req,
      })
      await commitTransaction(req)
      return { decision, draft: updatedDraft }
    }

    if (input.action === 'merge') {
      if (!input.mergeTargetTermId) {
        throw new ReviewDecisionError('Choose the canonical Term to merge into.')
      }
      if (input.mergeTargetTermId === relationshipId(draft.term)) {
        throw new ReviewDecisionError('The merge target must be a different canonical Term.')
      }
      const mergeTarget = await payload.findByID({
        collection: 'terms',
        depth: 0,
        id: input.mergeTargetTermId,
        overrideAccess: true,
        req,
      })
      const updatedDraft = await payload.update({
        collection: 'ai-drafts',
        context: { aiDraftDecision: true },
        data: {
          decidedAt: decisionAt,
          mergedIntoTerm: mergeTarget.id,
          publicVisibility: 'private',
          rejectionReasons: ['Merged with an existing canonical Term.'],
          reviewOutcome: 'merged',
          reviewedBy: actor.id,
          status: 'rejected',
        },
        id: draft.id,
        overrideAccess: true,
        req,
      })
      const decision = await payload.create({
        collection: 'ai-draft-decisions',
        data: {
          action: input.action,
          actor: actor.id,
          aiDraft: draft.id,
          decisionAt,
          mergeTargetTerm: mergeTarget.id,
          newReviewRoute: draft.reviewRoute,
          newStatus: 'rejected',
          notes: input.notes,
          previousReviewRoute: draft.reviewRoute,
          previousStatus: draft.status,
          rejectionReasons: ['Merged with an existing canonical Term.'],
          riskLevel: draft.riskLevel,
        },
        overrideAccess: true,
        req,
      })
      await commitTransaction(req)
      return { decision, draft: updatedDraft, term: mergeTarget }
    }

    if (input.action === 'reject') {
      if (!input.rejectionReasons?.length) {
        throw new ReviewDecisionError('At least one rejection reason is required.')
      }
      const updatedDraft = await payload.update({
        collection: 'ai-drafts',
        context: { aiDraftDecision: true },
        data: {
          decidedAt: decisionAt,
          publicVisibility: 'private',
          rejectionReasons: input.rejectionReasons,
          reviewOutcome: 'rejected',
          reviewedBy: actor.id,
          status: 'rejected',
        },
        id: draft.id,
        overrideAccess: true,
        req,
      })
      const decision = await payload.create({
        collection: 'ai-draft-decisions',
        data: {
          action: input.action,
          actor: actor.id,
          aiDraft: draft.id,
          decisionAt,
          newReviewRoute: draft.reviewRoute,
          newStatus: 'rejected',
          notes: input.notes,
          previousReviewRoute: draft.reviewRoute,
          previousStatus: draft.status,
          rejectionReasons: input.rejectionReasons,
          riskLevel: draft.riskLevel,
        },
        overrideAccess: true,
        req,
      })
      await commitTransaction(req)
      return { decision, draft: updatedDraft }
    }

    const materialized = await materializeCanonicalDraft({ actor, draft, input, payload, req })
    const status = input.action === 'accept' ? 'accepted' : 'partially_accepted'
    const updatedDraft = await payload.update({
      collection: 'ai-drafts',
      context: { aiDraftDecision: true },
      data: {
        acceptedFields: materialized.acceptedFields,
        decidedAt: decisionAt,
        modifiedFields: materialized.modifiedFields,
        publicVisibility: 'private',
        reviewOutcome: input.action === 'accept' ? 'accepted' : 'modified',
        reviewedBy: actor.id,
        status,
        term: materialized.term.id,
      },
      id: draft.id,
      overrideAccess: true,
      req,
    })
    const decision = await payload.create({
      collection: 'ai-draft-decisions',
      data: {
        acceptedFields: materialized.acceptedFields,
        action: input.action,
        actor: actor.id,
        aiDraft: draft.id,
        decisionAt,
        modifiedFields: materialized.modifiedFields,
        newReviewRoute: draft.reviewRoute,
        newStatus: status,
        notes: input.notes,
        previousReviewRoute: draft.reviewRoute,
        previousStatus: draft.status,
        resultingTerm: materialized.term.id,
        resultingTranslation: materialized.translation.id,
        riskLevel: draft.riskLevel,
        selectedTranslationMn: materialized.values.recommendedTranslationMn,
      },
      overrideAccess: true,
      req,
    })
    await commitTransaction(req)
    return {
      decision,
      draft: updatedDraft,
      term: materialized.term,
      translation: materialized.translation,
    }
  } catch (error) {
    await killTransaction(req)
    throw error
  }
}
