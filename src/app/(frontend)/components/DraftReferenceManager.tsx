'use client'

import { useRouter } from 'next/navigation'
import type { FormEvent } from 'react'
import { useState } from 'react'

type DraftReference = {
  id: number
  safeUrl: string | null
  title: string
  url: string
}

type DraftReferenceManagerProps = {
  draftId: number
  references: DraftReference[]
}

const fieldsFrom = (form: HTMLFormElement) => {
  const data = new FormData(form)
  return {
    title: String(data.get('title') || ''),
    url: String(data.get('url') || ''),
  }
}

export function DraftReferenceManager({ draftId, references }: DraftReferenceManagerProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState<string | null>(null)

  const request = async ({
    body,
    method,
    referenceId,
  }: {
    body?: unknown
    method: 'DELETE' | 'PATCH' | 'POST'
    referenceId?: number
  }) => {
    setError('')
    setSubmitting(referenceId ? `${method}-${referenceId}` : method)

    const response = await fetch(
      referenceId
        ? `/api/editor/ai-drafts/${draftId}/references/${referenceId}`
        : `/api/editor/ai-drafts/${draftId}/references`,
      {
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        method,
      },
    )
    const result = await response.json().catch(() => null)

    if (!response.ok) {
      setError(result?.message || 'Reference could not be updated.')
      setSubmitting(null)
      return false
    }

    router.refresh()
    setSubmitting(null)
    return true
  }

  const addReference = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    if (await request({ body: fieldsFrom(form), method: 'POST' })) form.reset()
  }

  const updateReference = async (event: FormEvent<HTMLFormElement>, referenceId: number) => {
    event.preventDefault()
    await request({ body: fieldsFrom(event.currentTarget), method: 'PATCH', referenceId })
  }

  const removeReference = async (referenceId: number) => {
    await request({ method: 'DELETE', referenceId })
  }

  return (
    <div className="draft-reference-manager">
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <form className="draft-reference-form" onSubmit={addReference}>
        <h3>Add reference</h3>
        <label>
          Title
          <input name="title" required />
        </label>
        <label>
          URL
          <input name="url" required type="url" />
        </label>
        <button disabled={submitting === 'POST'} type="submit">
          {submitting === 'POST' ? 'Adding...' : 'Add reference'}
        </button>
      </form>

      {references.map((reference) => (
        <article className="review-reference" key={reference.id}>
          {reference.safeUrl ? (
            <a href={reference.safeUrl} rel="noreferrer" target="_blank">
              {reference.title}
            </a>
          ) : (
            <strong>{reference.title}</strong>
          )}
          <details className="draft-reference-edit">
            <summary>Edit reference</summary>
            <form onSubmit={(event) => updateReference(event, reference.id)}>
              <label>
                Title
                <input defaultValue={reference.title} name="title" required />
              </label>
              <label>
                URL
                <input defaultValue={reference.url} name="url" required type="url" />
              </label>
              <div>
                <button disabled={submitting === `PATCH-${reference.id}`} type="submit">
                  {submitting === `PATCH-${reference.id}` ? 'Saving...' : 'Save reference'}
                </button>
                <button
                  disabled={submitting === `DELETE-${reference.id}`}
                  onClick={() => void removeReference(reference.id)}
                  type="button"
                >
                  {submitting === `DELETE-${reference.id}` ? 'Removing...' : 'Remove reference'}
                </button>
              </div>
            </form>
          </details>
        </article>
      ))}
      {references.length === 0 ? <p>No references attached.</p> : null}
    </div>
  )
}
