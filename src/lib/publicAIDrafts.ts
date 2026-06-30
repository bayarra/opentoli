import { validateGenerationOutputV1 } from '@/ai/schemas/v1'
import config from '@/payload.config'
import type { AiDraft, Comment, Source, User } from '@/payload-types'
import { getPayload } from 'payload'

const getPayloadClient = async () => getPayload({ config: await config })

const relationName = (value: unknown): string | null => {
  if (!value || typeof value !== 'object' || !('nameEn' in value)) return null
  const name = (value as { nameEn?: unknown }).nameEn
  return typeof name === 'string' ? name : null
}

const contributorName = (comment: Comment): string => {
  if (!comment.user || typeof comment.user !== 'object') return 'OpenToli contributor'
  return (comment.user as User).name || 'OpenToli contributor'
}

const safePublicUrl = (value: string): string | null => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

export const getPublicAIDraftById = async (id: number) => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'ai-drafts',
    depth: 2,
    limit: 1,
    overrideAccess: true,
    where: { id: { equals: id } },
  })
  const draft = result.docs[0] as AiDraft | undefined

  if (
    !draft ||
    draft.publicVisibility !== 'public' ||
    !['editing', 'needs_review'].includes(draft.status)
  ) {
    return null
  }

  let generated
  try {
    generated = validateGenerationOutputV1(draft.generatedPayload)
  } catch {
    return null
  }

  const approvedComments = await payload.find({
    collection: 'comments',
    depth: 1,
    limit: 100,
    overrideAccess: true,
    sort: 'createdAt',
    where: {
      and: [{ aiDraft: { equals: draft.id } }, { status: { equals: 'approved' } }],
    },
  })

  return {
    alternatives: generated.alternativeTranslations
      .filter((candidate) => candidate.type !== 'rejected')
      .map((candidate) => ({
        context: candidate.context,
        translationMn: candidate.translationMn,
        type: candidate.type,
        usageNote: candidate.usageNote,
      })),
    category: relationName(draft.inputCategory),
    comments: (approvedComments.docs as Comment[]).map((comment) => ({
      author: contributorName(comment),
      body: comment.body,
      commentType: comment.commentType,
      createdAt: comment.createdAt,
      id: comment.id,
      suggestedTranslationMn: comment.suggestedTranslationMn,
    })),
    context: relationName(draft.inputContext),
    examples: generated.examples,
    explanationEn: generated.explanationEn,
    explanationMn: generated.explanationMn,
    headwordEn: draft.inputHeadword,
    id: draft.id,
    recommendedTranslationMn: generated.recommendedTranslationMn,
    reviewRoute: draft.reviewRoute,
    references: (draft.sources || [])
      .filter((reference): reference is Source => typeof reference === 'object')
      .flatMap((reference) => {
        const url = safePublicUrl(reference.url)
        return url ? [{ id: reference.id, title: reference.title, url }] : []
      }),
    updatedAt: draft.updatedAt,
  }
}

export const getPublicAIDrafts = async () => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'ai-drafts',
    depth: 1,
    limit: 50,
    overrideAccess: true,
    sort: '-updatedAt',
    where: {
      and: [
        { publicVisibility: { equals: 'public' } },
        { status: { in: ['editing', 'needs_review'] } },
      ],
    },
  })

  return (result.docs as AiDraft[]).flatMap((draft) => {
    let generated
    try {
      generated = validateGenerationOutputV1(draft.generatedPayload)
    } catch {
      return []
    }

    return [
      {
        category: relationName(draft.inputCategory),
        headwordEn: draft.inputHeadword,
        id: draft.id,
        recommendedTranslationMn: generated.recommendedTranslationMn,
        updatedAt: draft.updatedAt,
      },
    ]
  })
}
