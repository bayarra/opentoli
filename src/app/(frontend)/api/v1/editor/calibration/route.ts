import { apiError, apiOk, requireEditor } from '@/api/v1/http'
import { loadM5Manifest, validateM5Manifest } from '@/calibration/m5Manifest'
import { getEditorWorkspace } from '@/editor/workspace'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = await requireEditor(request)
  if ('response' in auth) return auth.response

  const [workspace, manifest] = await Promise.all([getEditorWorkspace(auth.user), loadM5Manifest()])
  if (!workspace) return apiError('forbidden', 'Editor access is required.', 403)

  const validation = validateM5Manifest(manifest)

  return apiOk({
    batches: workspace.batches.filter((batch) => batch.name.includes('M5')),
    calibration: {
      categoryName: manifest.categoryName,
      categorySlug: manifest.categorySlug,
      description: manifest.description,
      milestone: manifest.milestone,
      name: manifest.name,
      runPolicy: manifest.runPolicy,
      validation,
      version: manifest.version,
    },
    counts: {
      activeDrafts: workspace.counts.activeDrafts,
      queuedJobs: workspace.counts.queuedJobs,
      retryJobs: workspace.counts.retryJobs,
      runningJobs: workspace.counts.runningJobs,
    },
  })
}
