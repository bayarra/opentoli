import { ImportBatchCreateForm } from '@/app/(frontend)/components/ImportBatchCreateForm'
import { WorkspaceShell } from '@/app/(frontend)/components/WorkspaceShell'
import { getImportWorkspace } from '@/editor/imports'
import { getCurrentUser } from '@/lib/currentUser'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { robots: { follow: false, index: false }, title: 'Import Preparation | OpenToli' }
export const dynamic = 'force-dynamic'
const label = (value: string) => value.replaceAll('_', ' ')

export default async function ImportPreparationPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=%2Fworkspace%2Fimports')
  const data = await getImportWorkspace(user)
  if (!data) return <main className="content-page"><div className="empty-state"><h1>Editor access required</h1><p>Import preparation is available only to Editors.</p></div></main>
  return <WorkspaceShell><main className="content-page workspace-page"><div className="page-heading"><p className="eyebrow">Import preparation</p><h1>Review terms before they enter the AI queue.</h1><p>Paste a manual list or CSV, inspect duplicates and validation results, then explicitly queue accepted rows. Preparing and queueing do not call the AI provider.</p></div><section className="workspace-panel"><div className="panel-heading"><div><p className="eyebrow">New batch</p><h2>Prepare terms</h2></div></div><ImportBatchCreateForm categories={data.categories} /></section><section className="workspace-panel"><div className="panel-heading"><div><p className="eyebrow">Prepared batches</p><h2>Review history</h2></div></div><div className="batch-list import-batch-list">{data.batches.map((batch) => <article key={batch.id}><div><strong>{batch.name}</strong><span>{label(batch.status)}</span></div><p>{batch.category || 'Uncategorized'} / {label(batch.inputMode)}</p><small>{batch.totalRows} rows / {batch.acceptedRows} accepted or queued / {batch.duplicateRows} duplicates / {batch.rejectedRows} rejected</small><Link href={`/workspace/imports/${batch.id}`}>Review batch</Link></article>)}{data.batches.length === 0 ? <p>No prepared batches yet.</p> : null}</div></section></main></WorkspaceShell>
}
