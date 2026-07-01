'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type FeedbackModerationFormProps = {
  commentId: number
}

type Action = 'hidden'

const actionLabels: Record<Action, string> = {
  hidden: 'Hide',
}

export function FeedbackModerationForm({ commentId }: FeedbackModerationFormProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [moderatorNote, setModeratorNote] = useState('')
  const [submitting, setSubmitting] = useState<Action | null>(null)

  const moderate = async (status: Action) => {
    setError('')
    setSubmitting(status)

    const response = await fetch(`/api/editor/feedback/${commentId}`, {
      body: JSON.stringify({ moderatorNote, status }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    const result = await response.json().catch(() => null)

    if (!response.ok) {
      setError(result?.message || 'Feedback could not be moderated.')
      setSubmitting(null)
      return
    }

    router.refresh()
  }

  return (
    <div className="feedback-moderation-form">
      <label>
        Moderator note <span>(optional)</span>
        <textarea
          maxLength={500}
          onChange={(event) => setModeratorNote(event.target.value)}
          rows={2}
          value={moderatorNote}
        />
      </label>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div>
        {(['hidden'] as Action[]).map((status) => (
          <button disabled={Boolean(submitting)} key={status} onClick={() => void moderate(status)} type="button">
            {submitting === status ? `${actionLabels[status]}...` : actionLabels[status]}
          </button>
        ))}
      </div>
    </div>
  )
}
