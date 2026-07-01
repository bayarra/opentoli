import { AuthForm } from '@/app/(frontend)/components/AuthForm'
import { getCurrentUser } from '@/lib/currentUser'
import Link from 'next/link'
import { redirect } from 'next/navigation'

type RegisterPageProps = { searchParams: Promise<{ next?: string }> }

const safeNextPath = (value?: string) =>
  value?.startsWith('/') && !value.startsWith('//') ? value : '/'

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { next } = await searchParams
  if (await getCurrentUser())
    redirect(safeNextPath(next) === '/' ? '/profile' : safeNextPath(next))

  return (
    <main className="account-page">
      <Link className="back-link" href="/">
        Back to OpenToli
      </Link>
      <div className="account-card">
        <p className="eyebrow">Join the review</p>
        <h1>Create an account</h1>
        <p>Accounts keep public comments and terminology suggestions attributable.</p>
        <AuthForm mode="register" nextPath={safeNextPath(next)} />
      </div>
    </main>
  )
}
