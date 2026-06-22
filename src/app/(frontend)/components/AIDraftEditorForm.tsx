'use client'

import type { FormEvent } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

type DraftFields = {
  explanationEn: string
  explanationMn: string
  headwordEn: string
  recommendedTranslationMn: string
}

type EditorFormProps = {
  draftId: number
  initial: DraftFields
  isHighRisk: boolean
}

export function AIDraftEditorForm({ draftId, initial, isHighRisk }: EditorFormProps) {
  const [confirmHighRisk, setConfirmHighRisk] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState(initial)
  const [publishing, setPublishing] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const revision = useRef(0)

  const save = useCallback(async () => {
    const savingRevision = revision.current
    setSaveState('saving')
    const response = await fetch(`/api/editor/ai-drafts/${draftId}`, {
      body: JSON.stringify(fields),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'PATCH',
    })
    const result = await response.json().catch(() => null)
    if (!response.ok) {
      setError(result?.message || 'Draft changes could not be saved.')
      setSaveState('idle')
      return false
    }
    setError('')
    if (revision.current === savingRevision) {
      setDirty(false)
      setSaveState('saved')
    } else {
      setDirty(true)
      setSaveState('idle')
    }
    return true
  }, [draftId, fields])

  useEffect(() => {
    if (!dirty) return
    const timeout = window.setTimeout(() => void save(), 800)
    return () => window.clearTimeout(timeout)
  }, [dirty, save])

  const updateField = (field: keyof DraftFields, value: string) => {
    revision.current += 1
    setFields((current) => ({ ...current, [field]: value }))
    setDirty(true)
    setSaveState('idle')
  }

  const publish = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPublishing(true)
    setError('')
    if (!(await save())) {
      setPublishing(false)
      return
    }
    const response = await fetch(`/api/editor/ai-drafts/${draftId}`, {
      body: JSON.stringify({ action: 'publish', confirmHighRisk }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    const result = await response.json().catch(() => null)
    if (!response.ok) {
      setError(result?.message || 'This term could not be published.')
      setPublishing(false)
      return
    }
    window.location.assign(`/terms/${result.slug}`)
  }

  const hide = async () => {
    setPublishing(true)
    setError('')
    const response = await fetch(`/api/editor/ai-drafts/${draftId}`, {
      body: JSON.stringify({ action: 'hide' }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    const result = await response.json().catch(() => null)
    if (!response.ok) {
      setError(result?.message || 'This draft could not be hidden.')
      setPublishing(false)
      return
    }
    window.location.assign('/review/ai-drafts')
  }

  return (
    <form className="review-decision-form" onSubmit={publish}>
      <div className="editor-save-state" role="status">
        {saveState === 'saving'
          ? 'Saving changes...'
          : saveState === 'saved'
            ? 'Changes saved'
            : dirty
              ? 'Unsaved changes'
              : 'Ready'}
      </div>
      <label>
        English headword
        <input
          disabled={publishing}
          onChange={(event) => updateField('headwordEn', event.target.value)}
          required
          value={fields.headwordEn}
        />
      </label>
      <label>
        Mongolian translation
        <input
          disabled={publishing}
          lang="mn"
          onChange={(event) => updateField('recommendedTranslationMn', event.target.value)}
          required
          value={fields.recommendedTranslationMn}
        />
      </label>
      <label>
        English explanation
        <textarea
          disabled={publishing}
          onChange={(event) => updateField('explanationEn', event.target.value)}
          required
          rows={5}
          value={fields.explanationEn}
        />
      </label>
      <label>
        Mongolian explanation
        <textarea
          disabled={publishing}
          lang="mn"
          onChange={(event) => updateField('explanationMn', event.target.value)}
          required
          rows={5}
          value={fields.explanationMn}
        />
      </label>
      {isHighRisk ? (
        <label className="high-risk-confirmation">
          <input
            checked={confirmHighRisk}
            disabled={publishing}
            onChange={(event) => setConfirmHighRisk(event.target.checked)}
            type="checkbox"
          />
          I reviewed the high-risk warning and confirm this term is ready to publish.
        </label>
      ) : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button disabled={publishing} type="submit">
        {publishing ? 'Publishing...' : 'Publish'}
      </button>
      <details className="editor-more-actions">
        <summary>More</summary>
        <p>Hide removes this draft from the active inbox but preserves its history.</p>
        <button disabled={publishing} onClick={hide} type="button">
          Hide draft
        </button>
      </details>
    </form>
  )
}
