import { apiError, apiNotFound, apiOk, parsePositiveInteger, requireEditor } from '@/api/v1/http'
import { getEditorJob } from '@/editor/jobs'

type RouteProps = { params: Promise<{ id: string }> }

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: RouteProps) {
  const auth = await requireEditor(request)
  if ('response' in auth) return auth.response

  let id: number
  try {
    id = parsePositiveInteger((await params).id, 'generation job ID')
  } catch {
    return apiError('invalid_request', 'Invalid generation job ID.', 400)
  }

  const job = await getEditorJob(id, auth.user)
  if (!job) return apiNotFound('Generation job was not found.')

  return apiOk({ job })
}
