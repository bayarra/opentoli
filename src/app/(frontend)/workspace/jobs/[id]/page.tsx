import { JobRetryButton } from '@/app/(frontend)/components/JobRetryButton'
import { WorkspaceShell } from '@/app/(frontend)/components/WorkspaceShell'
import { getEditorJob, jobLabel } from '@/editor/jobs'
import { getCurrentUser } from '@/lib/currentUser'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

type JobDetailPageProps = { params: Promise<{ id: string }> }

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Agent Job Detail | OpenToli',
}

export const dynamic = 'force-dynamic'

const statusLabel = (value: string) => value.replaceAll('_', ' ')
const formatDateTime = (value: string | null) =>
  value ? new Date(value).toISOString().replace('T', ' ').slice(0, 16) : 'Not recorded'
const formatCurrency = (value: number | null) =>
  typeof value === 'number' ? `$${value.toFixed(4)}` : 'Not recorded'
const formatDuration = (value: number | null) =>
  typeof value === 'number' ? `${Math.round(value / 1000)}s` : 'Not recorded'

export default async function AgentJobDetailPage({ params }: JobDetailPageProps) {
  const user = await getCurrentUser()
  const id = Number((await params).id)
  if (!user) redirect(`/login?next=${encodeURIComponent(`/workspace/jobs/${id}`)}`)
  if (!Number.isInteger(id) || id < 1) notFound()

  const job = await getEditorJob(id, user)
  if (!job) notFound()

  const labels = jobLabel(job)

  return (
    <WorkspaceShell>
      <main className="content-page workspace-page">
        <Link className="back-link" href="/workspace/jobs">
          Back to System Activity
        </Link>

        <header className="reviewer-heading">
          <div>
            <p className="eyebrow">Agent job detail</p>
            <h1>{job.inputHeadword}</h1>
            <p>
              {[labels.category, labels.context, labels.importBatch].filter(Boolean).join(' / ')}
            </p>
            <p>
              Safe operational detail only. Raw prompts, raw provider output, input snapshots, and
              private provider errors stay out of the web workflow.
            </p>
          </div>
          <div className="review-queue-badges">
            <span>{statusLabel(job.status)}</span>
            <span>{statusLabel(job.stage)}</span>
          </div>
        </header>

        <section className="metric-grid" aria-label="Generation job metrics">
          <article>
            <span>Attempts</span>
            <strong>
              {job.attempts.count}/{job.attempts.max}
            </strong>
            <p>{job.retry.attemptsRemaining} retry attempts remaining</p>
          </article>
          <article>
            <span>Tokens</span>
            <strong>{(job.usage.inputTokens || 0) + (job.usage.outputTokens || 0)}</strong>
            <p>
              {job.usage.inputTokens || 0} input / {job.usage.outputTokens || 0} output
            </p>
          </article>
          <article>
            <span>Cost</span>
            <strong>{formatCurrency(job.usage.estimatedCostUsd)}</strong>
            <p>Estimated provider cost retained on the job</p>
          </article>
          <article>
            <span>Latency</span>
            <strong>{formatDuration(job.timing.latencyMs)}</strong>
            <p>Last completed worker duration</p>
          </article>
        </section>

        <section className="workspace-grid">
          <div className="workspace-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Retry control</p>
                <h2>Queue a retry safely</h2>
              </div>
            </div>
            <p>
              Retry now only updates scheduling. It does not run <code>npm run ai:work</code> and
              does not call the AI provider.
            </p>
            <JobRetryButton
              canRetry={job.retry.canRetry}
              disabledReason={job.retry.reason}
              jobId={job.id}
            />
          </div>

          <div className="workspace-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Diagnostics</p>
                <h2>Safe failure summary</h2>
              </div>
            </div>
            {job.diagnostic ? (
              <div className="job-diagnostic">
                <strong>{job.diagnostic.errorCode}</strong>
                <p>{job.diagnostic.message}</p>
                {job.diagnostic.validationIssues.length > 0 ? (
                  <ul>
                    {job.diagnostic.validationIssues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <p>No safe failure diagnostic is recorded for this job.</p>
            )}
          </div>
        </section>

        <section className="workspace-grid">
          <div className="workspace-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Provenance</p>
                <h2>Model and prompt versions</h2>
              </div>
            </div>
            <dl className="job-detail-list">
              <div>
                <dt>Provider</dt>
                <dd>{job.model.provider}</dd>
              </div>
              <div>
                <dt>Model</dt>
                <dd>{job.model.name}</dd>
              </div>
              <div>
                <dt>Schema</dt>
                <dd>{job.model.schemaVersion}</dd>
              </div>
              <div>
                <dt>Research prompt</dt>
                <dd>{job.promptVersions.research}</dd>
              </div>
              <div>
                <dt>Generation prompt</dt>
                <dd>{job.promptVersions.generation}</dd>
              </div>
              <div>
                <dt>Critique prompt</dt>
                <dd>{job.promptVersions.critique}</dd>
              </div>
            </dl>
          </div>

          <div className="workspace-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Evidence retained</p>
                <h2>Private outputs</h2>
              </div>
            </div>
            <dl className="job-detail-list">
              <div>
                <dt>Research</dt>
                <dd>{job.evidence.researchRetained ? 'Retained privately' : 'Not retained yet'}</dd>
              </div>
              <div>
                <dt>Generation</dt>
                <dd>
                  {job.evidence.generationRetained ? 'Retained privately' : 'Not retained yet'}
                </dd>
              </div>
              <div>
                <dt>Critique</dt>
                <dd>{job.evidence.critiqueRetained ? 'Retained privately' : 'Not retained yet'}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="workspace-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Timing</p>
              <h2>Worker lifecycle</h2>
            </div>
          </div>
          <dl className="job-detail-list job-detail-list-wide">
            <div>
              <dt>Queued</dt>
              <dd>{formatDateTime(job.timing.queuedAt)}</dd>
            </div>
            <div>
              <dt>Started</dt>
              <dd>{formatDateTime(job.timing.startedAt)}</dd>
            </div>
            <div>
              <dt>Completed</dt>
              <dd>{formatDateTime(job.timing.completedAt)}</dd>
            </div>
            <div>
              <dt>Next retry</dt>
              <dd>{formatDateTime(job.timing.nextRetryAt)}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{formatDateTime(job.timing.updatedAt)}</dd>
            </div>
          </dl>
        </section>
      </main>
    </WorkspaceShell>
  )
}
