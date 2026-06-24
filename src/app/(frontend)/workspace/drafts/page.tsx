import { WorkspaceShell } from '@/app/(frontend)/components/WorkspaceShell'
import { getDraftInbox } from '@/editor/data'
import { getCurrentUser } from '@/lib/currentUser'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Draft Inbox | OpenToli',
}

export const dynamic = 'force-dynamic'

export default async function DraftInboxPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=%2Fworkspace%2Fdrafts')
  const drafts = await getDraftInbox(user)

  if (!drafts) {
    return (
      <main className="content-page">
        <div className="empty-state">
          <h1>Editor access required</h1>
          <p>The Draft Inbox is available only to Editors.</p>
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
      <main className="content-page reviewer-page">
      <header className="reviewer-heading">
        <div>
          <p className="eyebrow">Simple editor workflow</p>
          <h1>Draft Inbox</h1>
          <p>
            Work here, not in Payload admin, for normal terminology decisions. Open a draft, edit
            the four public fields, verify sources, then Publish or Hide.
          </p>
        </div>
        <p>{drafts.length} active drafts</p>
      </header>
      <div className="review-queue">
        {drafts.map((draft) => (
          <Link href={`/workspace/drafts/${draft.id}`} key={draft.id}>
            <div>
              <strong>{draft.headwordEn}</strong>
              <span>{draft.category || 'Uncategorized'}</span>
            </div>
            <div className="review-queue-badges">
              <span>{draft.isPublic ? 'Public draft' : 'Private draft'}</span>
              <span>{draft.updatedAt.slice(0, 10)}</span>
            </div>
          </Link>
        ))}
        {drafts.length === 0 ? <p>No active AI drafts.</p> : null}
      </div>
      </main>
    </WorkspaceShell>
  )
}
