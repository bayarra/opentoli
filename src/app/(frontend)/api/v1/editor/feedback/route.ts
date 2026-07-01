import { apiError, apiOk, requireEditor } from '@/api/v1/http'
import { getCommunityActivity } from '@/editor/feedback'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = await requireEditor(request)
  if ('response' in auth) return auth.response

  const feedback = await getCommunityActivity(auth.user)
  if (!feedback) return apiError('forbidden', 'Editor access is required.', 403)

  return apiOk({ feedback })
}
