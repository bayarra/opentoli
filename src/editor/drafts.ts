import {
  getReviewableAlternativeTranslations,
  validateGenerationOutputV1,
  validateResearchPacketV1,
  type GenerationOutputV1,
  type ReviewableAlternativeTranslation,
} from '@/ai/schemas/v1'
import {
  isM5CalibrationDraft,
  recordCalibrationOutcome,
  type CalibrationOutcomeInput,
} from '@/calibration/outcomes'
import type { AiDraft, Example, Term, Translation, User } from '@/payload-types'
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
  'alternativeTranslations',
  'examples',
] as const

export type EditorDraftFields = {
  alternativeTranslations: ReviewableAlternativeTranslation[]
  examples: GenerationOutputV1['examples']
  explanationEn: string
  explanationMn: string
  headwordEn: string
  recommendedTranslationMn: string
}

export class EditorWorkflowError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message)
    this.name = 'EditorWorkflowError'
  }
}

const requiredText = (value: unknown, label: string, maxLength = 5000): string => {
  if (typeof value !== 'string' || value.trim().length < 2) {
    throw new EditorWorkflowError(`${label} is required.`)
  }
  const text = value.trim()
  if (text.length > maxLength) throw new EditorWorkflowError(`${label} is too long.`)
  return text
}

const optionalText = (value: unknown, label: string, maxLength = 2000) => {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string') throw new EditorWorkflowError(`Invalid ${label}.`)
  const text = value.trim()
  if (text.length > maxLength) throw new EditorWorkflowError(`${label} is too long.`)
  return text || undefined
}

const recordArray = (value: unknown, label: string, max: number) => {
  if (!Array.isArray(value) || value.length > max) {
    throw new EditorWorkflowError(`Invalid ${label}.`)
  }
  if (!value.every((item) => item && typeof item === 'object' && !Array.isArray(item))) {
    throw new EditorWorkflowError(`Invalid ${label}.`)
  }
  return value as Array<Record<string, unknown>>
}

const alternativeTypes = [
  'alternative',
  'context_specific',
  'formal',
  'literal',
  'borrowed',
] as const

export const parseEditorDraftFields = (value: unknown): EditorDraftFields => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new EditorWorkflowError('Draft fields are required.')
  }
  const input = value as Record<string, unknown>
  const recommendedTranslationMn = requiredText(
    input.recommendedTranslationMn,
    'Mongolian translation',
    300,
  )
  const alternativeTranslations = recordArray(
    input.alternativeTranslations,
    'alternative translations',
    20,
  ).map((item, index) => {
    const type = item.type
    if (typeof type !== 'string' || !alternativeTypes.includes(type as never)) {
      throw new EditorWorkflowError(`Invalid alternative ${index + 1} type.`)
    }
    return {
      context: optionalText(item.context, `alternative ${index + 1} context`, 500),
      translationMn: requiredText(
        item.translationMn,
        `Alternative ${index + 1} Mongolian wording`,
        300,
      ),
      type: type as ReviewableAlternativeTranslation['type'],
      usageNote: optionalText(item.usageNote, `alternative ${index + 1} usage note`),
    }
  })
  const normalizedTranslations = [
    recommendedTranslationMn,
    ...alternativeTranslations.map((item) => item.translationMn),
  ].map((item) => item.toLocaleLowerCase('mn-MN'))
  if (new Set(normalizedTranslations).size !== normalizedTranslations.length) {
    throw new EditorWorkflowError('Recommended and alternative translations must be unique.')
  }

  return {
    alternativeTranslations,
    examples: recordArray(input.examples, 'examples', 20).map((item, index) => ({
      exampleEn: requiredText(item.exampleEn, `Example ${index + 1} English text`, 2000),
      exampleMn: requiredText(item.exampleMn, `Example ${index + 1} Mongolian text`, 2000),
    })),
    explanationEn: requiredText(input.explanationEn, 'English explanation'),
    explanationMn: requiredText(input.explanationMn, 'Mongolian explanation'),
    headwordEn: requiredText(input.headwordEn, 'English headword', 300),
    recommendedTranslationMn,
  }
}

export const editorFieldsFromGeneration = (generated: GenerationOutputV1): EditorDraftFields =>
  parseEditorDraftFields({
    ...generated,
    alternativeTranslations: getReviewableAlternativeTranslations(generated),
  })

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

const comparableField = (field: (typeof editableFieldNames)[number], value: unknown) => {
  if (field === 'alternativeTranslations') {
    return (value as GenerationOutputV1['alternativeTranslations']).map((item) => ({
      context: item.context,
      translationMn: item.translationMn,
      type: item.type,
      usageNote: item.usageNote,
    }))
  }
  if (field === 'examples') {
    return (value as GenerationOutputV1['examples']).map((item) => ({
      exampleEn: item.exampleEn,
      exampleMn: item.exampleMn,
    }))
  }
  return value
}

const fieldOutcomes = async (payload: Payload, draft: AiDraft, fields: EditorDraftFields) => {
  const original = await originalGeneration(payload, draft)
  const originalEditable = {
    ...original,
    alternativeTranslations: getReviewableAlternativeTranslations(original),
  }
  const acceptedFields: string[] = []
  const modifiedFields: Record<string, { from: unknown; to: unknown }> = {}
  for (const field of editableFieldNames) {
    if (
      JSON.stringify(comparableField(field, fields[field])) ===
      JSON.stringify(comparableField(field, originalEditable[field]))
    ) {
      acceptedFields.push(field)
    } else {
      modifiedFields[field] = { from: originalEditable[field], to: fields[field] }
    }
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
}): Promise<{
  alternativeTranslations: Translation[]
  examples: Example[]
  term: Term
  translation: Translation
}> => {
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

  const alternativeTranslations: Translation[] = []
  for (const candidate of getReviewableAlternativeTranslations(generated)) {
    const existingAlternative = await payload.find({
      collection: 'translations',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      req,
      where: {
        and: [
          { term: { equals: term.id } },
          { translationMn: { equals: candidate.translationMn } },
        ],
      },
    })
    const data = {
      explanationEn: candidate.context,
      register: candidate.type === 'borrowed' ? ('technical' as const) : ('general' as const),
      reviewedBy: actor.id,
      reviewStatus: 'human_reviewed' as const,
      status: 'approved' as const,
      term: term.id,
      translationMn: candidate.translationMn,
      translationType: candidate.type === 'borrowed' ? ('alternative' as const) : candidate.type,
      usageNote: candidate.usageNote,
    }
    alternativeTranslations.push(
      existingAlternative.docs[0]
        ? await payload.update({
            collection: 'translations',
            data,
            id: existingAlternative.docs[0].id,
            overrideAccess: true,
            req,
          })
        : await payload.create({
            collection: 'translations',
            data: { ...data, createdBy: actor.id },
            overrideAccess: true,
            req,
          }),
    )
  }

  const examples: Example[] = []
  for (const candidate of generated.examples) {
    const existingExample = await payload.find({
      collection: 'examples',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      req,
      where: {
        and: [
          { term: { equals: term.id } },
          { exampleEn: { equals: candidate.exampleEn } },
          { exampleMn: { equals: candidate.exampleMn } },
        ],
      },
    })
    const data = {
      exampleEn: candidate.exampleEn,
      exampleMn: candidate.exampleMn,
      reviewStatus: 'human_reviewed' as const,
      status: 'approved' as const,
      term: term.id,
    }
    examples.push(
      existingExample.docs[0]
        ? await payload.update({
            collection: 'examples',
            data,
            id: existingExample.docs[0].id,
            overrideAccess: true,
            req,
          })
        : await payload.create({
            collection: 'examples',
            data: { ...data, createdBy: actor.id },
            overrideAccess: true,
            req,
          }),
    )
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
  return { alternativeTranslations, examples, term, translation }
}

export const publishEditorDraft = async ({
  actorId,
  calibrationOutcome,
  draftId,
  payload,
}: {
  actorId: number
  calibrationOutcome?: CalibrationOutcomeInput
  draftId: number
  payload: Payload
}) => {
  const { actor, draft } = await loadEditorAndDraft(payload, actorId, draftId)
  const requiresCalibrationOutcome = await isM5CalibrationDraft(draft)
  if (requiresCalibrationOutcome && !calibrationOutcome) {
    throw new EditorWorkflowError('Rate the AI result before completing this calibration draft.')
  }
  if (calibrationOutcome && calibrationOutcome.aiDraftId !== draft.id) {
    throw new EditorWorkflowError('The AI quality rating does not match this draft.')
  }
  const outcomes = await fieldOutcomes(
    payload,
    draft,
    editorFieldsFromGeneration(validateGenerationOutputV1(draft.generatedPayload)),
  )
  const modified = Object.keys(outcomes.modifiedFields).length > 0
  if (calibrationOutcome) {
    const ratedAsUnchanged =
      calibrationOutcome.outcome === 'accepted_as_is' && calibrationOutcome.editLevel === 'none'
    if (modified === ratedAsUnchanged) {
      throw new EditorWorkflowError(
        modified
          ? 'Choose an AI quality rating that reflects your edits.'
          : 'Choose Used as-is because no draft fields were changed.',
      )
    }
  }

  const req = await createLocalReq({ context: { aiDraftDecision: true }, user: actor }, payload)
  await initTransaction(req)
  try {
    const result = await materializePublishedTerm({ actor, draft, payload, req })
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
    const recordedCalibrationOutcome = calibrationOutcome
      ? await recordCalibrationOutcome({
          actor,
          fields: calibrationOutcome,
          payload,
          req,
        })
      : null
    await commitTransaction(req)
    return {
      calibrationOutcome: recordedCalibrationOutcome,
      decision,
      draft: updatedDraft,
      ...result,
    }
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
  calibrationOutcome,
  draftId,
  payload,
}: {
  actorId: number
  calibrationOutcome?: CalibrationOutcomeInput
  draftId: number
  payload: Payload
}) => {
  const { actor, draft } = await loadEditorAndDraft(payload, actorId, draftId)
  const requiresCalibrationOutcome = await isM5CalibrationDraft(draft)
  if (requiresCalibrationOutcome && !calibrationOutcome) {
    throw new EditorWorkflowError('Rate the AI result before completing this calibration draft.')
  }
  if (calibrationOutcome && calibrationOutcome.aiDraftId !== draft.id) {
    throw new EditorWorkflowError('The AI quality rating does not match this draft.')
  }
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
        rejectionReasons: ['Hidden from the Review Queue by an Editor.'],
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
        notes: 'Hidden from the Review Queue by an Editor.',
        previousReviewRoute: draft.reviewRoute,
        previousStatus: draft.status,
        rejectionReasons: ['Hidden from the Review Queue by an Editor.'],
        riskLevel: draft.riskLevel,
      },
      overrideAccess: true,
      req,
    })
    const recordedCalibrationOutcome = calibrationOutcome
      ? await recordCalibrationOutcome({
          actor,
          fields: calibrationOutcome,
          payload,
          req,
        })
      : null
    await commitTransaction(req)
    return { calibrationOutcome: recordedCalibrationOutcome, decision, draft: updatedDraft }
  } catch (error) {
    await killTransaction(req)
    throw error
  }
}
