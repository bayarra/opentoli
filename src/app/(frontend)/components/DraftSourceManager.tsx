'use client'

import { useRouter } from 'next/navigation'
import type { FormEvent } from 'react'
import { useState } from 'react'

import { SourceVerificationButton } from './SourceVerificationButton'

type DraftSource = {
  id: number
  isVerified?: boolean | null
  publisher: string
  safeUrl: string | null
  sourceType: string
  title: string
  url: string
}

type DraftSourceManagerProps = {
  draftId: number
  sources: DraftSource[]
}

const sourceTypes = [
  'government',
  'standards_body',
  'official_documentation',
  'academic',
  'dictionary',
  'textbook',
  'professional_usage',
  'news',
  'community_discussion',
  'other',
] as const

const labelFor = (value: string) => value.replaceAll('_', ' ')

const fieldsFrom = (form: HTMLFormElement) => {
  const data = new FormData(form)
  return {
    publisher: String(data.get('publisher') || ''),
    sourceType: String(data.get('sourceType') || ''),
    title: String(data.get('title') || ''),
    url: String(data.get('url') || ''),
  }
}

export function DraftSourceManager({ draftId, sources }: DraftSourceManagerProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState<string | null>(null)

  const request = async ({
    body,
    method,
    sourceId,
  }: {
    body?: unknown
    method: 'DELETE' | 'PATCH' | 'POST'
    sourceId?: number
  }) => {
    setError('')
    setSubmitting(sourceId ? `${method}-${sourceId}` : method)

    const response = await fetch(
      sourceId
        ? `/api/editor/ai-drafts/${draftId}/sources/${sourceId}`
        : `/api/editor/ai-drafts/${draftId}/sources`,
      {
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        method,
      },
    )
    const result = await response.json().catch(() => null)

    if (!response.ok) {
      setError(result?.message || 'Source could not be updated.')
      setSubmitting(null)
      return false
    }

    router.refresh()
    return true
  }

  const addSource = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    if (await request({ body: fieldsFrom(form), method: 'POST' })) form.reset()
  }

  const updateSource = async (event: FormEvent<HTMLFormElement>, sourceId: number) => {
    event.preventDefault()
    await request({ body: fieldsFrom(event.currentTarget), method: 'PATCH', sourceId })
  }

  const removeSource = async (sourceId: number) => {
    await request({ method: 'DELETE', sourceId })
  }

  return (
    <div className="draft-source-manager">
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <form className="draft-source-form" onSubmit={addSource}>
        <h3>Add source</h3>
        <label>
          Title
          <input name="title" required />
        </label>
        <label>
          Publisher
          <input name="publisher" required />
        </label>
        <label>
          URL
          <input name="url" required type="url" />
        </label>
        <label>
          Source type
          <select defaultValue="official_documentation" name="sourceType">
            {sourceTypes.map((sourceType) => (
              <option key={sourceType} value={sourceType}>
                {labelFor(sourceType)}
              </option>
            ))}
          </select>
        </label>
        <button disabled={submitting === 'POST'} type="submit">
          {submitting === 'POST' ? 'Adding...' : 'Add source'}
        </button>
      </form>

      {sources.map((source) => (
        <article className="review-source" key={source.id}>
          <div>
            {source.safeUrl ? (
              <a href={source.safeUrl} rel="noreferrer" target="_blank">
                {source.title}
              </a>
            ) : (
              <strong>{source.title}</strong>
            )}
            <span>
              {source.publisher} / {labelFor(source.sourceType)} /{' '}
              {source.isVerified ? 'verified' : 'not verified'}
            </span>
          </div>
          {source.isVerified ? null : <SourceVerificationButton sourceId={source.id} />}
          <details className="draft-source-edit">
            <summary>Edit source</summary>
            <form onSubmit={(event) => updateSource(event, source.id)}>
              <label>
                Title
                <input defaultValue={source.title} name="title" required />
              </label>
              <label>
                Publisher
                <input defaultValue={source.publisher} name="publisher" required />
              </label>
              <label>
                URL
                <input defaultValue={source.url} name="url" required type="url" />
              </label>
              <label>
                Source type
                <select defaultValue={source.sourceType} name="sourceType">
                  {sourceTypes.map((sourceType) => (
                    <option key={sourceType} value={sourceType}>
                      {labelFor(sourceType)}
                    </option>
                  ))}
                </select>
              </label>
              <div>
                <button disabled={submitting === `PATCH-${source.id}`} type="submit">
                  {submitting === `PATCH-${source.id}` ? 'Saving...' : 'Save source'}
                </button>
                <button
                  disabled={submitting === `DELETE-${source.id}`}
                  onClick={() => void removeSource(source.id)}
                  type="button"
                >
                  {submitting === `DELETE-${source.id}` ? 'Removing...' : 'Remove source'}
                </button>
              </div>
            </form>
          </details>
        </article>
      ))}
      {sources.length === 0 ? <p>No sources attached.</p> : null}
    </div>
  )
}
