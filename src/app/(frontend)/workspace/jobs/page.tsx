import { WorkspaceShell } from '@/app/(frontend)/components/WorkspaceShell'
import { getEditorWorkspace } from '@/editor/workspace'
import { getCurrentUser } from '@/lib/currentUser'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Agent Jobs | OpenToli',
}

export const dynamic = 'force-dynamic'

const statusLabel = (value: string) => value.replaceAll('_', ' ')
const formatDate = (value: string) => value.slice(0, 10)

export default async function AgentJobsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=%2Fworkspace%2Fjobs')

  const workspace = await getEditorWorkspace(user)
  if (!workspace) {
    return (
      <main className="content-page">
        <div className="empty-state">
          <h1>Editor access required</h1>
          <p>Agent job status is available only to Editors.</p>
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
        <p className="eyebrow">Agent jobs</p>
        <h1>Track AI preparation without opening admin.</h1>
        <p>
          This page shows safe operational status only: readiness, stage, attempts, model, usage,
          cost, and timing. Raw prompts, provider output, and private errors stay out of the normal
          editor workflow.
        </p>
      </div>

      <section className="metric-grid" aria-label="Agent job summary">
        <article>
          <span>Queued</span>
          <strong>{workspace.counts.queuedJobs}</strong>
          <p>Ready for the controlled worker</p>
        </article>
        <article>
          <span>Running</span>
          <strong>{workspace.counts.runningJobs}</strong>
          <p>Currently claimed by a worker</p>
        </article>
        <article>
          <span>Retrying</span>
          <strong>{workspace.counts.retryJobs}</strong>
          <p>Waiting for the retry window</p>
        </article>
        <article>
          <span>Failed</span>
          <strong>{workspace.counts.failedJobs}</strong>
          <p>Needs technical attention</p>
        </article>
      </section>

      <section className="workspace-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Recent work</p>
            <h2>Generation jobs</h2>
          </div>
        </div>
        <div className="workspace-table" role="table" aria-label="Generation jobs">
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
      </section>
      </main>
    </WorkspaceShell>
  )
}
