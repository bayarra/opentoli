'use client'

import Link from 'next/link'
import { type FormEvent, useState } from 'react'

type AuthFormProps = {
  mode: 'login' | 'register'
  nextPath: string
}

const errorMessage = async (response: Response): Promise<string> => {
  const payload = await response.json().catch(() => null)
  return (
    payload?.errors?.[0]?.message ||
    payload?.message ||
    `The request failed with status ${response.status}.`
  )
}

export function AuthForm({ mode, nextPath }: AuthFormProps) {
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/users/login', {
      body: JSON.stringify({ email, password }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    if (!response.ok) throw new Error(await errorMessage(response))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '').trim()
    const password = String(form.get('password') || '')

    try {
      if (mode === 'register') {
        const response = await fetch('/api/register', {
          body: JSON.stringify({
            email,
            name: String(form.get('name') || '').trim(),
            password,
          }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })
        if (!response.ok) throw new Error(await errorMessage(response))
      }

      await login(email, password)
      window.location.assign(nextPath)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Authentication failed.')
      setSubmitting(false)
    }
  }

  const alternateHref = `${mode === 'login' ? '/register' : '/login'}?next=${encodeURIComponent(nextPath)}`

  return (
    <form className="account-form" onSubmit={handleSubmit}>
      {mode === 'register' ? (
        <label>
          Display name
          <input autoComplete="name" minLength={2} name="name" required />
        </label>
      ) : null}
      <label>
        Email
        <input autoComplete="email" name="email" required type="email" />
      </label>
      <label>
        Password
        <input
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          minLength={8}
          name="password"
          required
          type="password"
        />
      </label>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button disabled={submitting} type="submit">
        {submitting ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
      </button>
      <p>
        {mode === 'login' ? 'Need an account?' : 'Already registered?'}{' '}
        <Link href={alternateHref}>{mode === 'login' ? 'Register' : 'Sign in'}</Link>
      </p>
    </form>
  )
}
