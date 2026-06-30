import { WorkspaceShell } from '@/app/(frontend)/components/WorkspaceShell'
import { listPublishedTermsForEditor } from '@/editor/terms'
import { getCurrentUser } from '@/lib/currentUser'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { robots: { follow: false, index: false }, title: 'Published Terms | OpenToli' }
export const dynamic = 'force-dynamic'

export default async function PublishedTermsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=%2Fworkspace%2Fterms')
  const terms = await listPublishedTermsForEditor(user)
  if (!terms) return <main className="content-page"><div className="empty-state"><h1>Editor access required</h1><p>Published-term editing is available only to Editors.</p></div></main>

  return <WorkspaceShell><main className="content-page workspace-page"><div className="page-heading"><p className="eyebrow">Canonical dictionary</p><h1>Edit published terms in OpenToli web.</h1><p>Update approved wording, alternatives, examples, contexts, and optional references without opening Payload Admin.</p></div><div className="published-term-list editor-term-list">{terms.map((term) => <Link href={`/workspace/terms/${term.id}`} key={term.id}><strong>{term.headwordEn}</strong><span lang="mn">{term.recommendedTranslationMn || 'Translation missing'}</span><small>{term.reviewStatus.replaceAll('_',' ')} / updated {term.updatedAt.slice(0,10)}</small></Link>)}{terms.length === 0 ? <p>No published terms yet.</p> : null}</div></main></WorkspaceShell>
}
