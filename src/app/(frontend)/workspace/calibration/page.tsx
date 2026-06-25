import { WorkspaceShell } from '@/app/(frontend)/components/WorkspaceShell'
import { CalibrationOutcomeForm } from '@/app/(frontend)/components/CalibrationOutcomeForm'
import { getM5CalibrationDashboard } from '@/calibration/outcomes'
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

  const [workspace, dashboard] = await Promise.all([
    getEditorWorkspace(user),
    getM5CalibrationDashboard(user),
  ])
  if (!workspace || !dashboard) {
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

  const manifest = dashboard.manifest
  const validation = dashboard.manifest.validation
  const m5Batches = workspace.batches.filter((batch) => batch.name.includes('M5'))

  return (
    <WorkspaceShell>
      <main className="content-page workspace-page">
        <div className="page-heading">
          <p className="eyebrow">M5 calibration</p>
          <h1>Track the fixed 50-term calibration batch.</h1>
          <p>
            The calibration flow measures quality and cost before scaling generation. Preparation
            and worker execution stay controlled; this page makes the run policy, job evidence, and
            human outcome notes easier to find.
          </p>
        </div>

        <section className="metric-grid" aria-label="Calibration summary">
          <article>
            <span>Manifest terms</span>
            <strong>{validation.stats.termCount}</strong>
            <p>{manifest.categoryName}</p>
          </article>
          <article>
            <span>Generated drafts</span>
            <strong>{dashboard.summary.draftsGenerated}</strong>
            <p>Calibration drafts with retained AI provenance</p>
          </article>
          <article>
            <span>Queued jobs</span>
            <strong>{dashboard.summary.jobsQueued}</strong>
            <p>Prepared calibration jobs waiting for `npm run ai:work`</p>
          </article>
          <article>
            <span>Outcomes</span>
            <strong>{dashboard.summary.outcomesRecorded}</strong>
            <p>Human calibration records saved from OpenToli web</p>
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
              <p className="eyebrow">Review outcomes</p>
              <h2>Human calibration evidence</h2>
            </div>
          </div>
          <div className="calibration-item-list">
            {dashboard.items.map((item) => (
              <article className="calibration-item" key={item.id}>
                <div className="calibration-item-heading">
                  <div>
                    <p className="eyebrow">
                      #{item.priority} / {statusLabel(item.difficulty)}
                    </p>
                    <h3>{item.headwordEn}</h3>
                    <p>
                      {item.subcategory} / {item.context}
                    </p>
                  </div>
                  {item.draft ? <Link href={`/workspace/drafts/${item.draft.id}`}>Open draft</Link> : null}
                </div>

                <div className="calibration-evidence">
                  <span>Job: {item.job ? statusLabel(item.job.status) : 'not prepared'}</span>
                  <span>Draft: {item.draft ? statusLabel(item.draft.status) : 'not generated'}</span>
                  <span>Route: {item.draft ? statusLabel(item.draft.reviewRoute) : 'not routed'}</span>
                  {item.job?.tokens ? <span>Tokens: {item.job.tokens}</span> : null}
                  {item.job?.duration ? <span>Latency: {item.job.duration}</span> : null}
                  {item.job?.cost ? <span>Cost: {item.job.cost}</span> : null}
                </div>

                {item.outcome ? (
                  <div className="calibration-outcome-summary">
                    <strong>{statusLabel(item.outcome.outcome)}</strong>
                    <span>
                      Edit {statusLabel(item.outcome.editLevel)} / sources{' '}
                      {statusLabel(item.outcome.sourceAssessment)} / reviewed{' '}
                      {formatDate(item.outcome.reviewedAt)}
                    </span>
                    <p>{item.outcome.notes}</p>
                  </div>
                ) : null}

                {item.draft ? (
                  <details className="calibration-outcome-details">
                    <summary>{item.outcome ? 'Update outcome' : 'Record outcome'}</summary>
                    <CalibrationOutcomeForm draftId={item.draft.id} outcome={item.outcome} />
                  </details>
                ) : (
                  <p className="muted-copy">
                    Prepare and run this calibration job before recording a human outcome.
                  </p>
                )}
              </article>
            ))}
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
