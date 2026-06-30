import { WorkspaceShell } from '@/app/(frontend)/components/WorkspaceShell'
import { editorJobStatuses, getEditorJobsDashboard } from '@/editor/jobs'
import { getCurrentUser } from '@/lib/currentUser'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'System Activity | OpenToli',
}

export const dynamic = 'force-dynamic'

const statusLabel = (value: string) => value.replaceAll('_', ' ')
const formatDate = (value: string) => value.slice(0, 10)

type JobsPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

export default async function AgentJobsPage({ searchParams }: JobsPageProps) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=%2Fworkspace%2Fjobs')

  const params = await searchParams
  const rawStatus = firstValue(params.status)
  const status = editorJobStatuses.find((value) => value === rawStatus)
  const rawBatchId = Number(firstValue(params.batch))
  const rawPage = Number(firstValue(params.page))
  const dashboard = await getEditorJobsDashboard(user, {
    batchId: Number.isInteger(rawBatchId) && rawBatchId > 0 ? rawBatchId : undefined,
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
    query: firstValue(params.q),
    status,
  })
  if (!dashboard) {
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

  const pageHref = (page: number) => {
    const next = new URLSearchParams()
    if (dashboard.filters.query) next.set('q', dashboard.filters.query)
    if (dashboard.filters.status) next.set('status', dashboard.filters.status)
    if (dashboard.filters.batchId) next.set('batch', String(dashboard.filters.batchId))
    next.set('page', String(page))
    return `/workspace/jobs?${next.toString()}`
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
          <strong>{dashboard.counts.queued}</strong>
          <p>Ready for the controlled worker</p>
        </article>
        <article>
          <span>Running</span>
          <strong>{dashboard.counts.running}</strong>
          <p>Currently claimed by a worker</p>
        </article>
        <article>
          <span>Retrying</span>
          <strong>{dashboard.counts.retry_scheduled}</strong>
          <p>Waiting for the retry window</p>
        </article>
        <article>
          <span>Failed</span>
          <strong>{dashboard.counts.failed}</strong>
          <p>Needs technical attention</p>
        </article>
      </section>

      <form action="/workspace/jobs" className="job-filter-form" method="get">
        <label>Headword<input defaultValue={dashboard.filters.query} name="q" placeholder="Search headwords" /></label>
        <label>Status<select defaultValue={dashboard.filters.status || ''} name="status"><option value="">All statuses</option>{editorJobStatuses.map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}</select></label>
        <label>Import batch<select defaultValue={dashboard.filters.batchId || ''} name="batch"><option value="">All batches</option>{dashboard.batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name} / {statusLabel(batch.status)}</option>)}</select></label>
        <button type="submit">Apply filters</button>
        <Link href="/workspace/jobs">Clear</Link>
      </form>

      <section className="workspace-panel job-groups-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Filtered work</p>
            <h2>Grouped by import batch</h2>
          </div>
          <span>{dashboard.pagination.totalDocs} jobs</span>
        </div>
        <div className="job-group-list">{dashboard.groups.map((group) => <section className="job-group" key={group.batch.id || 'unbatched'}><div className="job-group-heading"><div><p className="eyebrow">Import batch</p><h3>{group.batch.label}</h3></div><span>{group.jobs.length} shown</span></div><div className="workspace-table" role="table" aria-label={`${group.batch.label} generation jobs`}><div role="row"><span role="columnheader">Headword</span><span role="columnheader">State</span><span role="columnheader">Evidence</span></div>{group.jobs.map((job) => <div role="row" key={job.id}><span role="cell"><strong><Link href={`/workspace/jobs/${job.id}`}>{job.inputHeadword}</Link></strong><small>{job.category?.label || 'Uncategorized'}</small></span><span role="cell">{statusLabel(job.status)} / {statusLabel(job.stage)}<small>Attempts {job.attempts}</small></span><span role="cell">{job.tokens || 'No usage yet'}<small>{[job.modelName, job.duration, job.cost, formatDate(job.updatedAt)].filter(Boolean).join(' / ')}</small><Link href={`/workspace/jobs/${job.id}`}>Open details</Link></span></div>)}</div></section>)}{dashboard.groups.length === 0 ? <div className="empty-state"><h3>No jobs match these filters.</h3><p>Clear a filter or prepare another import batch.</p></div> : null}</div>
        {dashboard.pagination.totalPages > 1 ? <nav aria-label="Agent job pages" className="job-pagination">{dashboard.pagination.hasPrevPage ? <Link href={pageHref(dashboard.pagination.page - 1)}>Previous</Link> : <span>Previous</span>}<strong>Page {dashboard.pagination.page} of {dashboard.pagination.totalPages}</strong>{dashboard.pagination.hasNextPage ? <Link href={pageHref(dashboard.pagination.page + 1)}>Next</Link> : <span>Next</span>}</nav> : null}
      </section>
      </main>
    </WorkspaceShell>
  )
}
