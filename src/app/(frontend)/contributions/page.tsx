import { getUserContributions } from '@/lib/contributions'
import { getCurrentUser } from '@/lib/currentUser'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'My Contributions | OpenToli',
}

export const dynamic = 'force-dynamic'

const label = (value: string) => value.replaceAll('_', ' ')

export default async function ContributionsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=%2Fcontributions')

  const contributions = await getUserContributions(user)

  return (
    <main className="content-page contributions-page">
      <Link className="back-link" href="/profile">
        Back to Profile
      </Link>
      <div className="page-heading">
        <p className="eyebrow">My contributions</p>
        <h1>Track your comments and translation suggestions.</h1>
        <p>
          Contributions are moderated proposals. They never directly change canonical terms,
          translations, examples, or AI drafts.
        </p>
      </div>

      {contributions.length === 0 ? (
        <div className="empty-state">
          <h2>No contributions yet.</h2>
          <p>Open a public draft to comment or suggest a Mongolian translation.</p>
          <div className="empty-actions">
            <Link href="/drafts">View public drafts</Link>
            <Link href="/workflow">Read workflow</Link>
          </div>
        </div>
      ) : (
        <div className="contribution-list">
          {contributions.map((contribution) => (
            <article className="contribution-card" key={contribution.id}>
              <div>
                <p className="eyebrow">{label(contribution.commentType)}</p>
                <h2>{contribution.target.label}</h2>
                <p>
                  {contribution.target.type} / {label(contribution.status)} / submitted{' '}
                  {contribution.createdAt.slice(0, 10)}
                </p>
                {contribution.target.href ? (
                  <Link href={contribution.target.href}>Open target</Link>
                ) : null}
              </div>

              {contribution.suggestedTranslationMn ? (
                <blockquote lang="mn">
                  <p>{contribution.suggestedTranslationMn}</p>
                </blockquote>
              ) : null}
              <p>{contribution.body}</p>

              {contribution.moderatorNote ? (
                <div className="contribution-note">
                  <strong>Moderator note</strong>
                  <p>{contribution.moderatorNote}</p>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
