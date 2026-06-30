'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function ImportItemActions({ itemId, status }: { itemId: number; status: string }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const review = async (nextStatus: 'accepted' | 'rejected') => {
    setSubmitting(nextStatus)
    setError('')
    const response = await fetch(`/api/editor/import-items/${itemId}`, { body: JSON.stringify({ status: nextStatus }), credentials: 'include', headers: { 'Content-Type': 'application/json' }, method: 'PATCH' })
    const result = await response.json().catch(() => null)
    if (!response.ok) setError(result?.message || 'Import row could not be updated.')
    else router.refresh()
    setSubmitting(null)
  }
  if (['duplicate', 'queued'].includes(status)) return null
  return <div className="import-item-actions"><button disabled={Boolean(submitting)} onClick={() => void review('accepted')} type="button">{submitting === 'accepted' ? 'Accepting...' : 'Accept'}</button><button disabled={Boolean(submitting)} onClick={() => void review('rejected')} type="button">{submitting === 'rejected' ? 'Rejecting...' : 'Reject'}</button>{error ? <span className="form-error" role="alert">{error}</span> : null}</div>
}

export function ImportBatchActions({ batchId, canQueue, pendingCount }: { batchId: number; canQueue: boolean; pendingCount: number }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const run = async (action: 'accept-all' | 'queue') => {
    setSubmitting(action)
    setError('')
    const response = await fetch(`/api/editor/imports/${batchId}`, { body: JSON.stringify({ action }), credentials: 'include', headers: { 'Content-Type': 'application/json' }, method: 'POST' })
    const result = await response.json().catch(() => null)
    if (!response.ok) setError(result?.message || 'Import batch action failed.')
    else router.refresh()
    setSubmitting(null)
  }
  return <div className="import-batch-actions"><button disabled={Boolean(submitting) || pendingCount === 0} onClick={() => void run('accept-all')} type="button">{submitting === 'accept-all' ? 'Accepting...' : `Accept all valid (${pendingCount})`}</button><button disabled={Boolean(submitting) || !canQueue} onClick={() => void run('queue')} type="button">{submitting === 'queue' ? 'Queueing...' : 'Queue accepted terms'}</button><p>Queueing creates Generation Jobs only. It does not call the AI provider; the worker remains controlled from the CLI.</p>{error ? <p className="form-error" role="alert">{error}</p> : null}</div>
}
