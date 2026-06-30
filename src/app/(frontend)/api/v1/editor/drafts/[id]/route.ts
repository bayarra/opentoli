import { apiError, apiNotFound, apiOk, parsePositiveInteger, requireEditor } from '@/api/v1/http'
import { getEditorDraft } from '@/editor/data'

type RouteProps = { params: Promise<{ id: string }> }

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: RouteProps) {
  const auth = await requireEditor(request)
  if ('response' in auth) return auth.response

  let id: number
  try {
    id = parsePositiveInteger((await params).id, 'draft ID')
  } catch {
    return apiError('invalid_request', 'Invalid draft ID.', 400)
  }

  const data = await getEditorDraft(id, auth.user)
  if (!data) return apiNotFound('Editor draft was not found.')

  const active = ['editing', 'needs_review'].includes(data.draft.status)

  return apiOk({
    comments: data.comments,
    draft: {
      active,
      category: data.category,
      context: data.context,
      fields: {
        explanationEn: data.generated.explanationEn,
        explanationMn: data.generated.explanationMn,
        headwordEn: data.generated.headwordEn,
        recommendedTranslationMn: data.generated.recommendedTranslationMn,
      },
      headwordEn: data.draft.inputHeadword,
      id: data.draft.id,
      publicVisibility: data.draft.publicVisibility,
      reviewRoute: data.draft.reviewRoute,
      status: data.draft.status,
      updatedAt: data.draft.updatedAt,
    },
    generated: {
      alternatives: data.generated.alternativeTranslations.map((candidate) => ({
        context: candidate.context || null,
        rejectionReason: candidate.rejectionReason || null,
        translationMn: candidate.translationMn,
        type: candidate.type,
        usageNote: candidate.usageNote || null,
      })),
      examples: data.generated.examples,
    },
    references: data.references,
  })
}
