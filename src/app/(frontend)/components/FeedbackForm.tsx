'use client'

import Link from 'next/link'
import { type FormEvent, useEffect, useState } from 'react'

type FeedbackFormProps = {
  draftId: number
}

type CurrentUser = { email: string; name: string } | null

export function FeedbackForm({ draftId }: FeedbackFormProps) {
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/users/me', { credentials: 'include', signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return null
        const data = await response.json()
        return data.user || null
      })
      .then((user) => setCurrentUser(user))
      .catch(() => setCurrentUser(null))
      .finally(() => setLoadingUser(false))
    return () => controller.abort()
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSubmitted(false)
    setSubmitting(true)

    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const commentType = String(form.get('commentType') || 'general')
    const response = await fetch('/api/comments', {
      body: JSON.stringify({
        aiDraft: draftId,
        body: String(form.get('body') || '').trim(),
        commentType,
        suggestedTranslationMn:
          commentType === 'translation_suggestion'
            ? String(form.get('suggestedTranslationMn') || '').trim()
            : undefined,
      }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })

    if (response.ok) {
      formElement.reset()
      setSubmitted(true)
    } else {
      const data = await response.json().catch(() => null)
      setError(data?.errors?.[0]?.message || data?.message || 'Could not submit feedback.')
    }
    setSubmitting(false)
  }

  if (loadingUser) return <p className="feedback-auth-note">Checking your account...</p>

  if (!currentUser) {
    const nextPath = `/drafts/${draftId}`
    return (
      <div className="feedback-auth-note">
        <strong>Sign in to contribute</strong>
        <p>Anyone can read this draft. An account is required to comment or suggest wording.</p>
        <div>
          <Link href={`/login?next=${encodeURIComponent(nextPath)}`}>Sign in</Link>
          <Link href={`/register?next=${encodeURIComponent(nextPath)}`}>Register</Link>
        </div>
      </div>
    )
  }

  return (
    <form className="feedback-form" onSubmit={handleSubmit}>
      <p>
        Contributing as <strong>{currentUser.name || currentUser.email}</strong>
      </p>
      <label>
        Feedback type
        <select defaultValue="general" name="commentType">
          <option value="general">General comment</option>
          <option value="translation_suggestion">Translation suggestion</option>
          <option value="usage_question">Usage question</option>
          <option value="reference_note">Reference note</option>
        </select>
      </label>
      <label>
        Suggested Mongolian wording <span>(required for translation suggestions)</span>
        <input maxLength={300} name="suggestedTranslationMn" />
      </label>
      <label>
        Comment
        <textarea maxLength={2000} minLength={3} name="body" required rows={6} />
      </label>
      {submitted ? (
        <p className="form-success" role="status">
          Thanks. Your feedback is pending moderation.
        </p>
      ) : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button disabled={submitting} type="submit">
        {submitting ? 'Submitting...' : 'Submit for moderation'}
      </button>
    </form>
  )
}
