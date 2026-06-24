import { apiError, apiOk, requireEditor } from '@/api/v1/http'
import { getEditorWorkspace } from '@/editor/workspace'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = await requireEditor(request)
  if ('response' in auth) return auth.response

  const workspace = await getEditorWorkspace(auth.user)
  if (!workspace) return apiError('forbidden', 'Editor access is required.', 403)

  return apiOk({
    counts: {
      completedJobs: workspace.counts.completedJobs,
      failedJobs: workspace.counts.failedJobs,
      queuedJobs: workspace.counts.queuedJobs,
      retryJobs: workspace.counts.retryJobs,
      runningJobs: workspace.counts.runningJobs,
    },
    jobs: workspace.jobs,
  })
}
