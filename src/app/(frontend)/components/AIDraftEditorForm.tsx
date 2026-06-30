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
  qualityReview: null | {
    outcome: null | {
      editLevel: string
      notes: string
      outcome: string
    }
  }
}

type QualityRating = 'incorrect' | 'minor_edits' | 'rewritten' | 'used_as_is'

const initialQualityRating = (qualityReview: EditorFormProps['qualityReview']): QualityRating => {
  const outcome = qualityReview?.outcome
  if (!outcome || outcome.editLevel === 'none') return 'used_as_is'
  if (['needs_regeneration', 'rejected'].includes(outcome.outcome)) return 'incorrect'
  if (outcome.editLevel === 'minor') return 'minor_edits'
  return 'rewritten'
}

export function AIDraftEditorForm({ draftId, initial, qualityReview }: EditorFormProps) {
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState(initial)
  const [publishing, setPublishing] = useState(false)
  const [qualityNotes, setQualityNotes] = useState(qualityReview?.outcome?.notes || '')
  const [qualityRating, setQualityRating] = useState<QualityRating>(() =>
    initialQualityRating(qualityReview),
  )
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
      body: JSON.stringify({
        action: 'publish',
        ...(qualityReview
          ? { qualityNotes, qualityRating }
          : {}),
      }),
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
    window.location.assign('/workspace/drafts?completed=published')
  }

  const hide = async () => {
    setPublishing(true)
    setError('')
    const response = await fetch(`/api/editor/ai-drafts/${draftId}`, {
      body: JSON.stringify({
        action: 'hide',
        ...(qualityReview
          ? { qualityNotes, qualityRating }
          : {}),
      }),
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
    window.location.assign('/workspace/drafts?completed=hidden')
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
      {qualityReview ? (
        <fieldset className="draft-quality-review">
          <legend>AI quality</legend>
          <p>Saved with your Publish or Hide decision. This measures the AI, not the term.</p>
          <label>
            How much work did the AI result need?
            <select
              disabled={publishing}
              onChange={(event) => setQualityRating(event.target.value as QualityRating)}
              value={qualityRating}
            >
              <option value="used_as_is">Used as-is</option>
              <option value="minor_edits">Minor edits</option>
              <option value="rewritten">Rewritten</option>
              <option value="incorrect">Incorrect or unusable</option>
            </select>
          </label>
          <label>
            Quality note (optional)
            <textarea
              disabled={publishing}
              onChange={(event) => setQualityNotes(event.target.value)}
              placeholder="Briefly note what the AI got right or wrong."
              rows={3}
              value={qualityNotes}
            />
          </label>
        </fieldset>
      ) : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button disabled={publishing} type="submit">
        {publishing ? 'Publishing...' : 'Publish term'}
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
