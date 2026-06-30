import { validateGenerationOutputV1, validateResearchPacketV1 } from '@/ai/schemas/v1'
import type { AiDraft, Term, Translation, User } from '@/payload-types'
import {
  commitTransaction,
  createLocalReq,
  initTransaction,
  killTransaction,
  type Payload,
} from 'payload'

import { isEditorUser, relationshipId } from './permissions'

const editableFieldNames = [
  'headwordEn',
  'recommendedTranslationMn',
  'explanationEn',
  'explanationMn',
] as const
type EditableFieldName = (typeof editableFieldNames)[number]

export type EditorDraftFields = Record<EditableFieldName, string>

export class EditorWorkflowError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message)
    this.name = 'EditorWorkflowError'
  }
}

const requiredText = (value: unknown, label: string): string => {
  if (typeof value !== 'string' || value.trim().length < 2) {
    throw new EditorWorkflowError(`${label} is required.`)
  }
  return value.trim()
}

export const parseEditorDraftFields = (value: unknown): EditorDraftFields => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new EditorWorkflowError('Draft fields are required.')
  }
  const input = value as Record<string, unknown>
  return {
    explanationEn: requiredText(input.explanationEn, 'English explanation'),
    explanationMn: requiredText(input.explanationMn, 'Mongolian explanation'),
    headwordEn: requiredText(input.headwordEn, 'English headword'),
    recommendedTranslationMn: requiredText(input.recommendedTranslationMn, 'Mongolian translation'),
  }
}

const loadEditorAndDraft = async (payload: Payload, actorId: number, draftId: number) => {
  const actor = await payload.findByID({
    collection: 'users',
    depth: 1,
    id: actorId,
    overrideAccess: true,
  })
  if (!isEditorUser(actor)) throw new EditorWorkflowError('Editor access is required.', 403)
  const draft = await payload.findByID({
    collection: 'ai-drafts',
    depth: 2,
    id: draftId,
    overrideAccess: true,
  })
  if (!['editing', 'needs_review'].includes(draft.status)) {
    throw new EditorWorkflowError('This draft is no longer active.', 409)
  }
  return { actor, draft }
}

const originalGeneration = async (payload: Payload, draft: AiDraft) => {
  const jobId = relationshipId(draft.generationJob)
  if (!jobId) return validateGenerationOutputV1(draft.generatedPayload)
  const job = await payload.findByID({
    collection: 'generation-jobs',
    depth: 0,
    id: jobId,
    overrideAccess: true,
  })
  try {
    return validateGenerationOutputV1(job.generationRawOutput)
  } catch {
    return validateGenerationOutputV1(draft.generatedPayload)
  }
}

const fieldOutcomes = async (payload: Payload, draft: AiDraft, fields: EditorDraftFields) => {
  const original = await originalGeneration(payload, draft)
  const acceptedFields: string[] = []
  const modifiedFields: Record<string, { from: string; to: string }> = {}
  for (const field of editableFieldNames) {
    if (fields[field] === original[field]) acceptedFields.push(field)
    else modifiedFields[field] = { from: original[field], to: fields[field] }
  }
  return { acceptedFields, modifiedFields }
}

export const saveEditorDraft = async ({
  actorId,
  draftId,
  fields,
  payload,
}: {
  actorId: number
  draftId: number
  fields: EditorDraftFields
  payload: Payload
}) => {
  const { actor, draft } = await loadEditorAndDraft(payload, actorId, draftId)
  const generated = validateGenerationOutputV1(draft.generatedPayload)
  const generatedPayload = validateGenerationOutputV1({ ...generated, ...fields })
  const outcomes = await fieldOutcomes(payload, draft, fields)
  const req = await createLocalReq({ user: actor }, payload)

  return payload.update({
    collection: 'ai-drafts',
    data: {
      acceptedFields: outcomes.acceptedFields,
      generatedPayload,
      inputHeadword: fields.headwordEn,
      modifiedFields: outcomes.modifiedFields,
      status: 'editing',
    },
    id: draft.id,
    overrideAccess: true,
    req,
  })
}

const relationIds = (values: unknown): number[] =>
  Array.isArray(values)
    ? values.map(relationshipId).filter((id): id is number => typeof id === 'number')
    : []

const materializePublishedTerm = async ({
  actor,
  draft,
  payload,
  req,
}: {
  actor: User
  draft: AiDraft
  payload: Payload
  req: Awaited<ReturnType<typeof createLocalReq>>
}): Promise<{ term: Term; translation: Translation }> => {
  const generated = validateGenerationOutputV1(draft.generatedPayload)
  const research = validateResearchPacketV1(draft.researchPayload)
  const categoryId = relationshipId(draft.inputCategory)
  if (!categoryId) throw new EditorWorkflowError('The draft category is missing.')
  const contextId = relationshipId(draft.inputContext)
  const existingTermId = relationshipId(draft.term)
  let term: Term

  if (existingTermId) {
    const existing = await payload.findByID({
      collection: 'terms',
      depth: 0,
      draft: true,
      id: existingTermId,
      overrideAccess: true,
      req,
    })
    term = await payload.update({
      collection: 'terms',
      data: {
        categories: [...new Set([...relationIds(existing.categories), categoryId])],
        contexts: contextId
          ? [...new Set([...relationIds(existing.contexts), contextId])]
          : relationIds(existing.contexts),
        explanationEn: generated.explanationEn,
        explanationMn: generated.explanationMn,
        headwordEn: generated.headwordEn,
        reviewedBy: actor.id,
        reviewStatus: 'human_reviewed',
        shortDefinitionEn: research.canonicalMeaning,
        workflowStatus: 'approved',
      },
      draft: true,
      id: existing.id,
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
        normalizedHeadwordEn: { equals: generated.headwordEn.toLocaleLowerCase('en-US') },
      },
    })
    if (duplicate.docs[0]) {
      throw new EditorWorkflowError('A Term already exists for this headword.', 409)
    }
    term = await payload.create({
      collection: 'terms',
      data: {
        approvedBy: actor.id,
        categories: [categoryId],
        contexts: contextId ? [contextId] : [],
        createdBy: actor.id,
        explanationEn: generated.explanationEn,
        explanationMn: generated.explanationMn,
        headwordEn: generated.headwordEn,
        reviewedBy: actor.id,
        reviewStatus: 'human_reviewed',
        shortDefinitionEn: research.canonicalMeaning,
        workflowStatus: 'approved',
      },
      draft: true,
      overrideAccess: true,
      req,
    })
  }

  const translations = await payload.find({
    collection: 'translations',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: {
      and: [
        { term: { equals: term.id } },
        { translationMn: { equals: generated.recommendedTranslationMn } },
      ],
    },
  })
  let translation = translations.docs[0]
  if (translation) {
    translation = await payload.update({
      collection: 'translations',
      data: {
        reviewedBy: actor.id,
        reviewStatus: 'human_reviewed',
        status: 'approved',
        translationType: 'recommended',
      },
      id: translation.id,
      overrideAccess: true,
      req,
    })
  } else {
    translation = await payload.create({
      collection: 'translations',
      data: {
        context: contextId,
        explanationEn: generated.explanationEn,
        explanationMn: generated.explanationMn,
        register: 'general',
        reviewedBy: actor.id,
        reviewStatus: 'human_reviewed',
        status: 'approved',
        term: term.id,
        translationMn: generated.recommendedTranslationMn,
        translationType: 'recommended',
      },
      overrideAccess: true,
      req,
    })
  }

  term = await payload.update({
    collection: 'terms',
    data: {
      _status: 'published',
      approvedBy: actor.id,
      recommendedTranslation: translation.id,
      reviewedBy: actor.id,
      reviewStatus: 'human_reviewed',
      workflowStatus: 'approved',
    },
    draft: false,
    id: term.id,
    overrideAccess: false,
    req,
  })
  return { term, translation }
}

export const publishEditorDraft = async ({
  actorId,
  draftId,
  payload,
}: {
  actorId: number
  draftId: number
  payload: Payload
}) => {
  const { actor, draft } = await loadEditorAndDraft(payload, actorId, draftId)

  const req = await createLocalReq({ context: { aiDraftDecision: true }, user: actor }, payload)
  await initTransaction(req)
  try {
    const result = await materializePublishedTerm({ actor, draft, payload, req })
    const outcomes = await fieldOutcomes(
      payload,
      draft,
      parseEditorDraftFields(validateGenerationOutputV1(draft.generatedPayload)),
    )
    const modified = Object.keys(outcomes.modifiedFields).length > 0
    const decisionAt = new Date().toISOString()
    const updatedDraft = await payload.update({
      collection: 'ai-drafts',
      context: { aiDraftDecision: true },
      data: {
        acceptedFields: outcomes.acceptedFields,
        decidedAt: decisionAt,
        modifiedFields: outcomes.modifiedFields,
        publicVisibility: 'private',
        reviewOutcome: modified ? 'modified' : 'accepted',
        reviewedBy: actor.id,
        status: modified ? 'partially_accepted' : 'accepted',
        term: result.term.id,
      },
      id: draft.id,
      overrideAccess: true,
      req,
    })
    const decision = await payload.create({
      collection: 'ai-draft-decisions',
      data: {
        acceptedFields: outcomes.acceptedFields,
        action: modified ? 'modify' : 'accept',
        actor: actor.id,
        aiDraft: draft.id,
        decisionAt,
        modifiedFields: outcomes.modifiedFields,
        newReviewRoute: draft.reviewRoute,
        newStatus: updatedDraft.status,
        notes: 'Published through the simple editor workflow.',
        previousReviewRoute: draft.reviewRoute,
        previousStatus: draft.status,
        resultingTerm: result.term.id,
        resultingTranslation: result.translation.id,
        riskLevel: draft.riskLevel,
        selectedTranslationMn: result.translation.translationMn,
      },
      overrideAccess: true,
      req,
    })
    await payload.create({
      collection: 'reviews',
      data: {
        decision: 'approved',
        notes: 'Published through the simple editor workflow.',
        reviewType: 'final_approval',
        reviewer: actor.id,
        term: result.term.id,
        translation: result.translation.id,
      },
      overrideAccess: true,
      req,
    })
    await commitTransaction(req)
    return { decision, draft: updatedDraft, ...result }
  } catch (error) {
    await killTransaction(req)
    throw error
  }
}

export const updateEditorDraftVisibility = async ({
  actorId,
  draftId,
  payload,
  visibility,
}: {
  actorId: number
  draftId: number
  payload: Payload
  visibility: 'private' | 'public'
}) => {
  const { actor, draft } = await loadEditorAndDraft(payload, actorId, draftId)

  const req = await createLocalReq({ user: actor }, payload)
  return payload.update({
    collection: 'ai-drafts',
    data: { publicVisibility: visibility },
    id: draft.id,
    overrideAccess: false,
    req,
  })
}

export const hideEditorDraft = async ({
  actorId,
  draftId,
  payload,
}: {
  actorId: number
  draftId: number
  payload: Payload
}) => {
  const { actor, draft } = await loadEditorAndDraft(payload, actorId, draftId)
  const req = await createLocalReq({ context: { aiDraftDecision: true }, user: actor }, payload)
  await initTransaction(req)
  try {
    const decisionAt = new Date().toISOString()
    const updatedDraft = await payload.update({
      collection: 'ai-drafts',
      context: { aiDraftDecision: true },
      data: {
        decidedAt: decisionAt,
        publicVisibility: 'private',
        rejectionReasons: ['Hidden from the Draft Inbox by an Editor.'],
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
        action: 'reject',
        actor: actor.id,
        aiDraft: draft.id,
        decisionAt,
        newReviewRoute: draft.reviewRoute,
        newStatus: 'rejected',
        notes: 'Hidden from the Draft Inbox by an Editor.',
        previousReviewRoute: draft.reviewRoute,
        previousStatus: draft.status,
        rejectionReasons: ['Hidden from the Draft Inbox by an Editor.'],
        riskLevel: draft.riskLevel,
      },
      overrideAccess: true,
      req,
    })
    await commitTransaction(req)
    return { decision, draft: updatedDraft }
  } catch (error) {
    await killTransaction(req)
    throw error
  }
}
