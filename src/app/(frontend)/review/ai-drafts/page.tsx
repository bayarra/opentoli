import { getCurrentUser } from '@/lib/currentUser'
import { getReviewerQueue } from '@/review/reviewerData'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'AI Draft Review | OpenToli',
}

export default async function AIDraftReviewQueuePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=%2Freview%2Fai-drafts')
  const drafts = await getReviewerQueue(user)

  if (!drafts) {
    return (
      <main className="content-page">
        <h1>Reviewer access required</h1>
      </main>
    )
  }

  return (
    <main className="content-page reviewer-page">
      <Link className="back-link" href="/admin">
        Back to Admin
      </Link>
      <header className="reviewer-heading">
        <div>
          <p className="eyebrow">M4 reviewer workspace</p>
          <h1>AI draft review queue</h1>
        </div>
        <p>{drafts.length} unresolved drafts</p>
      </header>
      <div className="review-queue">
        {drafts.map((draft) => (
          <Link href={`/review/ai-drafts/${draft.id}`} key={draft.id}>
            <div>
              <strong>{draft.headwordEn}</strong>
              <span>{draft.category || 'Uncategorized'}</span>
            </div>
            <div className="review-queue-badges">
              <span className={`risk-badge risk-${draft.riskLevel}`}>{draft.riskLevel} risk</span>
              <span>{draft.reviewRoute.replaceAll('_', ' ')}</span>
              <span>{draft.updatedAt.slice(0, 10)}</span>
            </div>
          </Link>
        ))}
        {drafts.length === 0 ? <p>No unresolved AI drafts.</p> : null}
      </div>
    </main>
  )
}
