import { LogoutButton } from '@/app/(frontend)/components/LogoutButton'
import { isEditorUser } from '@/editor/permissions'
import { getCurrentUser } from '@/lib/currentUser'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Profile | OpenToli',
}

const roleLabel = (role?: string | null) =>
  role
    ? role
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    : 'Member'

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=%2Fprofile')

  const displayName = user.name || user.email
  const joined = user.createdAt ? new Date(user.createdAt).toISOString().slice(0, 10) : 'Unknown'

  return (
    <main className="content-page profile-page">
      <Link className="back-link" href="/">
        Back to OpenToli
      </Link>
      <div className="profile-grid">
        <section className="account-card profile-summary" aria-labelledby="profile-heading">
          <p className="eyebrow">Account</p>
          <h1 id="profile-heading">{displayName}</h1>
          <p>
            Use this web account for comments, translation suggestions, and public draft review.
            Normal OpenToli terminology work happens here, not in Payload admin.
          </p>
          <dl className="profile-details">
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{roleLabel(user.role)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{user.isActive === false ? 'Inactive' : 'Active'}</dd>
            </div>
            <div>
              <dt>Joined</dt>
              <dd>{joined}</dd>
            </div>
          </dl>
          <div className="account-actions">
            <Link href="/drafts">Public drafts</Link>
            {isEditorUser(user) ? <Link href="/review/ai-drafts">Draft Inbox</Link> : null}
          </div>
        </section>

        <aside className="account-card profile-next" aria-labelledby="profile-next-heading">
          <p className="eyebrow">Next step</p>
          <h2 id="profile-next-heading">What can I do?</h2>
          {isEditorUser(user) ? (
            <p>
              Open the Draft Inbox, edit the public fields, then Publish or Hide from the web
              editor. Admin remains for maintenance and data repair only.
            </p>
          ) : (
            <p>
              Open a public draft to comment or suggest a better Mongolian translation. Your
              suggestion enters moderation and never changes canonical content directly.
            </p>
          )}
          <LogoutButton className="secondary-button" />
        </aside>
      </div>
    </main>
  )
}
