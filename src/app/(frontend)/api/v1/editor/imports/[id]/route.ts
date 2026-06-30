import { apiError, apiNotFound, apiOk, parsePositiveInteger, requireEditor } from '@/api/v1/http'
import { getImportBatch } from '@/editor/imports'

export const dynamic = 'force-dynamic'
type RouteProps = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: RouteProps) {
  const auth = await requireEditor(request)
  if ('response' in auth) return auth.response
  let id: number
  try {
    id = parsePositiveInteger((await params).id, 'import batch ID')
  } catch {
    return apiError('invalid_request', 'Invalid import batch ID.', 400)
  }
  const data = await getImportBatch(auth.user, id, auth.payload)
  return data ? apiOk(data) : apiNotFound('Import batch not found.')
}
