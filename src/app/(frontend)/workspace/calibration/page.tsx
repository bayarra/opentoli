import { WorkspaceShell } from '@/app/(frontend)/components/WorkspaceShell'
import { loadM5Manifest, validateM5Manifest } from '@/calibration/m5Manifest'
import { getEditorWorkspace } from '@/editor/workspace'
import { getCurrentUser } from '@/lib/currentUser'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'M5 Calibration | OpenToli',
}

export const dynamic = 'force-dynamic'

const statusLabel = (value: string) => value.replaceAll('_', ' ')
const formatDate = (value: string) => value.slice(0, 10)

export default async function CalibrationPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=%2Fworkspace%2Fcalibration')

  const [workspace, manifest] = await Promise.all([getEditorWorkspace(user), loadM5Manifest()])
  if (!workspace) {
    return (
      <main className="content-page">
        <div className="empty-state">
          <h1>Editor access required</h1>
          <p>Calibration status is available only to Editors.</p>
          <div className="empty-actions">
            <Link href="/drafts">View public drafts</Link>
            <Link href="/profile">Profile</Link>
          </div>
        </div>
      </main>
    )
  }

  const validation = validateM5Manifest(manifest)
  const m5Batches = workspace.batches.filter((batch) => batch.name.includes('M5'))

  return (
    <WorkspaceShell>
      <main className="content-page workspace-page">
      <div className="page-heading">
        <p className="eyebrow">M5 calibration</p>
        <h1>Track the fixed 50-term calibration batch.</h1>
        <p>
          The calibration flow measures quality and cost before scaling generation. Preparation
          and worker execution stay controlled; this page makes the run policy and current evidence
          easier to find.
        </p>
      </div>

      <section className="metric-grid" aria-label="Calibration summary">
        <article>
          <span>Manifest terms</span>
          <strong>{validation.stats.termCount}</strong>
          <p>{manifest.categoryName}</p>
        </article>
        <article>
          <span>Sources</span>
          <strong>{validation.stats.sourceCount}</strong>
          <p>All manifest URLs must validate before batch work</p>
        </article>
        <article>
          <span>Queued jobs</span>
          <strong>{workspace.counts.queuedJobs}</strong>
          <p>Prepared jobs waiting for `npm run ai:work`</p>
        </article>
        <article>
          <span>Active drafts</span>
          <strong>{workspace.counts.activeDrafts}</strong>
          <p>AI drafts waiting for Editor outcome</p>
        </article>
      </section>

      <section className="workspace-grid">
        <div className="workspace-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Run policy</p>
              <h2>{manifest.name}</h2>
            </div>
          </div>
          <div className="calibration-policy">
            <dl>
              <div>
                <dt>First batch</dt>
                <dd>{manifest.runPolicy.firstBatchSize} terms</dd>
              </div>
              <div>
                <dt>Next batch size</dt>
                <dd>{manifest.runPolicy.subsequentBatchSize} terms</dd>
              </div>
              <div>
                <dt>Prepare command</dt>
                <dd>
                  <code>{manifest.runPolicy.defaultPrepareCommand}</code>
                </dd>
              </div>
              <div>
                <dt>Worker command</dt>
                <dd>
                  <code>{manifest.runPolicy.processOneJobCommand}</code>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="workspace-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Difficulty mix</p>
              <h2>Manifest shape</h2>
            </div>
          </div>
          <div className="batch-list">
            {Object.entries(validation.stats.difficultyCounts).map(([difficulty, count]) => (
              <article key={difficulty}>
                <strong>{statusLabel(difficulty)}</strong>
                <span>{count} terms</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="workspace-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Batches</p>
            <h2>Calibration batch records</h2>
          </div>
        </div>
        <div className="batch-list">
          {m5Batches.map((batch) => (
            <article key={batch.id}>
              <strong>{batch.name}</strong>
              <span>{statusLabel(batch.status)}</span>
              <p>{batch.sourceTitle}</p>
              <small>
                {batch.totalRows} rows / {batch.acceptedRows} accepted / {batch.duplicateRows}{' '}
                duplicates / updated {formatDate(batch.updatedAt)}
              </small>
            </article>
          ))}
          {m5Batches.length === 0 ? <p>No M5 batch records yet.</p> : null}
        </div>
      </section>
      </main>
    </WorkspaceShell>
  )
}
