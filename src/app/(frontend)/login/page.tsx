import { AuthForm } from '@/app/(frontend)/components/AuthForm'
import { getCurrentUser } from '@/lib/currentUser'
import Link from 'next/link'
import { redirect } from 'next/navigation'

type LoginPageProps = { searchParams: Promise<{ next?: string }> }

const safeNextPath = (value?: string) =>
  value?.startsWith('/') && !value.startsWith('//') ? value : '/'

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams
  if (await getCurrentUser())
    redirect(safeNextPath(next) === '/' ? '/profile' : safeNextPath(next))

  return (
    <main className="account-page">
      <Link className="back-link" href="/">
        Back to OpenToli
      </Link>
      <div className="account-card">
        <p className="eyebrow">Contributor account</p>
        <h1>Sign in</h1>
        <p>Sign in to comment on public drafts and suggest Mongolian translations.</p>
        <AuthForm mode="login" nextPath={safeNextPath(next)} />
      </div>
    </main>
  )
}
