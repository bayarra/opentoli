import { FeedbackModerationForm } from '@/app/(frontend)/components/FeedbackModerationForm'
import { getPendingFeedback } from '@/editor/feedback'
import { getCurrentUser } from '@/lib/currentUser'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Feedback Moderation | OpenToli',
}

export const dynamic = 'force-dynamic'

const label = (value: string) => value.replaceAll('_', ' ')

export default async function FeedbackModerationPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=%2Fworkspace%2Ffeedback')

  const feedback = await getPendingFeedback(user)

  if (!feedback) {
    return (
      <main className="content-page">
        <div className="empty-state">
          <h1>Editor access required</h1>
          <p>Feedback moderation is available only to Editors.</p>
          <div className="empty-actions">
            <Link href="/workspace">Workspace</Link>
            <Link href="/drafts">Public drafts</Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="content-page moderation-page">
      <Link className="back-link" href="/workspace">
        Back to Workspace
      </Link>
      <div className="page-heading">
        <p className="eyebrow">Feedback moderation</p>
        <h1>Review comments and translation suggestions in OpenToli web.</h1>
        <p>
          Approving feedback can make it visible as public evidence. Rejecting or hiding keeps it
          out of public pages. None of these actions directly edits a term, translation, or AI
          draft.
        </p>
      </div>

      {feedback.length === 0 ? (
        <div className="empty-state">
          <h2>No pending feedback.</h2>
          <p>New comments and translation suggestions will appear here before they become public.</p>
        </div>
      ) : (
        <div className="moderation-list">
          {feedback.map((item) => (
            <article className="moderation-card" key={item.id}>
              <div>
                <p className="eyebrow">{label(item.commentType)}</p>
                <h2>{item.target.label}</h2>
                <p>
                  {item.target.type} / submitted by {item.author} / {item.createdAt.slice(0, 10)}
                </p>
                {item.target.href ? <Link href={item.target.href}>Open target</Link> : null}
              </div>

              {item.suggestedTranslationMn ? (
                <blockquote lang="mn">
                  <p>{item.suggestedTranslationMn}</p>
                </blockquote>
              ) : null}
              <p>{item.body}</p>

              <FeedbackModerationForm commentId={item.id} />
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
