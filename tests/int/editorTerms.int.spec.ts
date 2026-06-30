import { parsePublishedTermFields, updatePublishedTerm } from '@/editor/terms'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let payload: Payload
let editor: User
let contributor: User
let categoryId: number
let contextId: number
let termId: number
let recommendedId: number
let alternativeId: number
let exampleId: number
let referenceId: number
const createdTranslationIds: number[] = []
const createdExampleIds: number[] = []
const createdReferenceIds: number[] = []
const suffix = `${process.pid}-${Date.now()}`

describe('published term web editing', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    editor = await payload.create({ collection: 'users', data: { email: `term-editor-${suffix}@opentoli.local`, name: 'Term Editor', password: `term-editor-${suffix}-password`, role: 'reviewer' }, overrideAccess: true })
    contributor = await payload.create({ collection: 'users', data: { email: `term-contributor-${suffix}@opentoli.local`, name: 'Term Contributor', password: `term-contributor-${suffix}-password`, role: 'contributor' }, overrideAccess: true })
    const category = await payload.create({ collection: 'categories', data: { displayOrder: 991, isActive: true, nameEn: `Term editor category ${suffix}`, nameMn: `Term editor category ${suffix}`, slug: `term-editor-category-${suffix}` }, overrideAccess: true })
    categoryId = category.id
    const context = await payload.create({ collection: 'contexts', data: { category: category.id, nameEn: `Term context ${suffix}`, nameMn: `Term context ${suffix}`, slug: `term-context-${suffix}` }, overrideAccess: true })
    contextId = context.id
    const term = await payload.create({ collection: 'terms', data: { categories: [category.id], explanationEn: 'Original English explanation.', explanationMn: 'Original Mongolian explanation.', headwordEn: `published editor term ${suffix}`, reviewStatus: 'human_reviewed', shortDefinitionEn: 'Original short definition.', workflowStatus: 'approved' }, draft: true, overrideAccess: true })
    termId = term.id
    const recommended = await payload.create({ collection: 'translations', data: { register: 'general', reviewStatus: 'human_reviewed', status: 'approved', term: term.id, translationMn: `recommended ${suffix}`, translationType: 'recommended' }, overrideAccess: true })
    recommendedId = recommended.id
    const alternative = await payload.create({ collection: 'translations', data: { register: 'technical', reviewStatus: 'human_reviewed', status: 'approved', term: term.id, translationMn: `old alternative ${suffix}`, translationType: 'alternative' }, overrideAccess: true })
    alternativeId = alternative.id
    const example = await payload.create({ collection: 'examples', data: { exampleEn: 'Old example English.', exampleMn: 'Old example Mongolian.', reviewStatus: 'human_reviewed', status: 'approved', term: term.id }, overrideAccess: true })
    exampleId = example.id
    const reference = await payload.create({ collection: 'sources', data: { publisher: 'Reference', sourceType: 'other', term: term.id, title: 'Old reference', url: 'https://example.com/old-reference' }, overrideAccess: true })
    referenceId = reference.id
    await payload.update({ collection: 'terms', context: { trustedSeed: true }, data: { _status: 'published', approvedBy: editor.id, recommendedTranslation: recommended.id, reviewedBy: editor.id }, draft: false, id: term.id, overrideAccess: true })
  })

  afterAll(async () => {
    const translations = await payload.find({ collection: 'translations', limit: 100, overrideAccess: true, where: { term: { equals: termId } } })
    for (const item of translations.docs) await payload.delete({ collection: 'translations', id: item.id, overrideAccess: true })
    const examples = await payload.find({ collection: 'examples', limit: 100, overrideAccess: true, where: { term: { equals: termId } } })
    for (const item of examples.docs) await payload.delete({ collection: 'examples', id: item.id, overrideAccess: true })
    const references = await payload.find({ collection: 'sources', limit: 100, overrideAccess: true, where: { term: { equals: termId } } })
    for (const item of references.docs) await payload.delete({ collection: 'sources', id: item.id, overrideAccess: true })
    if (termId) await payload.delete({ collection: 'terms', id: termId, overrideAccess: true })
    if (contextId) await payload.delete({ collection: 'contexts', id: contextId, overrideAccess: true })
    if (categoryId) await payload.delete({ collection: 'categories', id: categoryId, overrideAccess: true })
    for (const id of [contributor?.id, editor?.id].filter(Boolean)) await payload.delete({ collection: 'users', id: id as number, overrideAccess: true })
  })

  it('keeps canonical changes Editor-only and updates related public records atomically', async () => {
    const fields = parsePublishedTermFields({
      alternativeTranslations: [{ contextId, explanationEn: 'Alternative explanation.', explanationMn: '', register: 'technical', translationMn: `new alternative ${suffix}`, translationType: 'context_specific', usageNote: '' }],
      categoryIds: [categoryId],
      contextIds: [contextId],
      examples: [{ contextId, exampleEn: 'New example English.', exampleMn: 'New example Mongolian.' }],
      explanationEn: 'Updated English explanation.',
      explanationMn: 'Updated Mongolian explanation.',
      headwordEn: `published editor term ${suffix}`,
      partOfSpeech: 'noun',
      recommendedTranslation: { id: recommendedId, translationMn: `updated recommendation ${suffix}` },
      references: [{ title: 'New reference', url: 'https://example.com/new-reference' }],
      shortDefinitionEn: 'Updated short definition.',
      usageNoteEn: 'Updated usage note.',
      usageNoteMn: '',
    })

    await expect(updatePublishedTerm({ actor: contributor, fields, payload, termId })).rejects.toThrow('Editor access')
    const updated = await updatePublishedTerm({ actor: editor, fields, payload, termId })
    expect(updated).toMatchObject({ _status: 'published', explanationEn: 'Updated English explanation.', partOfSpeech: 'noun', reviewStatus: 'human_reviewed', workflowStatus: 'approved' })

    const recommended = await payload.findByID({ collection: 'translations', id: recommendedId, overrideAccess: true })
    expect(recommended.translationMn).toBe(`updated recommendation ${suffix}`)
    const oldAlternative = await payload.findByID({ collection: 'translations', id: alternativeId, overrideAccess: true })
    expect(oldAlternative.status).toBe('deprecated')
    const activeAlternatives = await payload.find({ collection: 'translations', limit: 10, overrideAccess: true, where: { and: [{ term: { equals: termId } }, { status: { equals: 'approved' } }, { translationType: { not_equals: 'recommended' } }] } })
    expect(activeAlternatives.docs).toHaveLength(1)
    expect(activeAlternatives.docs[0].translationMn).toBe(`new alternative ${suffix}`)
    createdTranslationIds.push(activeAlternatives.docs[0].id)

    const oldExample = await payload.findByID({ collection: 'examples', id: exampleId, overrideAccess: true })
    expect(oldExample.status).toBe('rejected')
    const activeExamples = await payload.find({ collection: 'examples', limit: 10, overrideAccess: true, where: { and: [{ term: { equals: termId } }, { status: { equals: 'approved' } }] } })
    expect(activeExamples.docs).toHaveLength(1)
    createdExampleIds.push(activeExamples.docs[0].id)

    await expect(payload.findByID({ collection: 'sources', id: referenceId, overrideAccess: true })).rejects.toThrow()
    const references = await payload.find({ collection: 'sources', limit: 10, overrideAccess: true, where: { term: { equals: termId } } })
    expect(references.docs).toHaveLength(1)
    expect(references.docs[0].title).toBe('New reference')
    createdReferenceIds.push(references.docs[0].id)
  })
})
