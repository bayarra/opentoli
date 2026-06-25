import { validateGenerationOutputV1 } from '@/ai/schemas/v1'
import config from '@/payload.config'
import type { AiDraft, Comment, Source, User } from '@/payload-types'
import { getPayload } from 'payload'

import { isEditorUser } from './permissions'

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

export const getDraftInbox = async (user: User) => {
  if (!isEditorUser(user)) return null
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
    isPublic: draft.publicVisibility === 'public',
    updatedAt: draft.updatedAt,
  }))
}

export const getEditorDraft = async (id: number, user: User) => {
  if (!isEditorUser(user)) return null
  const payload = await getPayload({ config: await config })
  const draft = await payload
    .findByID({ collection: 'ai-drafts', depth: 2, id, overrideAccess: true })
    .catch(() => null)
  if (!draft) return null

  let generated
  try {
    generated = validateGenerationOutputV1(draft.generatedPayload)
  } catch {
    return null
  }

  const comments = await payload.find({
    collection: 'comments',
    depth: 1,
    limit: 100,
    overrideAccess: true,
    sort: 'createdAt',
    where: { aiDraft: { equals: draft.id } },
  })

  return {
    category: relationLabel(draft.inputCategory, 'nameEn'),
    comments: (comments.docs as Comment[]).map((comment) => ({
      author: relationLabel(comment.user, 'name') || 'Member',
      body: comment.body,
      createdAt: comment.createdAt,
      id: comment.id,
      status: comment.status,
      suggestedTranslationMn: comment.suggestedTranslationMn,
    })),
    context: relationLabel(draft.inputContext, 'nameEn'),
    draft: draft as AiDraft,
    generated,
    sources: (draft.sources || []).flatMap((value) => {
      if (!value || typeof value !== 'object') return []
      const source = value as Source
      return [
        {
          id: source.id,
          isVerified: source.isVerified,
          publisher: source.publisher,
          safeUrl: safeUrl(source.url),
          sourceType: source.sourceType,
          title: source.title,
          url: source.url,
        },
      ]
    }),
  }
}
