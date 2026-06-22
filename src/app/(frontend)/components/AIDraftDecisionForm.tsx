'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'

type DecisionFormProps = {
  draftId: number
  initial: {
    explanationEn: string
    explanationMn: string
    headwordEn: string
    selectedTranslationMn: string
  }
}

export function AIDraftDecisionForm({ draftId, initial }: DecisionFormProps) {
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    const form = new FormData(event.currentTarget)
    const action = String(form.get('action') || '')

    const response = await fetch(`/api/reviewer/ai-drafts/${draftId}/decision`, {
      body: JSON.stringify({
        action,
        explanationEn: String(form.get('explanationEn') || ''),
        explanationMn: String(form.get('explanationMn') || ''),
        headwordEn: String(form.get('headwordEn') || ''),
        mergeTargetTermId: String(form.get('mergeTargetTermId') || ''),
        newReviewRoute: String(form.get('newReviewRoute') || ''),
        notes: String(form.get('notes') || ''),
        rejectionReasons: String(form.get('rejectionReasons') || ''),
        selectedTranslationMn: String(form.get('selectedTranslationMn') || ''),
      }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    const result = await response.json().catch(() => null)
    if (!response.ok) {
      setError(result?.message || 'The review decision could not be completed.')
      setSubmitting(false)
      return
    }

    setSuccess(
      result.termId
        ? `Decision recorded. Canonical draft Term ${result.termId} is ready for final approval.`
        : 'Decision recorded.',
    )
    setSubmitting(false)
    window.setTimeout(() => window.location.reload(), 900)
  }

  return (
    <form className="review-decision-form" onSubmit={submit}>
      <label>
        Action
        <select defaultValue="accept" name="action" required>
          <option value="accept">Accept generated fields</option>
          <option value="modify">Accept with edits</option>
          <option value="reject">Reject draft</option>
          <option value="reroute">Change review route</option>
          <option value="merge">Merge as duplicate</option>
        </select>
      </label>
      <div className="review-form-grid">
        <label>
          English headword
          <input defaultValue={initial.headwordEn} name="headwordEn" required />
        </label>
        <label>
          Selected Mongolian translation
          <input
            defaultValue={initial.selectedTranslationMn}
            name="selectedTranslationMn"
            required
          />
        </label>
      </div>
      <label>
        English explanation
        <textarea defaultValue={initial.explanationEn} name="explanationEn" required rows={4} />
      </label>
      <label>
        Mongolian explanation
        <textarea defaultValue={initial.explanationMn} name="explanationMn" required rows={4} />
      </label>
      <div className="review-form-grid">
        <label>
          New route, for reroute
          <select defaultValue="" name="newReviewRoute">
            <option value="">Choose route</option>
            <option value="fast_review">Fast review</option>
            <option value="language_review">Language review</option>
            <option value="domain_review">Domain review</option>
            <option value="community_discussion">Community discussion</option>
            <option value="duplicate_review">Duplicate review</option>
            <option value="blocked">Blocked</option>
          </select>
        </label>
        <label>
          Merge target Term ID
          <input min="1" name="mergeTargetTermId" type="number" />
        </label>
      </div>
      <label>
        Rejection reasons, one per line
        <textarea name="rejectionReasons" rows={3} />
      </label>
      <label>
        Reviewer notes
        <textarea minLength={2} name="notes" required rows={4} />
      </label>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="form-success" role="status">
          {success}
        </p>
      ) : null}
      <button disabled={submitting} type="submit">
        {submitting ? 'Recording decision...' : 'Record review decision'}
      </button>
    </form>
  )
}
