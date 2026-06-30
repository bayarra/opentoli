import type { User } from '@/payload-types'
import { createLocalReq, type Payload } from 'payload'

import { isEditorUser, relationshipId } from './permissions'

export class ReferenceWorkflowError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message)
    this.name = 'ReferenceWorkflowError'
  }
}

export type DraftReferenceFields = {
  title: string
  url: string
}

const requiredText = (value: unknown, label: string): string => {
  if (typeof value !== 'string' || value.trim().length < 2) {
    throw new ReferenceWorkflowError(`${label} is required.`)
  }
  return value.trim()
}

const safeUrl = (value: unknown): string => {
  const url = requiredText(value, 'URL')
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.toString()
  } catch {
    // Use the shared validation error below.
  }
  throw new ReferenceWorkflowError('Reference URL must use http or https.')
}

export const parseDraftReferenceFields = (value: unknown): DraftReferenceFields => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ReferenceWorkflowError('Reference fields are required.')
  }

  const input = value as Record<string, unknown>
  return {
    title: requiredText(input.title, 'Title'),
    url: safeUrl(input.url),
  }
}

const referenceIdsForDraft = (value: unknown): number[] =>
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
  if (!isEditorUser(actor)) throw new ReferenceWorkflowError('Editor access is required.', 403)

  const draft = await payload
    .findByID({
      collection: 'ai-drafts',
      depth: 2,
      id: draftId,
      overrideAccess: true,
    })
    .catch(() => null)
  if (!draft) throw new ReferenceWorkflowError('Draft not found.', 404)
  if (!['editing', 'needs_review'].includes(draft.status)) {
    throw new ReferenceWorkflowError('This draft is no longer active.', 409)
  }

  const termId = relationshipId(draft.term)
  if (!termId) throw new ReferenceWorkflowError('The draft term container is missing.', 409)

  return { referenceIds: referenceIdsForDraft(draft.sources), termId }
}

const ensureDraftReference = async ({
  actor,
  draftId,
  payload,
  referenceId,
}: {
  actor: User
  draftId: number
  payload: Payload
  referenceId: number
}) => {
  const draftState = await loadEditorDraft({ actor, draftId, payload })
  if (!draftState.referenceIds.includes(referenceId)) {
    throw new ReferenceWorkflowError('Reference is not attached to this draft.', 404)
  }

  const reference = await payload
    .findByID({
      collection: 'sources',
      depth: 0,
      id: referenceId,
      overrideAccess: true,
    })
    .catch(() => null)
  if (!reference) throw new ReferenceWorkflowError('Reference not found.', 404)

  return { ...draftState, reference }
}

export const addDraftReference = async ({
  actor,
  draftId,
  fields,
  payload,
}: {
  actor: User
  draftId: number
  fields: DraftReferenceFields
  payload: Payload
}) => {
  const { referenceIds, termId } = await loadEditorDraft({ actor, draftId, payload })
  const req = await createLocalReq({ user: actor }, payload)
  const reference = await payload.create({
    collection: 'sources',
    data: {
      createdBy: actor.id,
      publisher: 'Reference',
      sourceType: 'other',
      term: termId,
      title: fields.title,
      url: fields.url,
    },
    overrideAccess: true,
    req,
  })

  const updatedDraft = await payload.update({
    collection: 'ai-drafts',
    data: { sources: [...new Set([...referenceIds, reference.id])] },
    id: draftId,
    overrideAccess: true,
    req,
  })

  return { draft: updatedDraft, reference }
}

export const updateDraftReference = async ({
  actor,
  draftId,
  fields,
  payload,
  referenceId,
}: {
  actor: User
  draftId: number
  fields: DraftReferenceFields
  payload: Payload
  referenceId: number
}) => {
  await ensureDraftReference({ actor, draftId, payload, referenceId })
  const req = await createLocalReq({ user: actor }, payload)

  return payload.update({
    collection: 'sources',
    data: { title: fields.title, url: fields.url },
    id: referenceId,
    overrideAccess: true,
    req,
  })
}

export const removeDraftReference = async ({
  actor,
  draftId,
  payload,
  referenceId,
}: {
  actor: User
  draftId: number
  payload: Payload
  referenceId: number
}) => {
  const { referenceIds } = await ensureDraftReference({ actor, draftId, payload, referenceId })
  const req = await createLocalReq({ user: actor }, payload)
  const updatedDraft = await payload.update({
    collection: 'ai-drafts',
    data: { sources: referenceIds.filter((id) => id !== referenceId) },
    id: draftId,
    overrideAccess: true,
    req,
  })

  await payload.delete({ collection: 'sources', id: referenceId, overrideAccess: true, req })
  return { draft: updatedDraft, referenceId }
}
