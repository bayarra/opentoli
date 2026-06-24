import { apiError, apiOk, requireEditor } from '@/api/v1/http'
import { getDraftInbox } from '@/editor/data'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = await requireEditor(request)
  if ('response' in auth) return auth.response

  const drafts = await getDraftInbox(auth.user)
  if (!drafts) return apiError('forbidden', 'Editor access is required.', 403)

  return apiOk({ drafts })
}
