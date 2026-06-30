import { WorkspaceShell } from '@/app/(frontend)/components/WorkspaceShell'
import { getEditorWorkspace } from '@/editor/workspace'
import { getCurrentUser } from '@/lib/currentUser'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Workspace | OpenToli',
}

export const dynamic = 'force-dynamic'

const statusLabel = (value: string) => value.replaceAll('_', ' ')

const formatDate = (value: string) => value.slice(0, 10)

export default async function WorkspacePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=%2Fworkspace')

  const workspace = await getEditorWorkspace(user)

  if (!workspace) {
    return (
      <main className="content-page">
        <div className="empty-state">
          <h1>Editor access required</h1>
          <p>
            The workspace shows private terminology and AI pipeline status, so it is available only
            to Editors.
          </p>
          <div className="empty-actions">
            <Link href="/drafts">View public drafts</Link>
            <Link href="/profile">Profile</Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <WorkspaceShell>
      <main className="content-page workspace-page">
      <div className="page-heading">
        <p className="eyebrow">Editor workspace</p>
        <h1>Terminology and agent work, without opening admin.</h1>
        <p>
          Track drafts, feedback, jobs, batches, and recent publications from OpenToli web. This
          page intentionally shows safe summaries only; raw prompts, provider output, and private
          job errors remain outside the normal workflow.
        </p>
      </div>

      <section className="workspace-actions" aria-label="Workspace actions">
        <Link href="/workspace/drafts">Open Draft Inbox</Link>
        <Link href="/workspace/terms">Edit published terms</Link>
        <Link href="/workspace/feedback">Moderate feedback</Link>
        <Link href="/workspace/jobs">Agent jobs</Link>
        <Link href="/workspace/imports">Prepare imports</Link>
        <Link href="/workspace/calibration">Calibration</Link>
        <Link href="/drafts">Public drafts</Link>
      </section>

      <section className="metric-grid" aria-label="Workspace summary">
        <article>
          <span>Active drafts</span>
          <strong>{workspace.counts.activeDrafts}</strong>
          <p>{workspace.counts.publicDrafts} open for public feedback</p>
        </article>
        <article>
          <span>Pending feedback</span>
          <strong>{workspace.counts.pendingFeedback}</strong>
          <p>Comments and translation suggestions waiting for moderation</p>
        </article>
        <article>
          <span>AI jobs</span>
          <strong>{workspace.counts.queuedJobs + workspace.counts.runningJobs}</strong>
          <p>
            {workspace.counts.queuedJobs} queued, {workspace.counts.runningJobs} running,{' '}
            {workspace.counts.retryJobs} retrying
          </p>
        </article>
        <article>
          <span>Published terms</span>
          <strong>{workspace.counts.publishedTerms}</strong>
          <p>{workspace.counts.resolvedDrafts} AI drafts have human outcomes</p>
        </article>
      </section>

      <section className="workspace-grid">
        <div className="workspace-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Agent work</p>
              <h2>Recent generation jobs</h2>
            </div>
            <span>{workspace.counts.failedJobs} failed</span>
          </div>
          <div className="workspace-table" role="table" aria-label="Recent generation jobs">
            <div role="row">
              <span role="columnheader">Headword</span>
              <span role="columnheader">State</span>
              <span role="columnheader">Evidence</span>
            </div>
            {workspace.jobs.map((job) => (
              <div role="row" key={job.id}>
                <span role="cell">
                  <strong>{job.inputHeadword}</strong>
                  <small>{job.category || 'Uncategorized'}</small>
                </span>
                <span role="cell">
                  {statusLabel(job.status)} / {statusLabel(job.stage)}
                  <small>Attempts {job.attempts}</small>
                </span>
                <span role="cell">
                  {job.tokens || 'No usage yet'}
                  <small>
                    {[job.modelName, job.duration, job.cost, formatDate(job.updatedAt)]
                      .filter(Boolean)
                      .join(' / ')}
                  </small>
                </span>
              </div>
            ))}
            {workspace.jobs.length === 0 ? <p>No generation jobs yet.</p> : null}
          </div>
        </div>

        <div className="workspace-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Batches</p>
              <h2>Import and calibration batches</h2>
            </div>
          </div>
          <div className="batch-list">
            {workspace.batches.map((batch) => (
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
            {workspace.batches.length === 0 ? <p>No import batches yet.</p> : null}
          </div>
        </div>
      </section>

      <section className="workspace-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Canonical dictionary</p>
            <h2>Recently published terms</h2>
          </div>
          <Link href="/search">Search all</Link>
        </div>
        <div className="published-term-list">
          {workspace.terms.map((term) => (
            <Link href={`/workspace/terms/${term.id}`} key={term.id}>
              <strong>{term.headwordEn}</strong>
              <span>
                {statusLabel(term.reviewStatus)} / updated {formatDate(term.updatedAt)}
              </span>
            </Link>
          ))}
          {workspace.terms.length === 0 ? <p>No published terms yet.</p> : null}
        </div>
      </section>
      </main>
    </WorkspaceShell>
  )
}
