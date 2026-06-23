import { getCurrentUser } from '@/lib/currentUser'
import { isEditorUser } from '@/editor/permissions'
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
              Open an unverified public AI draft to comment on its meaning, question a source, or
              suggest more natural Mongolian wording. Every submission enters moderation before it
              becomes public.
            </p>
            <p>
              You do not need Payload admin for normal contribution work. Use OpenToli web pages so
              suggestions stay attributed, moderated, and separate from canonical terms.
            </p>
            <div className="account-actions">
              {isEditorUser(user) ? <Link href="/review/ai-drafts">Open Draft Inbox</Link> : null}
              <Link href="/drafts">Review public drafts</Link>
              <Link href="/search">Find a term</Link>
              <Link href="/workflow">How workflow works</Link>
            </div>
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
            <div className="account-actions">
              <Link href="/login?next=%2Fcontribute">Sign in</Link>
              <Link href="/register?next=%2Fcontribute">Create account</Link>
              <Link href="/workflow">See workflow</Link>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
