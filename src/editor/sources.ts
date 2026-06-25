import type { Source, User } from '@/payload-types'
import { createLocalReq, type Payload } from 'payload'

import { isEditorUser, relationshipId } from './permissions'

export class SourceWorkflowError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message)
    this.name = 'SourceWorkflowError'
  }
}

const assertSafePublicUrl = (value: string) => {
  try {
    const url = new URL(value)
    if (url.protocol === 'http:' || url.protocol === 'https:') return
  } catch {
    // Fall through to the shared error below.
  }
  throw new SourceWorkflowError('Only http and https source URLs can be verified.')
}

const allowedSourceTypes = [
  'government',
  'standards_body',
  'official_documentation',
  'academic',
  'dictionary',
  'textbook',
  'professional_usage',
  'news',
  'community_discussion',
  'other',
] as const

type SourceType = (typeof allowedSourceTypes)[number]

export type DraftSourceFields = {
  publisher: string
  sourceType: SourceType
  title: string
  url: string
}

const requiredText = (value: unknown, label: string): string => {
  if (typeof value !== 'string' || value.trim().length < 2) {
    throw new SourceWorkflowError(`${label} is required.`)
  }
  return value.trim()
}

export const parseDraftSourceFields = (value: unknown): DraftSourceFields => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new SourceWorkflowError('Source fields are required.')
  }

  const input = value as Record<string, unknown>
  const sourceType = input.sourceType
  if (!allowedSourceTypes.includes(sourceType as SourceType)) {
    throw new SourceWorkflowError('Choose a valid source type.')
  }

  return {
    publisher: requiredText(input.publisher, 'Publisher'),
    sourceType: sourceType as SourceType,
    title: requiredText(input.title, 'Title'),
    url: requiredText(input.url, 'URL'),
  }
}

const sourceIdsForDraft = (value: unknown): number[] =>
  Array.isArray(value)
    ? value.map(relationshipId).filter((id): id is number => typeof id === 'number')
    : []

const loadEditorDraft = async ({
  actor,
  draftId,
  payload,
}: {
  actor: User
  draftId: number
  payload: Payload
}) => {
  if (!isEditorUser(actor)) throw new SourceWorkflowError('Editor access is required.', 403)

  const draft = await payload
    .findByID({
      collection: 'ai-drafts',
      depth: 2,
      id: draftId,
      overrideAccess: true,
    })
    .catch(() => null)
  if (!draft) throw new SourceWorkflowError('Draft not found.', 404)
  if (!['editing', 'needs_review'].includes(draft.status)) {
    throw new SourceWorkflowError('This draft is no longer active.', 409)
  }

  const termId = relationshipId(draft.term)
  if (!termId) throw new SourceWorkflowError('The draft term container is missing.', 409)

  return { draft, sourceIds: sourceIdsForDraft(draft.sources), termId }
}

const ensureDraftSource = async ({
  actor,
  draftId,
  payload,
  sourceId,
}: {
  actor: User
  draftId: number
  payload: Payload
  sourceId: number
}) => {
  const draftState = await loadEditorDraft({ actor, draftId, payload })
  if (!draftState.sourceIds.includes(sourceId)) {
    throw new SourceWorkflowError('Source is not attached to this draft.', 404)
  }

  const source = await payload
    .findByID({
      collection: 'sources',
      depth: 0,
      id: sourceId,
      overrideAccess: true,
    })
    .catch(() => null)
  if (!source) throw new SourceWorkflowError('Source not found.', 404)

  return { ...draftState, source }
}

const countSafeSources = async (payload: Payload, sourceIds: number[]) => {
  if (sourceIds.length === 0) return 0
  const sources = await payload.find({
    collection: 'sources',
    depth: 0,
    limit: sourceIds.length,
    overrideAccess: true,
    where: { id: { in: sourceIds } },
  })

  return sources.docs.filter((source) => {
    try {
      const url = new URL(source.url)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }).length
}

export const addDraftSource = async ({
  actor,
  draftId,
  fields,
  payload,
}: {
  actor: User
  draftId: number
  fields: DraftSourceFields
  payload: Payload
}) => {
  const { draft, sourceIds, termId } = await loadEditorDraft({ actor, draftId, payload })
  const req = await createLocalReq({ user: actor }, payload)
  const source = await payload.create({
    collection: 'sources',
    data: {
      createdBy: actor.id,
      isVerified: false,
      publisher: fields.publisher,
      sourceType: fields.sourceType,
      term: termId,
      title: fields.title,
      url: fields.url,
    },
    overrideAccess: true,
    req,
  })

  const updatedDraft = await payload.update({
    collection: 'ai-drafts',
    data: { sources: [...new Set([...sourceIds, source.id])] },
    id: draft.id,
    overrideAccess: true,
    req,
  })

  return { draft: updatedDraft, source }
}

export const updateDraftSource = async ({
  actor,
  draftId,
  fields,
  payload,
  sourceId,
}: {
  actor: User
  draftId: number
  fields: DraftSourceFields
  payload: Payload
  sourceId: number
}) => {
  await ensureDraftSource({ actor, draftId, payload, sourceId })
  const req = await createLocalReq({ user: actor }, payload)

  return payload.update({
    collection: 'sources',
    data: {
      isVerified: false,
      publisher: fields.publisher,
      sourceType: fields.sourceType,
      title: fields.title,
      url: fields.url,
    },
    id: sourceId,
    overrideAccess: true,
    req,
  })
}

export const removeDraftSource = async ({
  actor,
  draftId,
  payload,
  sourceId,
}: {
  actor: User
  draftId: number
  payload: Payload
  sourceId: number
}) => {
  const { draft, sourceIds } = await ensureDraftSource({ actor, draftId, payload, sourceId })
  const remainingSourceIds = sourceIds.filter((id) => id !== sourceId)
  const safeSourceCount = await countSafeSources(payload, remainingSourceIds)
  const req = await createLocalReq({ user: actor }, payload)
  const updatedDraft = await payload.update({
    collection: 'ai-drafts',
    data: {
      publicVisibility:
        draft.publicVisibility === 'public' && safeSourceCount < 1 ? 'private' : draft.publicVisibility,
      sources: remainingSourceIds,
    },
    id: draft.id,
    overrideAccess: true,
    req,
  })

  await payload.delete({
    collection: 'sources',
    id: sourceId,
    overrideAccess: true,
    req,
  })

  return { draft: updatedDraft, sourceId }
}

export const verifySource = async ({
  actor,
  payload,
  sourceId,
}: {
  actor: User
  payload: Payload
  sourceId: number
}): Promise<Source> => {
  if (!isEditorUser(actor)) throw new SourceWorkflowError('Editor access is required.', 403)

  const source = await payload
    .findByID({
      collection: 'sources',
      depth: 0,
      id: sourceId,
      overrideAccess: true,
    })
    .catch(() => null)

  if (!source) throw new SourceWorkflowError('Source not found.', 404)
  assertSafePublicUrl(source.url)

  if (source.isVerified) return source

  const req = await createLocalReq({ user: actor }, payload)
  return payload.update({
    collection: 'sources',
    data: { isVerified: true },
    id: source.id,
    overrideAccess: false,
    req,
  })
}
