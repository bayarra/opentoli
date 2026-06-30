import { getPendingFeedback, moderateFeedback } from '@/editor/feedback'
import { getUserContributions } from '@/lib/contributions'
import { getPublishedTermBySlug } from '@/lib/publicTerms'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let payload: Payload
let editor: User
let contributor: User
let categoryId: number
let termId: number
let translationId: number
let termSlug: string
const commentIds: number[] = []
const suffix = `${process.pid}-${Date.now()}`

describe('expanded contribution proposal moderation', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    editor = await payload.create({ collection: 'users', data: { email: `proposal-editor-${suffix}@opentoli.local`, name: 'Proposal Editor', password: `proposal-editor-${suffix}-password`, role: 'reviewer' }, overrideAccess: true })
    contributor = await payload.create({ collection: 'users', data: { email: `proposal-user-${suffix}@opentoli.local`, name: 'Proposal Contributor', password: `proposal-user-${suffix}-password`, role: 'contributor' }, overrideAccess: true })
    const category = await payload.create({ collection: 'categories', data: { displayOrder: 990, isActive: true, nameEn: `Proposal category ${suffix}`, nameMn: `Proposal category ${suffix}`, slug: `proposal-category-${suffix}` }, overrideAccess: true })
    categoryId = category.id
    const term = await payload.create({ collection: 'terms', data: { categories: [category.id], explanationEn: 'Proposal moderation fixture.', explanationMn: 'Proposal moderation fixture.', headwordEn: `proposal term ${suffix}`, reviewStatus: 'human_reviewed', shortDefinitionEn: 'Used to verify proposal moderation.', workflowStatus: 'approved' }, draft: true, overrideAccess: true })
    termId = term.id
    termSlug = term.slug
    const translation = await payload.create({ collection: 'translations', data: { register: 'general', reviewStatus: 'human_reviewed', status: 'approved', term: term.id, translationMn: `proposal translation ${suffix}`, translationType: 'recommended' }, overrideAccess: true })
    translationId = translation.id
    await payload.update({ collection: 'terms', context: { trustedSeed: true }, data: { _status: 'published', recommendedTranslation: translation.id }, draft: false, id: term.id, overrideAccess: true })
  })

  afterAll(async () => {
    for (const id of commentIds.reverse()) await payload.delete({ collection: 'comments', id, overrideAccess: true })
    if (translationId) await payload.delete({ collection: 'translations', id: translationId, overrideAccess: true })
    if (termId) await payload.delete({ collection: 'terms', id: termId, overrideAccess: true })
    if (categoryId) await payload.delete({ collection: 'categories', id: categoryId, overrideAccess: true })
    for (const id of [contributor?.id, editor?.id].filter(Boolean)) await payload.delete({ collection: 'users', id: id as number, overrideAccess: true })
  })

  it('moderates structured example and reference proposals without mutating canonical records', async () => {
    await expect(payload.create({ collection: 'comments', data: { body: 'Incomplete bilingual example.', commentType: 'example_suggestion', status: 'pending', suggestedExampleEn: 'English only.', term: termId, user: contributor.id }, draft: false, overrideAccess: false, user: contributor })).rejects.toThrow('requires English and Mongolian')
    await expect(payload.create({ collection: 'comments', data: { body: 'Unsafe reference.', commentType: 'reference_note', status: 'pending', suggestedReferenceTitle: 'Unsafe', suggestedReferenceUrl: 'javascript:alert(1)', term: termId, user: contributor.id }, draft: false, overrideAccess: false, user: contributor })).rejects.toThrow('must use http or https')

    const example = await payload.create({ collection: 'comments', data: { body: 'This example shows normal professional usage.', commentType: 'example_suggestion', status: 'pending', suggestedExampleEn: 'The client sends a request.', suggestedExampleMn: 'Клиент хүсэлт илгээнэ.', term: termId, user: contributor.id }, draft: false, overrideAccess: false, user: contributor })
    commentIds.push(example.id)
    const reference = await payload.create({ collection: 'comments', data: { body: 'This documentation gives useful background.', commentType: 'reference_note', status: 'pending', suggestedReferenceTitle: 'Example documentation', suggestedReferenceUrl: 'https://example.com/reference-proposal', term: termId, user: contributor.id }, draft: false, overrideAccess: false, user: contributor })
    commentIds.push(reference.id)
    expect(example.status).toBe('pending')
    expect(reference.suggestedReferenceUrl).toBe('https://example.com/reference-proposal')

    const pending = await getPendingFeedback(editor)
    expect(pending).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: example.id, suggestedExampleEn: 'The client sends a request.' }),
      expect.objectContaining({ id: reference.id, suggestedReferenceTitle: 'Example documentation' }),
    ]))
    await expect(moderateFeedback({ actor: contributor, commentId: example.id, payload, status: 'approved' })).rejects.toThrow('Editor')
    await moderateFeedback({ actor: editor, commentId: example.id, payload, status: 'approved' })

    const publicTerm = await getPublishedTermBySlug(termSlug)
    expect(publicTerm?.comments).toHaveLength(1)
    expect(publicTerm?.comments[0]).toMatchObject({ commentType: 'example_suggestion', suggestedExampleMn: 'Клиент хүсэлт илгээнэ.' })
    const contributions = await getUserContributions(contributor)
    expect(contributions).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: example.id, status: 'approved', suggestedExampleEn: 'The client sends a request.' }),
      expect.objectContaining({ id: reference.id, status: 'pending', suggestedReferenceTitle: 'Example documentation' }),
    ]))

    const examples = await payload.count({ collection: 'examples', overrideAccess: true, where: { term: { equals: termId } } })
    const references = await payload.count({ collection: 'sources', overrideAccess: true, where: { term: { equals: termId } } })
    expect(examples.totalDocs).toBe(0)
    expect(references.totalDocs).toBe(0)
  })
})
