import { getCurrentUser } from '@/lib/currentUser'
import Link from 'next/link'

export default async function ContributePage() {
  const user = await getCurrentUser()

  return (
    <main className="account-page">
      <Link className="back-link" href="/">
        Back to OpenToli
      </Link>
      <div className="account-card">
        <p className="eyebrow">Community contribution</p>
        <h1>Contribute to OpenToli</h1>
        {user ? (
          <>
            <p>
              Signed in as <strong>{user.name || user.email}</strong>.
            </p>
            <p>
              Open an unverified public AI draft to comment on its meaning, question a reference, or
              suggest more natural Mongolian wording. Every submission enters moderation before it
              becomes public.
            </p>
            <p>
              You do not need Payload admin for normal contribution work. Use OpenToli web pages so
              suggestions stay attributed, moderated, and separate from canonical terms.
            </p>
            <p className="muted-copy">
              Use the main menu for Public drafts, Search, Workflow, Contributions, Profile, and
              the Editor Draft Inbox when your role has access.
            </p>
          </>
        ) : (
          <>
            <p>
              Anyone can read OpenToli. Sign in or create an account to comment and suggest
              translations.
            </p>
            <p>
              Contributors work from public draft pages. Editors review drafts from the web Draft
              Inbox. The admin panel is not the normal place to suggest translations.
            </p>
            <p className="muted-copy">
              Use the main menu to log in, create an account, open Public drafts, or read the
              Workflow guide.
            </p>
          </>
        )}
      </div>
    </main>
  )
}
