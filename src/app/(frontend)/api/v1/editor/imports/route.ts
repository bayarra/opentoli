import { apiError, apiOk, requireEditor } from '@/api/v1/http'
import { getImportWorkspace } from '@/editor/imports'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = await requireEditor(request)
  if ('response' in auth) return auth.response
  const data = await getImportWorkspace(auth.user, auth.payload)
  if (!data) return apiError('forbidden', 'Editor access is required.', 403)
  return apiOk(data)
}
