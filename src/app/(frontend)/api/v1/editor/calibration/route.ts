import { apiError, apiOk, requireEditor } from '@/api/v1/http'
import { getM5CalibrationDashboard } from '@/calibration/outcomes'
import { getEditorWorkspace } from '@/editor/workspace'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = await requireEditor(request)
  if ('response' in auth) return auth.response

  const [workspace, dashboard] = await Promise.all([
    getEditorWorkspace(auth.user),
    getM5CalibrationDashboard(auth.user, auth.payload),
  ])
  if (!workspace || !dashboard) return apiError('forbidden', 'Editor access is required.', 403)

  return apiOk({
    batches: workspace.batches.filter((batch) => batch.name.includes('M5')),
    calibration: dashboard.manifest,
    counts: {
      activeDrafts: workspace.counts.activeDrafts,
      calibrationDraftsGenerated: dashboard.summary.draftsGenerated,
      calibrationJobsCompleted: dashboard.summary.jobsCompleted,
      calibrationOutcomesRecorded: dashboard.summary.outcomesRecorded,
      queuedJobs: workspace.counts.queuedJobs,
      retryJobs: workspace.counts.retryJobs,
      runningJobs: workspace.counts.runningJobs,
    },
    items: dashboard.items,
    summary: dashboard.summary,
  })
}
