'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type AccountUser = {
  email?: string
  name?: string
  role?: string
}

type MeResponse = {
  user?: AccountUser | null
}

const editorRoles = new Set(['reviewer', 'language_expert', 'moderator', 'admin'])

export function AccountNav() {
  const [user, setUser] = useState<AccountUser | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadUser = async () => {
      try {
        const response = await fetch('/api/users/me', {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        })
        if (!response.ok) return

        const payload = (await response.json()) as MeResponse
        if (isMounted) setUser(payload.user || null)
      } finally {
        if (isMounted) setChecked(true)
      }
    }

    void loadUser()

    return () => {
      isMounted = false
    }
  }, [])

  if (user) {
    const label = user.name || user.email || 'Profile'

    return (
      <div className="account-nav" aria-label={`Account: ${label}`}>
        {user.role && editorRoles.has(user.role) ? <Link href="/workspace">Workspace</Link> : null}
        <Link href="/contributions">Contributions</Link>
        <Link href="/profile">Profile</Link>
      </div>
    )
  }

  return (
    <div className="account-nav" aria-label="Account">
      <Link href="/login">Log in</Link>
      <Link className="nav-cta" href="/register">
        Create account
      </Link>
      {!checked ? <span className="nav-meta">Checking session...</span> : null}
    </div>
  )
}
