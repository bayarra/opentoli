import { apiError, apiOk, requireEditor } from '@/api/v1/http'
import { editorJobStatuses, getEditorJobsDashboard } from '@/editor/jobs'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = await requireEditor(request)
  if ('response' in auth) return auth.response

  const url = new URL(request.url)
  const rawStatus = url.searchParams.get('status') || undefined
  const status = editorJobStatuses.find((value) => value === rawStatus)
  const rawBatchId = Number(url.searchParams.get('batch'))
  const rawPage = Number(url.searchParams.get('page'))
  const dashboard = await getEditorJobsDashboard(
    auth.user,
    {
      batchId: Number.isInteger(rawBatchId) && rawBatchId > 0 ? rawBatchId : undefined,
      page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
      query: url.searchParams.get('q') || undefined,
      status,
    },
    auth.payload,
  )
  if (!dashboard) return apiError('forbidden', 'Editor access is required.', 403)

  return apiOk(dashboard)
}
