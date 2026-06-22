import {
  validateCritiqueOutputV1,
  validateGenerationOutputV1,
  validateResearchPacketV1,
} from '@/ai/schemas/v1'
import config from '@/payload.config'
import type { AiDraft, Comment, Source, User } from '@/payload-types'
import { getPayload } from 'payload'

import { isEditorialUser, relationshipId } from './permissions'

const relationLabel = (value: unknown, field: 'nameEn' | 'name'): string | null => {
  if (!value || typeof value !== 'object' || !(field in value)) return null
  const label = (value as Record<string, unknown>)[field]
  return typeof label === 'string' ? label : null
}

const safeUrl = (value: string): string | null => {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null
  } catch {
    return null
  }
}

export const getReviewerQueue = async (user: User) => {
  if (!isEditorialUser(user)) return null
  const payload = await getPayload({ config: await config })
  const drafts = await payload.find({
    collection: 'ai-drafts',
    depth: 1,
    limit: 100,
    overrideAccess: true,
    sort: '-updatedAt',
    where: { status: { in: ['editing', 'needs_review'] } },
  })

  return drafts.docs.map((draft) => ({
    category: relationLabel(draft.inputCategory, 'nameEn'),
    headwordEn: draft.inputHeadword,
    id: draft.id,
    riskLevel: draft.riskLevel,
    reviewRoute: draft.reviewRoute,
    status: draft.status,
    updatedAt: draft.updatedAt,
  }))
}

export const getReviewerDraft = async (id: number, user: User) => {
  if (!isEditorialUser(user)) return null
  const payload = await getPayload({ config: await config })
  const draft = await payload
    .findByID({ collection: 'ai-drafts', depth: 2, id, overrideAccess: true })
    .catch(() => null)
  if (!draft) return null

  let generated
  let research
  let critique
  try {
    generated = validateGenerationOutputV1(draft.generatedPayload)
    research = validateResearchPacketV1(draft.researchPayload)
    critique = validateCritiqueOutputV1(draft.critiquePayload)
  } catch {
    return null
  }

  const [comments, decisions] = await Promise.all([
    payload.find({
      collection: 'comments',
      depth: 1,
      limit: 100,
      overrideAccess: true,
      sort: 'createdAt',
      where: { aiDraft: { equals: draft.id } },
    }),
    payload.find({
      collection: 'ai-draft-decisions',
      depth: 1,
      limit: 100,
      overrideAccess: true,
      sort: '-decisionAt',
      where: { aiDraft: { equals: draft.id } },
    }),
  ])

  return {
    category: relationLabel(draft.inputCategory, 'nameEn'),
    comments: (comments.docs as Comment[]).map((comment) => ({
      author: relationLabel(comment.user, 'name') || 'Contributor',
      body: comment.body,
      commentType: comment.commentType,
      createdAt: comment.createdAt,
      id: comment.id,
      status: comment.status,
      suggestedTranslationMn: comment.suggestedTranslationMn,
    })),
    context: relationLabel(draft.inputContext, 'nameEn'),
    critique,
    decisions: decisions.docs.map((decision) => ({
      action: decision.action,
      actor: relationLabel(decision.actor, 'name') || 'Reviewer',
      decisionAt: decision.decisionAt,
      id: decision.id,
      newReviewRoute: decision.newReviewRoute,
      notes: decision.notes,
    })),
    draft: draft as AiDraft,
    generated,
    research,
    sources: (draft.sources || []).flatMap((value) => {
      if (!value || typeof value !== 'object') return []
      const source = value as Source
      return [
        {
          id: source.id,
          isVerified: source.isVerified,
          publisher: source.publisher,
          title: source.title,
          url: safeUrl(source.url),
        },
      ]
    }),
    termId: relationshipId(draft.term),
  }
}
