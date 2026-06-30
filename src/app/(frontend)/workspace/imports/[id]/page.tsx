import { ImportBatchActions, ImportItemActions } from '@/app/(frontend)/components/ImportBatchReviewActions'
import { WorkspaceShell } from '@/app/(frontend)/components/WorkspaceShell'
import { getImportBatch } from '@/editor/imports'
import { getCurrentUser } from '@/lib/currentUser'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

export const metadata: Metadata = { robots: { follow: false, index: false }, title: 'Review Import Batch | OpenToli' }
export const dynamic = 'force-dynamic'
type PageProps = { params: Promise<{ id: string }> }
const label = (value: string) => value.replaceAll('_', ' ')

export default async function ImportBatchPage({ params }: PageProps) {
  const user = await getCurrentUser()
  const id = Number((await params).id)
  if (!user) redirect(`/login?next=${encodeURIComponent(`/workspace/imports/${id}`)}`)
  if (!Number.isInteger(id) || id < 1) notFound()
  const data = await getImportBatch(user, id)
  if (!data) notFound()
  const pendingCount = data.items.filter((item) => item.status === 'pending').length
  const acceptedCount = data.items.filter((item) => item.status === 'accepted').length
  return <WorkspaceShell><main className="content-page workspace-page"><Link className="back-link" href="/workspace/imports">Back to imports</Link><div className="page-heading"><p className="eyebrow">Import batch / {label(data.batch.status)}</p><h1>{data.batch.name}</h1><p>{data.batch.category?.nameEn || 'Uncategorized'} / {data.batch.totalRows} parsed rows. Review every valid row before queueing.</p></div><ImportBatchActions batchId={data.batch.id} canQueue={pendingCount === 0 && acceptedCount > 0} pendingCount={pendingCount} /><section className="workspace-panel"><div className="panel-heading"><div><p className="eyebrow">Row review</p><h2>Prepared terms</h2></div></div><div className="import-item-list">{data.items.map((item) => <article key={item.id}><div><span>Row {item.rowNumber}</span><strong>{item.headwordEn}</strong>{item.contextNote ? <p>{item.contextNote}</p> : null}</div><div><span className={`import-status import-status-${item.status}`}>{label(item.status)}</span>{item.messages.map((message) => <small key={message}>{message}</small>)}{item.generationJobId ? <Link href={`/workspace/jobs/${item.generationJobId}`}>Job {item.generationJobId}</Link> : null}</div><ImportItemActions itemId={item.id} status={item.status} /></article>)}</div></section></main></WorkspaceShell>
}
