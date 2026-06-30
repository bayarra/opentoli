import { PublishedTermEditorForm } from '@/app/(frontend)/components/PublishedTermEditorForm'
import { WorkspaceShell } from '@/app/(frontend)/components/WorkspaceShell'
import { getPublishedTermEditor } from '@/editor/terms'
import { getCurrentUser } from '@/lib/currentUser'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

export const metadata: Metadata = { robots: { follow: false, index: false }, title: 'Edit Published Term | OpenToli' }
export const dynamic = 'force-dynamic'
type PageProps = { params: Promise<{ id: string }> }

export default async function EditPublishedTermPage({ params }: PageProps) {
  const user = await getCurrentUser()
  const id = Number((await params).id)
  if (!user) redirect(`/login?next=${encodeURIComponent(`/workspace/terms/${id}`)}`)
  if (!Number.isInteger(id) || id < 1) notFound()
  const data = await getPublishedTermEditor(user, id).catch(() => null)
  if (!data) notFound()

  return <WorkspaceShell><main className="content-page workspace-page"><Link className="back-link" href="/workspace/terms">Back to published terms</Link><div className="page-heading"><p className="eyebrow">Published term</p><h1>Edit {data.fields.headwordEn}</h1><p>Saving updates the canonical public entry immediately and records the signed-in Editor as reviewer and approver.</p><div className="empty-actions"><Link href={`/terms/${data.term.slug}`}>View public term</Link></div></div><PublishedTermEditorForm categories={data.categories} contexts={data.contexts} initial={data.fields} termId={data.term.id} /></main></WorkspaceShell>
}
