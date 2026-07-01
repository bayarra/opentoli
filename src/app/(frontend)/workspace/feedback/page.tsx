import { FeedbackModerationForm } from '@/app/(frontend)/components/FeedbackModerationForm'
import { WorkspaceShell } from '@/app/(frontend)/components/WorkspaceShell'
import { getCommunityActivity } from '@/editor/feedback'
import { getCurrentUser } from '@/lib/currentUser'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Community Activity | OpenToli',
}

export const dynamic = 'force-dynamic'

const label = (value: string) => value.replaceAll('_', ' ')

export default async function FeedbackModerationPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=%2Fworkspace%2Ffeedback')

  const feedback = await getCommunityActivity(user)

  if (!feedback) {
    return (
      <main className="content-page">
        <div className="empty-state">
          <h1>Editor access required</h1>
          <p>Community activity is available only to Editors.</p>
          <div className="empty-actions">
            <Link href="/workspace">Workspace</Link>
            <Link href="/drafts">Community review</Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <WorkspaceShell>
      <main className="content-page moderation-page">
      <Link className="back-link" href="/workspace">
        Back to Workspace
      </Link>
      <div className="page-heading">
        <p className="eyebrow">Community activity</p>
        <h1>Watch public contributions and hide abuse.</h1>
        <p>
          Every signed-in contribution appears immediately as community input. Editors do not
          approve submissions; they can only hide unsafe or abusive content. Contributions never
          edit canonical terminology directly.
        </p>
      </div>

      {feedback.length === 0 ? (
        <div className="empty-state">
          <h2>No community activity.</h2>
          <p>Comments and terminology suggestions will appear here after members post them.</p>
        </div>
      ) : (
        <div className="moderation-list">
          {feedback.map((item) => (
            <article className="moderation-card" key={item.id}>
              <div>
                <p className="eyebrow">{label(item.commentType)}</p>
                <h2>{item.target.label}</h2>
                <p>
                  Public contribution / {item.target.type} / submitted by {item.author} /{' '}
                  {item.createdAt.slice(0, 10)}
                </p>
                {item.target.href ? <Link href={item.target.href}>Open target</Link> : null}
              </div>

              {item.suggestedTranslationMn ? (
                <blockquote lang="mn">
                  <p>{item.suggestedTranslationMn}</p>
                </blockquote>
              ) : null}
              {item.suggestedExampleEn && item.suggestedExampleMn ? <blockquote><p>{item.suggestedExampleEn}</p><p lang="mn">{item.suggestedExampleMn}</p></blockquote> : null}
              {item.suggestedReferenceTitle && item.suggestedReferenceUrl ? <p className="proposal-reference"><a href={item.suggestedReferenceUrl} rel="noreferrer" target="_blank">{item.suggestedReferenceTitle}</a></p> : null}
              <p>{item.body}</p>

              <FeedbackModerationForm commentId={item.id} />
            </article>
          ))}
        </div>
      )}
      </main>
    </WorkspaceShell>
  )
}
