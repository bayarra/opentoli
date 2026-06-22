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
            <div className="account-actions">
              {isEditorUser(user) ? <Link href="/review/ai-drafts">Open Draft Inbox</Link> : null}
              <Link href="/search">Find a term</Link>
              <Link href="/#categories">Browse categories</Link>
            </div>
          </>
        ) : (
          <>
            <p>
              Anyone can read OpenToli. Sign in or create an account to comment and suggest
              translations.
            </p>
            <div className="account-actions">
              <Link href="/login?next=%2Fcontribute">Sign in</Link>
              <Link href="/register?next=%2Fcontribute">Create account</Link>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
