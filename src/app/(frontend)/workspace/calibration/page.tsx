import { WorkspaceShell } from '@/app/(frontend)/components/WorkspaceShell'
import { getM5CalibrationDashboard } from '@/calibration/outcomes'
import { getEditorWorkspace } from '@/editor/workspace'
import { getCurrentUser } from '@/lib/currentUser'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'AI Quality | OpenToli',
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
          <p>AI quality reporting is available only to Editors.</p>
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
  const rollup = dashboard.summary.rollup
  const goNoGoReport = [
    'M5 Go/No-Go Summary',
    `Status: ${rollup.decisionReady ? 'Ready for a human decision' : `Collecting evidence (${rollup.remainingOutcomes} outcomes remaining)`}`,
    `Terms processed: ${dashboard.summary.jobsCompleted}/${dashboard.summary.terms}`,
    `Human outcomes: ${dashboard.summary.outcomesRecorded}/${dashboard.summary.terms}`,
    `First-five review: ${rollup.firstBatch.outcomesRecorded}/${rollup.firstBatch.size}`,
    `Accepted: ${rollup.accepted} (${rollup.acceptanceRate}%)`,
    `Edited: ${rollup.edited} (${rollup.editRate}%)`,
    `Disagreement: ${rollup.disagreements} (${rollup.disagreementRate}%)`,
    `Regenerate or reject: ${rollup.regenerationOrRejected}`,
    `Average input/output tokens: ${rollup.averageInputTokens}/${rollup.averageOutputTokens}`,
    `Average latency: ${Math.round(rollup.averageLatencyMs / 1000)}s`,
    `Total estimated cost: $${rollup.totalCostUsd.toFixed(4)}`,
    `Models: ${rollup.modelProviders.map((provider, index) => `${provider}:${rollup.modelNames[index] || 'unknown'}`).join(', ') || 'No completed jobs'}`,
    `Prompt versions: ${rollup.promptVersions.join(', ') || 'No completed jobs'}`,
    `Preliminary signal: ${statusLabel(rollup.preliminarySignal)}`,
    `Decision: ${rollup.decisionReady ? 'Human decision required' : 'Not ready'}`,
  ].join('\n')

  return (
    <WorkspaceShell>
      <main className="content-page workspace-page">
        <div className="page-heading">
          <p className="eyebrow">AI quality report</p>
          <h1>Measure AI quality without creating a second work queue.</h1>
          <p>
            This page is read-only. Editors finish terminology and rate AI output in the Review
            Queue; this report aggregates those decisions, costs, and retained job evidence.
          </p>
        </div>

        <section className="metric-grid" aria-label="AI quality summary">
          <article>
            <span>Manifest terms</span>
            <strong>{validation.stats.termCount}</strong>
            <p>{manifest.categoryName}</p>
          </article>
          <article>
            <span>Generated drafts</span>
            <strong>{dashboard.summary.draftsGenerated}</strong>
            <p>AI drafts with retained generation provenance</p>
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

        <section className="workspace-grid calibration-rollup-grid">
          <div className="workspace-panel">
            <div className="panel-heading"><div><p className="eyebrow">Aggregate quality</p><h2>AI quality metrics</h2></div></div>
            <dl className="job-detail-list job-detail-list-wide">
              <div><dt>First five</dt><dd>{rollup.firstBatch.outcomesRecorded}/{rollup.firstBatch.size}{rollup.firstBatch.complete ? ' complete' : ' reviewed'}</dd></div>
              <div><dt>Acceptance</dt><dd>{rollup.acceptanceRate}%</dd></div>
              <div><dt>Edit rate</dt><dd>{rollup.editRate}%</dd></div>
              <div><dt>Disagreement</dt><dd>{rollup.disagreementRate}%</dd></div>
              <div><dt>Average latency</dt><dd>{Math.round(rollup.averageLatencyMs / 1000)}s</dd></div>
            </dl>
            <div className="calibration-outcome-breakdown">
              {Object.entries(dashboard.summary.outcomeCounts).map(([outcome, count]) => <span key={outcome}>{statusLabel(outcome)}: <strong>{count}</strong></span>)}
            </div>
          </div>

          <div className="workspace-panel go-no-go-panel">
            <div className="panel-heading"><div><p className="eyebrow">Decision readiness</p><h2>{rollup.decisionReady ? 'Ready for human go/no-go' : 'More evidence required'}</h2></div></div>
            <p><strong>Preliminary signal:</strong> {statusLabel(rollup.preliminarySignal)}</p>
            <p>{rollup.decisionReady ? 'All 50 human outcomes are present. Review this rollup and write the final M5 decision.' : `${rollup.remainingOutcomes} human outcomes remain. This signal is descriptive and cannot complete M5 automatically.`}</p>
            <div className="calibration-outcome-breakdown">{Object.entries(rollup.recommendationCounts).map(([recommendation, count]) => <span key={recommendation}>{statusLabel(recommendation)}: <strong>{count}</strong></span>)}</div>
          </div>
        </section>

        <section className="workspace-panel calibration-report-panel">
          <div className="panel-heading"><div><p className="eyebrow">Generated rollup</p><h2>M5 go/no-go summary</h2></div></div>
          <p className="muted-copy">This report is derived from recorded human outcomes and retained job metrics. It never starts jobs or makes the final decision.</p>
          <pre>{goNoGoReport}</pre>
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
              <p className="eyebrow">Quality outcomes</p>
              <h2>Recorded AI quality evidence</h2>
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
                  {item.draft ? (
                    <Link href={`/workspace/drafts/${item.draft.id}`}>
                      {item.outcome ? 'View review record' : 'Review in queue'}
                    </Link>
                  ) : null}
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
                      Edit {statusLabel(item.outcome.editLevel)} / language{' '}
                      {statusLabel(item.outcome.languageAssessment)} / domain{' '}
                      {statusLabel(item.outcome.domainAssessment)} / reviewed{' '}
                      {formatDate(item.outcome.reviewedAt)}
                    </span>
                    <p>{item.outcome.notes}</p>
                  </div>
                ) : null}

                {!item.draft ? (
                  <p className="muted-copy">
                    Prepare and run this calibration job before it can enter the Review Queue.
                  </p>
                ) : !item.outcome ? (
                  <p className="muted-copy">
                    Complete this draft in the Review Queue to record its AI quality outcome.
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="workspace-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Batches</p>
              <h2>Evaluation batch records</h2>
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
