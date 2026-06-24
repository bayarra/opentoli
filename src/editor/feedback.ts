import config from '@/payload.config'
import type { Comment, Term, User } from '@/payload-types'
import { getPayload, type Payload } from 'payload'

import { isEditorUser } from './permissions'

export class FeedbackModerationError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

const allowedStatuses = ['approved', 'rejected', 'hidden'] as const

type ModerationStatus = (typeof allowedStatuses)[number]

const relationshipLabel = (value: unknown, field: 'inputHeadword' | 'headwordEn' | 'name') => {
  if (!value || typeof value !== 'object' || !(field in value)) return null
  const label = (value as Record<string, unknown>)[field]
  return typeof label === 'string' ? label : null
}

const relationshipId = (value: unknown): number | null => {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'number' ? id : null
  }
  return null
}

const termSlug = (value: unknown): string | null => {
  if (!value || typeof value !== 'object' || !('slug' in value)) return null
  const slug = (value as Term).slug
  return typeof slug === 'string' ? slug : null
}

const targetFor = (comment: Comment) => {
  if (comment.aiDraft) {
    const id = relationshipId(comment.aiDraft)
    return {
      href: id ? `/workspace/drafts/${id}` : null,
      label: relationshipLabel(comment.aiDraft, 'inputHeadword') || 'AI draft',
      type: 'AI Draft',
    }
  }

  if (comment.term) {
    const slug = termSlug(comment.term)
    return {
      href: slug ? `/terms/${slug}` : null,
      label: relationshipLabel(comment.term, 'headwordEn') || 'Term',
      type: 'Term',
    }
  }

  return { href: null, label: 'Unknown target', type: 'Unknown' }
}

export const getPendingFeedback = async (user: User) => {
  if (!isEditorUser(user)) return null

  const payload = await getPayload({ config: await config })
  const feedback = await payload.find({
    collection: 'comments',
    depth: 2,
    limit: 100,
    overrideAccess: true,
    sort: 'createdAt',
    where: { status: { equals: 'pending' } },
  })

  return (feedback.docs as Comment[]).map((comment) => {
    const target = targetFor(comment)

    return {
      author: relationshipLabel(comment.user, 'name') || 'OpenToli contributor',
      body: comment.body,
      commentType: comment.commentType,
      createdAt: comment.createdAt,
      id: comment.id,
      suggestedTranslationMn: comment.suggestedTranslationMn || null,
      target,
    }
  })
}

export const moderateFeedback = async ({
  actor,
  commentId,
  moderatorNote,
  payload,
  status,
}: {
  actor: User
  commentId: number
  moderatorNote?: string
  payload: Payload
  status: ModerationStatus
}) => {
  if (!isEditorUser(actor)) {
    throw new FeedbackModerationError('Sign in as an Editor to moderate feedback.', 403)
  }
  if (!allowedStatuses.includes(status)) {
    throw new FeedbackModerationError('Choose approve, reject, or hide.')
  }

  const existing = await payload
    .findByID({
      collection: 'comments',
      depth: 0,
      id: commentId,
      overrideAccess: true,
    })
    .catch(() => null)
  if (!existing) throw new FeedbackModerationError('Feedback was not found.', 404)
  if (existing.status !== 'pending') {
    throw new FeedbackModerationError('Only pending feedback can be moderated.', 409)
  }

  return payload.update({
    collection: 'comments',
    data: {
      moderatorNote: moderatorNote?.trim() || undefined,
      status,
    },
    id: commentId,
    overrideAccess: false,
    user: actor,
  })
}
