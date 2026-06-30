import { enqueueGenerationJob } from '@/ai/pipeline/jobs'
import { createConfiguredAIProvider } from '@/ai/providers/factory'
import type { AIProvider } from '@/ai/providers/types'
import config from '@/payload.config'
import type { Category, ImportBatch, ImportBatchItem, User } from '@/payload-types'
import {
  commitTransaction,
  createLocalReq,
  getPayload,
  initTransaction,
  killTransaction,
  type Payload,
} from 'payload'

import { isEditorUser, relationshipId } from './permissions'

export class ImportWorkflowError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message)
    this.name = 'ImportWorkflowError'
  }
}

type InputMode = 'csv' | 'manual'
type ParsedImportRow = { contextNote?: string; headwordEn: string; rowNumber: number }

const normalizeHeadword = (value: string) => value.trim().toLocaleLowerCase('en-US')

const requiredText = (value: unknown, label: string, maxLength: number) => {
  if (typeof value !== 'string' || value.trim().length < 2) {
    throw new ImportWorkflowError(`${label} is required.`)
  }
  const text = value.trim()
  if (text.length > maxLength) throw new ImportWorkflowError(`${label} is too long.`)
  return text
}

const positiveId = (value: unknown, label: string) => {
  const parsed = typeof value === 'string' ? Number(value) : value
  if (!Number.isInteger(parsed) || Number(parsed) < 1) throw new ImportWorkflowError(`Invalid ${label}.`)
  return Number(parsed)
}

const parseCsvRecords = (input: string): string[][] => {
  const records: string[][] = []
  let record: string[] = []
  let field = ''
  let quoted = false

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index]
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (char === '"') {
        quoted = false
      } else {
        field += char
      }
      continue
    }
    if (char === '"' && field.length === 0) quoted = true
    else if (char === ',') {
      record.push(field)
      field = ''
    } else if (char === '\n') {
      record.push(field.replace(/\r$/, ''))
      if (record.some((value) => value.trim())) records.push(record)
      record = []
      field = ''
    } else field += char
  }
  if (quoted) throw new ImportWorkflowError('CSV contains an unclosed quoted field.')
  record.push(field.replace(/\r$/, ''))
  if (record.some((value) => value.trim())) records.push(record)
  return records
}

export const parseImportRows = (input: string, mode: InputMode): ParsedImportRow[] => {
  if (input.trim().length === 0) throw new ImportWorkflowError('Import input is required.')
  if (mode === 'manual') {
    return input
      .split(/\r?\n/)
      .map((value, index) => ({ headwordEn: value.trim(), rowNumber: index + 1 }))
      .filter((row) => row.headwordEn.length > 0)
  }

  const records = parseCsvRecords(input)
  const headers = records[0]?.map((value) => value.trim().toLocaleLowerCase('en-US')) || []
  const headwordIndex = headers.findIndex((value) => ['headword', 'headworden', 'headword_en'].includes(value))
  const contextIndex = headers.findIndex((value) => ['context', 'contextnote', 'context_note'].includes(value))
  if (headwordIndex < 0) throw new ImportWorkflowError('CSV requires a headword column.')
  return records.slice(1).map((record, index) => ({
    contextNote: contextIndex >= 0 ? record[contextIndex]?.trim() || undefined : undefined,
    headwordEn: record[headwordIndex]?.trim() || '',
    rowNumber: index + 2,
  }))
}

export const parseCreateImportBatch = (
  input: unknown,
): { categoryId: number; inputMode: InputMode; name: string; rawInput: string } => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ImportWorkflowError('Import batch fields are required.')
  }
  const fields = input as Record<string, unknown>
  const inputMode = fields.inputMode
  if (inputMode !== 'manual' && inputMode !== 'csv') throw new ImportWorkflowError('Invalid input mode.')
  return {
    categoryId: positiveId(fields.categoryId, 'category ID'),
    inputMode: inputMode as InputMode,
    name: requiredText(fields.name, 'Batch name', 200),
    rawInput: requiredText(fields.rawInput, 'Import input', 100_000),
  }
}

const countStatuses = (items: ImportBatchItem[]) => ({
  acceptedRows: items.filter((item) => ['accepted', 'queued'].includes(item.status)).length,
  duplicateRows: items.filter((item) => item.status === 'duplicate').length,
  rejectedRows: items.filter((item) => item.status === 'rejected').length,
  totalRows: items.length,
})

const refreshBatch = async (payload: Payload, batchId: number, actor: User) => {
  const items = await payload.find({ collection: 'import-batch-items', depth: 0, limit: 500, overrideAccess: true, where: { importBatch: { equals: batchId } } })
  const docs = items.docs as ImportBatchItem[]
  const counts = countStatuses(docs)
  const pending = docs.some((item) => item.status === 'pending')
  const queued = docs.some((item) => item.status === 'queued')
  const req = await createLocalReq({ user: actor }, payload)
  const batch = await payload.update({
    collection: 'import-batches',
    data: { ...counts, status: queued ? 'queued' : pending ? 'reviewing' : counts.acceptedRows > 0 ? 'ready' : 'reviewing' },
    id: batchId,
    overrideAccess: true,
    req,
  })
  return { batch: batch as ImportBatch, items: docs }
}

export const createImportBatch = async ({ actor, fields, payload }: { actor: User; fields: ReturnType<typeof parseCreateImportBatch>; payload: Payload }) => {
  if (!isEditorUser(actor)) throw new ImportWorkflowError('Editor access is required.', 403)
  const rows = parseImportRows(fields.rawInput, fields.inputMode)
  if (rows.length === 0) throw new ImportWorkflowError('Import input contains no rows.')
  if (rows.length > 200) throw new ImportWorkflowError('Import batches are limited to 200 rows.')
  const category = await payload.findByID({ collection: 'categories', depth: 0, id: fields.categoryId, overrideAccess: true }).catch(() => null)
  if (!category) throw new ImportWorkflowError('Category not found.', 404)
  const normalized = rows.map((row) => normalizeHeadword(row.headwordEn)).filter(Boolean)
  const existing = normalized.length
    ? await payload.find({ collection: 'terms', depth: 0, draft: true, limit: 500, overrideAccess: true, where: { normalizedHeadwordEn: { in: normalized } } })
    : { docs: [] }
  const existingHeadwords = new Set(existing.docs.map((term) => term.normalizedHeadwordEn))
  const seen = new Set<string>()
  const req = await createLocalReq({ user: actor }, payload)
  await initTransaction(req)
  try {
    const batch = await payload.create({
      collection: 'import-batches',
      data: {
        acceptedRows: 0,
        category: category.id,
        createdBy: actor.id,
        duplicateRows: 0,
        inputMode: fields.inputMode,
        name: fields.name,
        rejectedRows: 0,
        sourceTitle: `OpenToli web ${fields.inputMode} preparation`,
        status: 'reviewing',
        totalRows: rows.length,
        validationReport: { inputMode: fields.inputMode, parsedRows: rows.length, runMode: 'review_only' },
      },
      overrideAccess: true,
      req,
    })
    const items: ImportBatchItem[] = []
    for (const row of rows) {
      const normalizedHeadwordEn = normalizeHeadword(row.headwordEn)
      const messages: string[] = []
      let status: ImportBatchItem['status'] = 'pending'
      if (normalizedHeadwordEn.length < 2) {
        status = 'rejected'
        messages.push('Headword must contain at least two characters.')
      } else if (seen.has(normalizedHeadwordEn)) {
        status = 'duplicate'
        messages.push('Duplicate inside this import batch.')
      } else if (existingHeadwords.has(normalizedHeadwordEn)) {
        status = 'duplicate'
        messages.push('A Term already exists for this headword.')
      }
      if (normalizedHeadwordEn) seen.add(normalizedHeadwordEn)
      items.push(await payload.create({
        collection: 'import-batch-items',
        data: { createdBy: actor.id, contextNote: row.contextNote, headwordEn: row.headwordEn || '(empty row)', importBatch: batch.id, normalizedHeadwordEn: normalizedHeadwordEn || '(invalid)', rowNumber: row.rowNumber, status, validationMessages: messages },
        overrideAccess: true,
        req,
      }) as ImportBatchItem)
    }
    const counts = countStatuses(items)
    const updated = await payload.update({ collection: 'import-batches', data: counts, id: batch.id, overrideAccess: true, req })
    await commitTransaction(req)
    return updated as ImportBatch
  } catch (error) {
    await killTransaction(req)
    throw error
  }
}

export const getImportWorkspace = async (user: User, providedPayload?: Payload) => {
  if (!isEditorUser(user)) return null
  const payload = providedPayload || (await getPayload({ config: await config }))
  const [batches, categories] = await Promise.all([
    payload.find({ collection: 'import-batches', depth: 1, limit: 100, overrideAccess: true, sort: '-updatedAt' }),
    payload.find({ collection: 'categories', depth: 0, limit: 200, overrideAccess: true, sort: 'displayOrder' }),
  ])
  return {
    batches: (batches.docs as ImportBatch[]).map((batch) => ({ acceptedRows: batch.acceptedRows || 0, category: batch.category && typeof batch.category === 'object' ? batch.category.nameEn : null, duplicateRows: batch.duplicateRows || 0, id: batch.id, inputMode: batch.inputMode, name: batch.name, rejectedRows: batch.rejectedRows || 0, status: batch.status, totalRows: batch.totalRows || 0, updatedAt: batch.updatedAt })),
    categories: (categories.docs as Category[]).map((category) => ({ id: category.id, nameEn: category.nameEn, nameMn: category.nameMn })),
  }
}

export const getImportBatch = async (user: User, batchId: number, providedPayload?: Payload) => {
  if (!isEditorUser(user)) return null
  const payload = providedPayload || (await getPayload({ config: await config }))
  const batch = await payload.findByID({ collection: 'import-batches', depth: 1, id: batchId, overrideAccess: true }).catch(() => null)
  if (!batch) return null
  const items = await payload.find({ collection: 'import-batch-items', depth: 1, limit: 500, overrideAccess: true, sort: 'rowNumber', where: { importBatch: { equals: batchId } } })
  return {
    batch: { acceptedRows: batch.acceptedRows || 0, category: batch.category && typeof batch.category === 'object' ? { id: batch.category.id, nameEn: batch.category.nameEn, slug: batch.category.slug } : null, duplicateRows: batch.duplicateRows || 0, id: batch.id, inputMode: batch.inputMode, name: batch.name, rejectedRows: batch.rejectedRows || 0, status: batch.status, totalRows: batch.totalRows || 0, updatedAt: batch.updatedAt },
    items: (items.docs as ImportBatchItem[]).map((item) => ({ contextNote: item.contextNote || null, generationJobId: relationshipId(item.generationJob) || null, headwordEn: item.headwordEn, id: item.id, messages: Array.isArray(item.validationMessages) ? item.validationMessages.filter((message): message is string => typeof message === 'string') : [], rowNumber: item.rowNumber, status: item.status, termId: relationshipId(item.term) || null })),
  }
}

export const reviewImportItem = async ({ actor, itemId, payload, status }: { actor: User; itemId: number; payload: Payload; status: 'accepted' | 'rejected' }) => {
  if (!isEditorUser(actor)) throw new ImportWorkflowError('Editor access is required.', 403)
  const item = await payload.findByID({ collection: 'import-batch-items', depth: 0, id: itemId, overrideAccess: true }).catch(() => null)
  if (!item) throw new ImportWorkflowError('Import row not found.', 404)
  if (['duplicate', 'queued'].includes(item.status)) throw new ImportWorkflowError('This import row cannot be changed.', 409)
  const req = await createLocalReq({ user: actor }, payload)
  const updated = await payload.update({ collection: 'import-batch-items', data: { reviewedAt: new Date().toISOString(), reviewedBy: actor.id, status }, id: item.id, overrideAccess: true, req })
  await refreshBatch(payload, relationshipId(item.importBatch)!, actor)
  return updated as ImportBatchItem
}

export const acceptAllValidImportItems = async ({ actor, batchId, payload }: { actor: User; batchId: number; payload: Payload }) => {
  if (!isEditorUser(actor)) throw new ImportWorkflowError('Editor access is required.', 403)
  const items = await payload.find({ collection: 'import-batch-items', depth: 0, limit: 500, overrideAccess: true, where: { and: [{ importBatch: { equals: batchId } }, { status: { equals: 'pending' } }] } })
  const req = await createLocalReq({ user: actor }, payload)
  for (const item of items.docs) await payload.update({ collection: 'import-batch-items', data: { reviewedAt: new Date().toISOString(), reviewedBy: actor.id, status: 'accepted' }, id: item.id, overrideAccess: true, req })
  return refreshBatch(payload, batchId, actor)
}

export const queueImportBatch = async ({ actor, batchId, payload, provider: providedProvider }: { actor: User; batchId: number; payload: Payload; provider?: AIProvider }) => {
  if (!isEditorUser(actor)) throw new ImportWorkflowError('Editor access is required.', 403)
  const detail = await getImportBatch(actor, batchId, payload)
  if (!detail) throw new ImportWorkflowError('Import batch not found.', 404)
  if (detail.items.some((item) => item.status === 'pending')) throw new ImportWorkflowError('Review every valid row before queueing.', 409)
  const accepted = detail.items.filter((item) => item.status === 'accepted')
  if (accepted.length === 0) throw new ImportWorkflowError('No accepted rows are ready to queue.', 409)
  if (!detail.batch.category) throw new ImportWorkflowError('Import batch category is missing.', 409)
  const provider = providedProvider || createConfiguredAIProvider()
  let queued = 0
  let reused = 0
  for (const item of accepted) {
    const existing = await payload.find({ collection: 'terms', depth: 0, draft: true, limit: 1, overrideAccess: true, where: { normalizedHeadwordEn: { equals: normalizeHeadword(item.headwordEn) } } })
    if (existing.docs[0]) {
      await payload.update({ collection: 'import-batch-items', data: { status: 'duplicate', term: existing.docs[0].id, validationMessages: ['A Term was created before this row was queued.'] }, id: item.id, overrideAccess: true })
      continue
    }
    const term = await payload.create({ collection: 'terms', data: { categories: [detail.batch.category.id], createdBy: actor.id, explanationEn: 'Import preparation placeholder. AI generation and human review are required.', explanationMn: 'Import preparation placeholder. Human review is required before publication.', headwordEn: item.headwordEn, reviewStatus: 'ai_draft', shortDefinitionEn: `Import candidate for ${item.headwordEn}.`, usageNoteEn: item.contextNote || undefined, workflowStatus: 'draft' }, draft: true, overrideAccess: true })
    const result = await enqueueGenerationJob({ importBatchId: batchId, payload, preparation: { category: detail.batch.category, headwordEn: item.headwordEn, sources: [], termId: term.id }, provider, requestedById: actor.id })
    await payload.update({ collection: 'import-batch-items', data: { generationJob: result.job.id, status: 'queued', term: term.id }, id: item.id, overrideAccess: true })
    if (result.created) queued += 1
    else reused += 1
  }
  await payload.update({ collection: 'import-batches', data: { modelName: provider.metadata.modelName, promptVersion: [provider.metadata.researchPromptVersion, provider.metadata.generationPromptVersion, provider.metadata.critiquePromptVersion].join('|'), schemaVersion: '1.0.0', status: 'queued', validationReport: { provider: provider.metadata.provider, queued, reused, runMode: 'enqueue_only' } }, id: batchId, overrideAccess: true })
  await refreshBatch(payload, batchId, actor)
  return { queued, reused }
}
