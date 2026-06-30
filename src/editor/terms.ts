import config from '@/payload.config'
import type { Category, Context, Example, Source, Term, Translation, User } from '@/payload-types'
import {
  commitTransaction,
  createLocalReq,
  getPayload,
  initTransaction,
  killTransaction,
  type Payload,
} from 'payload'

import { isEditorUser, relationshipId } from './permissions'

const partOfSpeechValues = ['noun', 'verb', 'adjective', 'adverb', 'phrase', 'acronym', 'other'] as const
const translationTypeValues = ['alternative', 'context_specific', 'formal', 'informal', 'literal'] as const
const registerValues = ['general', 'formal', 'informal', 'technical', 'academic', 'legal', 'medical', 'business'] as const

type RelatedRecord = { id?: number }

export type PublishedTermFields = {
  alternativeTranslations: Array<{
    contextId?: number
    explanationEn?: string
    explanationMn?: string
    id?: number
    register: (typeof registerValues)[number]
    translationMn: string
    translationType: (typeof translationTypeValues)[number]
    usageNote?: string
  }>
  categoryIds: number[]
  contextIds: number[]
  examples: Array<{
    contextId?: number
    exampleEn: string
    exampleMn: string
    id?: number
  }>
  explanationEn: string
  explanationMn: string
  headwordEn: string
  partOfSpeech?: (typeof partOfSpeechValues)[number]
  recommendedTranslation: { id?: number; translationMn: string }
  references: Array<{ id?: number; title: string; url: string }>
  shortDefinitionEn: string
  usageNoteEn?: string
  usageNoteMn?: string
}

export class PublishedTermWorkflowError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message)
    this.name = 'PublishedTermWorkflowError'
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const requiredText = (value: unknown, label: string, maxLength = 5000) => {
  if (typeof value !== 'string' || value.trim().length < 2) {
    throw new PublishedTermWorkflowError(`${label} is required.`)
  }
  const text = value.trim()
  if (text.length > maxLength) throw new PublishedTermWorkflowError(`${label} is too long.`)
  return text
}

const optionalText = (value: unknown, label: string, maxLength = 5000) => {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string') throw new PublishedTermWorkflowError(`Invalid ${label}.`)
  const text = value.trim()
  if (text.length > maxLength) throw new PublishedTermWorkflowError(`${label} is too long.`)
  return text || undefined
}

const positiveId = (value: unknown, label: string) => {
  const parsed = typeof value === 'string' ? Number(value) : value
  if (!Number.isInteger(parsed) || Number(parsed) < 1) {
    throw new PublishedTermWorkflowError(`Invalid ${label}.`)
  }
  return Number(parsed)
}

const optionalId = (value: unknown, label: string) =>
  value === undefined || value === null || value === '' ? undefined : positiveId(value, label)

const idList = (value: unknown, label: string, required = false) => {
  if (!Array.isArray(value)) throw new PublishedTermWorkflowError(`Invalid ${label}.`)
  const ids = [...new Set(value.map((item) => positiveId(item, label)))]
  if (required && ids.length === 0) throw new PublishedTermWorkflowError(`${label} is required.`)
  return ids
}

const allowedValue = <T extends readonly string[]>(value: unknown, allowed: T, label: string) => {
  if (typeof value === 'string' && allowed.includes(value)) return value as T[number]
  throw new PublishedTermWorkflowError(`Invalid ${label}.`)
}

const safeUrl = (value: unknown) => {
  const url = requiredText(value, 'Reference URL', 2000)
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.toString()
  } catch {
    // Use the common validation message below.
  }
  throw new PublishedTermWorkflowError('Reference URL must use http or https.')
}

const recordArray = (value: unknown, label: string, max: number) => {
  if (!Array.isArray(value) || value.length > max || !value.every(isRecord)) {
    throw new PublishedTermWorkflowError(`Invalid ${label}.`)
  }
  return value
}

export const parsePublishedTermFields = (value: unknown): PublishedTermFields => {
  if (!isRecord(value)) throw new PublishedTermWorkflowError('Term fields are required.')
  if (!isRecord(value.recommendedTranslation)) {
    throw new PublishedTermWorkflowError('Recommended translation is required.')
  }

  return {
    alternativeTranslations: recordArray(value.alternativeTranslations, 'alternative translations', 30).map(
      (item, index) => ({
        contextId: optionalId(item.contextId, `alternative ${index + 1} context`),
        explanationEn: optionalText(item.explanationEn, `alternative ${index + 1} English explanation`),
        explanationMn: optionalText(item.explanationMn, `alternative ${index + 1} Mongolian explanation`),
        id: optionalId(item.id, `alternative ${index + 1} ID`),
        register: allowedValue(item.register, registerValues, `alternative ${index + 1} register`),
        translationMn: requiredText(item.translationMn, `Alternative ${index + 1}`, 300),
        translationType: allowedValue(
          item.translationType,
          translationTypeValues,
          `alternative ${index + 1} type`,
        ),
        usageNote: optionalText(item.usageNote, `alternative ${index + 1} usage note`),
      }),
    ),
    categoryIds: idList(value.categoryIds, 'Category', true),
    contextIds: idList(value.contextIds, 'Context'),
    examples: recordArray(value.examples, 'examples', 30).map((item, index) => ({
      contextId: optionalId(item.contextId, `example ${index + 1} context`),
      exampleEn: requiredText(item.exampleEn, `Example ${index + 1} English text`),
      exampleMn: requiredText(item.exampleMn, `Example ${index + 1} Mongolian text`),
      id: optionalId(item.id, `example ${index + 1} ID`),
    })),
    explanationEn: requiredText(value.explanationEn, 'English explanation'),
    explanationMn: requiredText(value.explanationMn, 'Mongolian explanation'),
    headwordEn: requiredText(value.headwordEn, 'English headword', 300),
    partOfSpeech:
      value.partOfSpeech === undefined || value.partOfSpeech === null || value.partOfSpeech === ''
        ? undefined
        : allowedValue(value.partOfSpeech, partOfSpeechValues, 'part of speech'),
    recommendedTranslation: {
      id: optionalId(value.recommendedTranslation.id, 'recommended translation ID'),
      translationMn: requiredText(
        value.recommendedTranslation.translationMn,
        'Recommended Mongolian translation',
        300,
      ),
    },
    references: recordArray(value.references, 'references', 30).map((item, index) => ({
      id: optionalId(item.id, `reference ${index + 1} ID`),
      title: requiredText(item.title, `Reference ${index + 1} title`, 500),
      url: safeUrl(item.url),
    })),
    shortDefinitionEn: requiredText(value.shortDefinitionEn, 'Short English definition'),
    usageNoteEn: optionalText(value.usageNoteEn, 'English usage note'),
    usageNoteMn: optionalText(value.usageNoteMn, 'Mongolian usage note'),
  }
}

const assertOwned = <T extends RelatedRecord>(records: T[], id: number | undefined, label: string) => {
  if (!id) return undefined
  const record = records.find((item) => item.id === id)
  if (!record) throw new PublishedTermWorkflowError(`${label} does not belong to this term.`, 409)
  return record
}

const relationIds = (value: unknown): number[] =>
  Array.isArray(value)
    ? value.map(relationshipId).filter((id): id is number => typeof id === 'number')
    : []

const loadPublishedTerm = async (payload: Payload, termId: number) => {
  const term = await payload
    .findByID({ collection: 'terms', depth: 1, id: termId, overrideAccess: true })
    .catch(() => null)
  if (!term || term._status !== 'published') {
    throw new PublishedTermWorkflowError('Published term not found.', 404)
  }
  return term as Term
}

export const getPublishedTermEditor = async (user: User, termId: number, providedPayload?: Payload) => {
  if (!isEditorUser(user)) return null
  const payload = providedPayload || (await getPayload({ config: await config }))
  const term = await loadPublishedTerm(payload, termId)
  const [translations, examples, references, categories, contexts] = await Promise.all([
    payload.find({ collection: 'translations', depth: 0, limit: 100, overrideAccess: true, sort: 'createdAt', where: { term: { equals: term.id } } }),
    payload.find({ collection: 'examples', depth: 0, limit: 100, overrideAccess: true, sort: 'createdAt', where: { term: { equals: term.id } } }),
    payload.find({ collection: 'sources', depth: 0, limit: 100, overrideAccess: true, sort: 'createdAt', where: { term: { equals: term.id } } }),
    payload.find({ collection: 'categories', depth: 0, limit: 200, overrideAccess: true, sort: 'displayOrder' }),
    payload.find({ collection: 'contexts', depth: 0, limit: 500, overrideAccess: true, sort: 'nameEn' }),
  ])
  const recommendedId = relationshipId(term.recommendedTranslation)
  const activeTranslations = (translations.docs as Translation[]).filter((item) => item.status === 'approved')
  const recommended = activeTranslations.find((item) => item.id === recommendedId)
  if (!recommended) throw new PublishedTermWorkflowError('Recommended translation is missing.', 409)

  return {
    categories: (categories.docs as Category[]).map((item) => ({ id: item.id, nameEn: item.nameEn, nameMn: item.nameMn })),
    contexts: (contexts.docs as Context[]).map((item) => ({ categoryId: relationshipId(item.category) || null, id: item.id, nameEn: item.nameEn, nameMn: item.nameMn })),
    fields: {
      alternativeTranslations: activeTranslations.filter((item) => item.id !== recommended.id).map((item) => ({
        contextId: relationshipId(item.context) || null,
        explanationEn: item.explanationEn || '',
        explanationMn: item.explanationMn || '',
        id: item.id,
        register: item.register,
        translationMn: item.translationMn,
        translationType: item.translationType,
        usageNote: item.usageNote || '',
      })),
      categoryIds: relationIds(term.categories),
      contextIds: relationIds(term.contexts),
      examples: (examples.docs as Example[]).filter((item) => item.status === 'approved').map((item) => ({ contextId: relationshipId(item.context) || null, exampleEn: item.exampleEn, exampleMn: item.exampleMn, id: item.id })),
      explanationEn: term.explanationEn,
      explanationMn: term.explanationMn,
      headwordEn: term.headwordEn,
      partOfSpeech: term.partOfSpeech || '',
      recommendedTranslation: { id: recommended.id, translationMn: recommended.translationMn },
      references: (references.docs as Source[]).map((item) => ({ id: item.id, title: item.title, url: item.url })),
      shortDefinitionEn: term.shortDefinitionEn,
      usageNoteEn: term.usageNoteEn || '',
      usageNoteMn: term.usageNoteMn || '',
    },
    term: { id: term.id, slug: term.slug, updatedAt: term.updatedAt },
  }
}

export const listPublishedTermsForEditor = async (user: User, providedPayload?: Payload) => {
  if (!isEditorUser(user)) return null
  const payload = providedPayload || (await getPayload({ config: await config }))
  const result = await payload.find({
    collection: 'terms',
    depth: 1,
    limit: 500,
    overrideAccess: true,
    sort: 'headwordEn',
    where: { _status: { equals: 'published' } },
  })
  return (result.docs as Term[]).map((term) => ({
    headwordEn: term.headwordEn,
    id: term.id,
    recommendedTranslationMn:
      term.recommendedTranslation && typeof term.recommendedTranslation === 'object'
        ? term.recommendedTranslation.translationMn
        : null,
    reviewStatus: term.reviewStatus,
    slug: term.slug,
    updatedAt: term.updatedAt,
  }))
}

export const updatePublishedTerm = async ({
  actor,
  fields,
  payload,
  termId,
}: {
  actor: User
  fields: PublishedTermFields
  payload: Payload
  termId: number
}) => {
  if (!isEditorUser(actor)) throw new PublishedTermWorkflowError('Editor access is required.', 403)
  const term = await loadPublishedTerm(payload, termId)
  const [translationResult, exampleResult, referenceResult] = await Promise.all([
    payload.find({ collection: 'translations', depth: 0, limit: 100, overrideAccess: true, where: { term: { equals: term.id } } }),
    payload.find({ collection: 'examples', depth: 0, limit: 100, overrideAccess: true, where: { term: { equals: term.id } } }),
    payload.find({ collection: 'sources', depth: 0, limit: 100, overrideAccess: true, where: { term: { equals: term.id } } }),
  ])
  const existingTranslations = translationResult.docs as Translation[]
  const existingExamples = exampleResult.docs as Example[]
  const existingReferences = referenceResult.docs as Source[]
  assertOwned(existingTranslations, fields.recommendedTranslation.id, 'Recommended translation')
  for (const item of fields.alternativeTranslations) assertOwned(existingTranslations, item.id, 'Alternative translation')
  for (const item of fields.examples) assertOwned(existingExamples, item.id, 'Example')
  for (const item of fields.references) assertOwned(existingReferences, item.id, 'Reference')

  const req = await createLocalReq({ user: actor }, payload)
  await initTransaction(req)
  try {
    const recommended = fields.recommendedTranslation.id
      ? await payload.update({
          collection: 'translations',
          data: { reviewedBy: actor.id, reviewStatus: 'human_reviewed', status: 'approved', translationMn: fields.recommendedTranslation.translationMn, translationType: 'recommended' },
          id: fields.recommendedTranslation.id,
          overrideAccess: true,
          req,
        })
      : await payload.create({
          collection: 'translations',
          data: { register: 'general', reviewedBy: actor.id, reviewStatus: 'human_reviewed', status: 'approved', term: term.id, translationMn: fields.recommendedTranslation.translationMn, translationType: 'recommended' },
          overrideAccess: true,
          req,
        })

    const keptTranslationIds = new Set<number>([recommended.id])
    for (const item of fields.alternativeTranslations) {
      const data = {
        context: item.contextId,
        explanationEn: item.explanationEn,
        explanationMn: item.explanationMn,
        register: item.register,
        reviewedBy: actor.id,
        reviewStatus: 'human_reviewed' as const,
        status: 'approved' as const,
        term: term.id,
        translationMn: item.translationMn,
        translationType: item.translationType,
        usageNote: item.usageNote,
      }
      const saved = item.id
        ? await payload.update({ collection: 'translations', data, id: item.id, overrideAccess: true, req })
        : await payload.create({ collection: 'translations', data, overrideAccess: true, req })
      keptTranslationIds.add(saved.id)
    }
    for (const item of existingTranslations) {
      if (item.status === 'approved' && !keptTranslationIds.has(item.id)) {
        await payload.update({ collection: 'translations', data: { status: 'deprecated', translationType: 'deprecated' }, id: item.id, overrideAccess: true, req })
      }
    }

    const keptExampleIds = new Set<number>()
    for (const item of fields.examples) {
      const data = { context: item.contextId, exampleEn: item.exampleEn, exampleMn: item.exampleMn, reviewStatus: 'human_reviewed' as const, status: 'approved' as const, term: term.id }
      const saved = item.id
        ? await payload.update({ collection: 'examples', data, id: item.id, overrideAccess: true, req })
        : await payload.create({ collection: 'examples', data: { ...data, createdBy: actor.id }, overrideAccess: true, req })
      keptExampleIds.add(saved.id)
    }
    for (const item of existingExamples) {
      if (item.status === 'approved' && !keptExampleIds.has(item.id)) {
        await payload.update({ collection: 'examples', data: { status: 'rejected' }, id: item.id, overrideAccess: true, req })
      }
    }

    const keptReferenceIds = new Set<number>()
    for (const item of fields.references) {
      const data = { title: item.title, url: item.url }
      const saved = item.id
        ? await payload.update({ collection: 'sources', data, id: item.id, overrideAccess: true, req })
        : await payload.create({ collection: 'sources', data: { ...data, createdBy: actor.id, publisher: 'Reference', sourceType: 'other', term: term.id }, overrideAccess: true, req })
      keptReferenceIds.add(saved.id)
    }
    for (const item of existingReferences) {
      if (!keptReferenceIds.has(item.id)) {
        await payload.delete({ collection: 'sources', id: item.id, overrideAccess: true, req })
      }
    }

    const updated = await payload.update({
      collection: 'terms',
      data: {
        _status: 'published',
        approvedBy: actor.id,
        categories: fields.categoryIds,
        contexts: fields.contextIds,
        explanationEn: fields.explanationEn,
        explanationMn: fields.explanationMn,
        headwordEn: fields.headwordEn,
        partOfSpeech: fields.partOfSpeech,
        recommendedTranslation: recommended.id,
        reviewedBy: actor.id,
        reviewStatus: 'human_reviewed',
        shortDefinitionEn: fields.shortDefinitionEn,
        usageNoteEn: fields.usageNoteEn,
        usageNoteMn: fields.usageNoteMn,
        workflowStatus: 'approved',
      },
      draft: false,
      id: term.id,
      overrideAccess: false,
      req,
    })
    await commitTransaction(req)
    return updated as Term
  } catch (error) {
    await killTransaction(req)
    throw error
  }
}
