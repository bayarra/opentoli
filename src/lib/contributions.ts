import config from '@/payload.config'
import type { AiDraft, Comment, Term, User } from '@/payload-types'
import { getPayload } from 'payload'

const relationId = (value: unknown): number | null => {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'number' ? id : null
  }
  return null
}

const targetFor = (comment: Comment) => {
  if (comment.aiDraft && typeof comment.aiDraft === 'object') {
    const draft = comment.aiDraft as AiDraft
    const id = relationId(draft)
    return {
      href: draft.publicVisibility === 'public' && id ? `/drafts/${id}` : null,
      label: draft.inputHeadword,
      type: 'AI Draft',
    }
  }

  if (comment.term && typeof comment.term === 'object') {
    const term = comment.term as Term
    return {
      href: term.slug ? `/terms/${term.slug}` : null,
      label: term.headwordEn,
      type: 'Term',
    }
  }

  return { href: null, label: 'Unknown target', type: 'Unknown' }
}

export const getUserContributions = async (user: User) => {
  const payload = await getPayload({ config: await config })
  const comments = await payload.find({
    collection: 'comments',
    depth: 2,
    limit: 100,
    overrideAccess: true,
    sort: '-updatedAt',
    where: { user: { equals: user.id } },
  })

  return (comments.docs as Comment[]).map((comment) => ({
    body: comment.body,
    commentType: comment.commentType,
    createdAt: comment.createdAt,
    id: comment.id,
    moderatedAt: comment.moderatedAt || null,
    moderatorNote: comment.moderatorNote || null,
    status: comment.status,
    suggestedTranslationMn: comment.suggestedTranslationMn || null,
    target: targetFor(comment),
    updatedAt: comment.updatedAt,
  }))
}
