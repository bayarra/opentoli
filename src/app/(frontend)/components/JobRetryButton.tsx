'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type JobRetryButtonProps = {
  canRetry: boolean
  disabledReason: string
  jobId: number
}

export function JobRetryButton({ canRetry, disabledReason, jobId }: JobRetryButtonProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const retry = async () => {
    setError('')
    setSubmitting(true)

    const response = await fetch(`/api/editor/jobs/${jobId}`, {
      body: JSON.stringify({ action: 'retry-now' }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    const result = await response.json().catch(() => null)

    if (!response.ok) {
      setError(result?.message || 'Job could not be queued for retry.')
      setSubmitting(false)
      return
    }

    router.refresh()
  }

  return (
    <div className="job-retry-form">
      <button disabled={!canRetry || submitting} onClick={() => void retry()} type="button">
        {submitting ? 'Queueing retry...' : 'Retry now'}
      </button>
      <p>{canRetry ? 'This does not run the worker or call the AI provider.' : disabledReason}</p>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
