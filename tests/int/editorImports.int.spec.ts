import { DeterministicAIProvider } from '@/ai/providers/deterministic'
import {
  acceptAllValidImportItems,
  createImportBatch,
  getImportBatch,
  parseCreateImportBatch,
  parseImportRows,
  queueImportBatch,
} from '@/editor/imports'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let payload: Payload
let editor: User
let contributor: User
let categoryId: number
let existingTermId: number
let batchId: number
const createdTermIds: number[] = []
const createdJobIds: number[] = []
const suffix = `${process.pid}-${Date.now()}`

describe('web import preparation', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    editor = await payload.create({ collection: 'users', data: { email: `import-editor-${suffix}@opentoli.local`, name: 'Import Editor', password: `import-editor-${suffix}-password`, role: 'reviewer' }, overrideAccess: true })
    contributor = await payload.create({ collection: 'users', data: { email: `import-contributor-${suffix}@opentoli.local`, name: 'Import Contributor', password: `import-contributor-${suffix}-password`, role: 'contributor' }, overrideAccess: true })
    const category = await payload.create({ collection: 'categories', data: { displayOrder: 989, isActive: true, nameEn: `Import category ${suffix}`, nameMn: `Import category ${suffix}`, slug: `import-category-${suffix}` }, overrideAccess: true })
    categoryId = category.id
    const term = await payload.create({ collection: 'terms', data: { categories: [category.id], explanationEn: 'Existing duplicate fixture.', explanationMn: 'Existing duplicate fixture.', headwordEn: `existing import term ${suffix}`, reviewStatus: 'not_reviewed', shortDefinitionEn: 'Existing duplicate fixture.', workflowStatus: 'draft' }, draft: true, overrideAccess: true })
    existingTermId = term.id
  })

  afterAll(async () => {
    if (batchId) {
      const items = await payload.find({ collection: 'import-batch-items', limit: 500, overrideAccess: true, where: { importBatch: { equals: batchId } } })
      for (const item of items.docs) await payload.delete({ collection: 'import-batch-items', id: item.id, overrideAccess: true })
    }
    for (const id of createdJobIds.reverse()) await payload.delete({ collection: 'generation-jobs', id, overrideAccess: true })
    for (const id of createdTermIds.reverse()) await payload.delete({ collection: 'terms', id, overrideAccess: true })
    if (batchId) await payload.delete({ collection: 'import-batches', id: batchId, overrideAccess: true })
    if (existingTermId) await payload.delete({ collection: 'terms', id: existingTermId, overrideAccess: true })
    if (categoryId) await payload.delete({ collection: 'categories', id: categoryId, overrideAccess: true })
    for (const id of [contributor?.id, editor?.id].filter(Boolean)) await payload.delete({ collection: 'users', id: id as number, overrideAccess: true })
  })

  it('parses manual and quoted CSV input deterministically', () => {
    expect(parseImportRows('authentication\nauthorization', 'manual')).toEqual([
      { headwordEn: 'authentication', rowNumber: 1 },
      { headwordEn: 'authorization', rowNumber: 2 },
    ])
    expect(parseImportRows('headword,context\nAPI,"software, integration"', 'csv')).toEqual([
      { contextNote: 'software, integration', headwordEn: 'API', rowNumber: 2 },
    ])
  })

  it('requires Editor review before queueing accepted rows without provider execution', async () => {
    const fields = parseCreateImportBatch({
      categoryId,
      inputMode: 'csv',
      name: `Web import ${suffix}`,
      rawInput: [
        'headword,context',
        `new import alpha ${suffix},"software, alpha"`,
        `new import alpha ${suffix},duplicate row`,
        `existing import term ${suffix},already exists`,
        `new import beta ${suffix},software beta`,
      ].join('\n'),
    })
    await expect(createImportBatch({ actor: contributor, fields, payload })).rejects.toThrow('Editor access')
    const batch = await createImportBatch({ actor: editor, fields, payload })
    batchId = batch.id
    let detail = await getImportBatch(editor, batch.id, payload)
    expect(detail?.items.map((item) => item.status)).toEqual(['pending', 'duplicate', 'duplicate', 'pending'])

    await expect(queueImportBatch({ actor: editor, batchId: batch.id, payload, provider: new DeterministicAIProvider() })).rejects.toThrow('Review every valid row')
    await acceptAllValidImportItems({ actor: editor, batchId: batch.id, payload })
    detail = await getImportBatch(editor, batch.id, payload)
    expect(detail?.batch.status).toBe('ready')
    expect(detail?.batch.acceptedRows).toBe(2)

    const result = await queueImportBatch({ actor: editor, batchId: batch.id, payload, provider: new DeterministicAIProvider() })
    expect(result).toEqual({ queued: 2, reused: 0 })
    detail = await getImportBatch(editor, batch.id, payload)
    expect(detail?.batch.status).toBe('queued')
    const queuedItems = detail?.items.filter((item) => item.status === 'queued') || []
    expect(queuedItems).toHaveLength(2)
    createdTermIds.push(...queuedItems.map((item) => item.termId!).filter(Boolean))
    createdJobIds.push(...queuedItems.map((item) => item.generationJobId!).filter(Boolean))

    for (const jobId of createdJobIds) {
      const job = await payload.findByID({ collection: 'generation-jobs', depth: 0, id: jobId, overrideAccess: true })
      expect(job).toMatchObject({ importBatch: batch.id, requestedBy: editor.id, status: 'queued' })
      expect(job.researchRawOutput).toBeFalsy()
      expect(job.generationRawOutput).toBeFalsy()
      expect(job.critiqueRawOutput).toBeFalsy()
    }
    expect((await payload.count({ collection: 'ai-drafts', overrideAccess: true, where: { generationJob: { in: createdJobIds } } })).totalDocs).toBe(0)
  })
})
