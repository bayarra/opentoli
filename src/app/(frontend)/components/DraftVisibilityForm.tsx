'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type DraftVisibilityFormProps = {
  canOpen: boolean
  disabledReason: string
  draftId: number
  isPublic: boolean
}

export function DraftVisibilityForm({
  canOpen,
  disabledReason,
  draftId,
  isPublic,
}: DraftVisibilityFormProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const updateVisibility = async () => {
    setError('')
    setSubmitting(true)

    const response = await fetch(`/api/editor/ai-drafts/${draftId}`, {
      body: JSON.stringify({
        action: isPublic ? 'close-public-feedback' : 'open-public-feedback',
      }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    const result = await response.json().catch(() => null)

    if (!response.ok) {
      setError(result?.message || 'Public feedback visibility could not be updated.')
      setSubmitting(false)
      return
    }

    router.refresh()
  }

  const disabled = submitting || (!isPublic && !canOpen)

  return (
    <div className="draft-visibility-form">
      <button disabled={disabled} onClick={() => void updateVisibility()} type="button">
        {submitting
          ? 'Updating...'
          : isPublic
            ? 'Close public feedback'
            : 'Open public feedback'}
      </button>
      <p>
        {isPublic
          ? 'Anyone can view this unverified draft. Signed-in users can comment or suggest translations.'
          : canOpen
            ? 'Opening feedback keeps the draft unverified and redacted.'
            : disabledReason}
      </p>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
