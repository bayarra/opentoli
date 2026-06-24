'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type SourceVerificationButtonProps = {
  sourceId: number
}

export function SourceVerificationButton({ sourceId }: SourceVerificationButtonProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const verify = async () => {
    setError('')
    setSubmitting(true)

    const response = await fetch(`/api/editor/sources/${sourceId}`, {
      body: JSON.stringify({ action: 'verify' }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    const result = await response.json().catch(() => null)

    if (!response.ok) {
      setError(result?.message || 'Source could not be verified.')
      setSubmitting(false)
      return
    }

    router.refresh()
  }

  return (
    <div className="source-verification-form">
      <button disabled={submitting} onClick={() => void verify()} type="button">
        {submitting ? 'Verifying...' : 'Verify source'}
      </button>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
