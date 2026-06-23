'use client'

import { useState } from 'react'

type LogoutButtonProps = {
  className?: string
  redirectTo?: string
}

const readError = async (response: Response): Promise<string> => {
  const payload = await response.json().catch(() => null)
  return payload?.message || `Logout failed with status ${response.status}.`
}

export function LogoutButton({ className, redirectTo = '/' }: LogoutButtonProps) {
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleLogout = async () => {
    setError('')
    setSubmitting(true)

    try {
      const response = await fetch('/api/users/logout', {
        credentials: 'include',
        method: 'POST',
      })

      if (!response.ok) throw new Error(await readError(response))

      window.location.assign(redirectTo)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Logout failed.')
      setSubmitting(false)
    }
  }

  return (
    <span className="logout-control">
      <button className={className} disabled={submitting} onClick={handleLogout} type="button">
        {submitting ? 'Signing out...' : 'Log out'}
      </button>
      {error ? (
        <span className="nav-error" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  )
}
