'use client'

import Link from 'next/link'
import { type FormEvent, useEffect, useState } from 'react'

type FeedbackFormProps = {
  draftId?: number
  termId?: number
  targetPath?: string
}

type CurrentUser = { email: string; name: string } | null

export function FeedbackForm({ draftId, targetPath, termId }: FeedbackFormProps) {
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [commentType, setCommentType] = useState('general')

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
        suggestedExampleEn:
          commentType === 'example_suggestion'
            ? String(form.get('suggestedExampleEn') || '').trim()
            : undefined,
        suggestedExampleMn:
          commentType === 'example_suggestion'
            ? String(form.get('suggestedExampleMn') || '').trim()
            : undefined,
        suggestedReferenceTitle:
          commentType === 'reference_note'
            ? String(form.get('suggestedReferenceTitle') || '').trim()
            : undefined,
        suggestedReferenceUrl:
          commentType === 'reference_note'
            ? String(form.get('suggestedReferenceUrl') || '').trim()
            : undefined,
        suggestedTranslationMn:
          commentType === 'translation_suggestion'
            ? String(form.get('suggestedTranslationMn') || '').trim()
            : undefined,
        term: termId,
      }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })

    if (response.ok) {
      formElement.reset()
      setCommentType('general')
      setSubmitted(true)
    } else {
      const data = await response.json().catch(() => null)
      setError(data?.errors?.[0]?.message || data?.message || 'Could not submit feedback.')
    }
    setSubmitting(false)
  }

  if (loadingUser) return <p className="feedback-auth-note">Checking your account...</p>

  if (!currentUser) {
    const nextPath = targetPath || (draftId ? `/drafts/${draftId}` : termId ? `/terms/${termId}` : '/')
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
        <select name="commentType" onChange={(event) => setCommentType(event.target.value)} value={commentType}>
          <option value="general">General comment</option>
          <option value="translation_suggestion">Translation suggestion</option>
          <option value="example_suggestion">Example suggestion</option>
          <option value="usage_question">Usage question</option>
          <option value="reference_note">Reference suggestion</option>
        </select>
      </label>
      {commentType === 'translation_suggestion' ? <label>Suggested Mongolian wording<input maxLength={300} name="suggestedTranslationMn" required /></label> : null}
      {commentType === 'example_suggestion' ? <div className="feedback-proposal-fields"><label>English example<textarea maxLength={2000} name="suggestedExampleEn" required rows={3} /></label><label>Mongolian example<textarea lang="mn" maxLength={2000} name="suggestedExampleMn" required rows={3} /></label></div> : null}
      {commentType === 'reference_note' ? <div className="feedback-proposal-fields"><label>Reference title<input maxLength={500} name="suggestedReferenceTitle" required /></label><label>Reference URL<input maxLength={2000} name="suggestedReferenceUrl" required type="url" /></label></div> : null}
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
