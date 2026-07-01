'use client'

import type { FormEvent } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

type DraftFields = {
  alternativeTranslations: Array<{
    context?: string
    translationMn: string
    type: 'alternative' | 'borrowed' | 'context_specific' | 'formal' | 'literal'
    usageNote?: string
  }>
  examples: Array<{ exampleEn: string; exampleMn: string }>
  explanationEn: string
  explanationMn: string
  headwordEn: string
  recommendedTranslationMn: string
}

type DraftTextField = 'explanationEn' | 'explanationMn' | 'headwordEn' | 'recommendedTranslationMn'

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

const fieldsAreComplete = (fields: DraftFields) =>
  fields.alternativeTranslations.every((item) => item.translationMn.trim().length >= 2) &&
  fields.examples.every(
    (item) => item.exampleEn.trim().length >= 2 && item.exampleMn.trim().length >= 2,
  )

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
    if (!dirty || !fieldsAreComplete(fields)) return
    const timeout = window.setTimeout(() => void save(), 800)
    return () => window.clearTimeout(timeout)
  }, [dirty, fields, save])

  const updateFields = (update: (current: DraftFields) => DraftFields) => {
    revision.current += 1
    setFields(update)
    setDirty(true)
    setSaveState('idle')
  }

  const updateField = (field: DraftTextField, value: string) => {
    updateFields((current) => ({ ...current, [field]: value }))
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
        ...(qualityReview ? { qualityNotes, qualityRating } : {}),
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
        ...(qualityReview ? { qualityNotes, qualityRating } : {}),
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
      <section className="draft-editor-subset" aria-labelledby="draft-alternatives-heading">
        <div>
          <p className="eyebrow">Alternatives</p>
          <h2 id="draft-alternatives-heading">Alternative translations</h2>
          <p>Edit, remove, or add alternatives for the published term.</p>
        </div>
        <div className="repeatable-list">
          {fields.alternativeTranslations.map((alternative, index) => (
            <article key={index}>
              <span className="status-badge">{alternative.type.replaceAll('_', ' ')}</span>
              <label>
                Mongolian alternative
                <input
                  disabled={publishing}
                  lang="mn"
                  onChange={(event) =>
                    updateFields((current) => ({
                      ...current,
                      alternativeTranslations: current.alternativeTranslations.map(
                        (item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, translationMn: event.target.value }
                            : item,
                      ),
                    }))
                  }
                  required
                  value={alternative.translationMn}
                />
              </label>
              <label>
                Context (optional)
                <input
                  disabled={publishing}
                  onChange={(event) =>
                    updateFields((current) => ({
                      ...current,
                      alternativeTranslations: current.alternativeTranslations.map(
                        (item, itemIndex) =>
                          itemIndex === index ? { ...item, context: event.target.value } : item,
                      ),
                    }))
                  }
                  value={alternative.context || ''}
                />
              </label>
              <label>
                Usage note (optional)
                <textarea
                  disabled={publishing}
                  onChange={(event) =>
                    updateFields((current) => ({
                      ...current,
                      alternativeTranslations: current.alternativeTranslations.map(
                        (item, itemIndex) =>
                          itemIndex === index ? { ...item, usageNote: event.target.value } : item,
                      ),
                    }))
                  }
                  rows={2}
                  value={alternative.usageNote || ''}
                />
              </label>
              <button
                className="secondary-button"
                disabled={publishing}
                onClick={() =>
                  updateFields((current) => ({
                    ...current,
                    alternativeTranslations: current.alternativeTranslations.filter(
                      (_, itemIndex) => itemIndex !== index,
                    ),
                  }))
                }
                type="button"
              >
                Remove alternative
              </button>
            </article>
          ))}
        </div>
        <button
          className="secondary-button"
          disabled={publishing}
          onClick={() =>
            updateFields((current) => ({
              ...current,
              alternativeTranslations: [
                ...current.alternativeTranslations,
                { translationMn: '', type: 'alternative' },
              ],
            }))
          }
          type="button"
        >
          Add alternative
        </button>
      </section>

      <section className="draft-editor-subset" aria-labelledby="draft-examples-heading">
        <div>
          <p className="eyebrow">Examples</p>
          <h2 id="draft-examples-heading">Bilingual examples</h2>
        </div>
        <div className="repeatable-list">
          {fields.examples.map((example, index) => (
            <article key={index}>
              <label>
                English example
                <textarea
                  disabled={publishing}
                  onChange={(event) =>
                    updateFields((current) => ({
                      ...current,
                      examples: current.examples.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, exampleEn: event.target.value } : item,
                      ),
                    }))
                  }
                  required
                  rows={2}
                  value={example.exampleEn}
                />
              </label>
              <label>
                Mongolian example
                <textarea
                  disabled={publishing}
                  lang="mn"
                  onChange={(event) =>
                    updateFields((current) => ({
                      ...current,
                      examples: current.examples.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, exampleMn: event.target.value } : item,
                      ),
                    }))
                  }
                  required
                  rows={2}
                  value={example.exampleMn}
                />
              </label>
              <button
                className="secondary-button"
                disabled={publishing}
                onClick={() =>
                  updateFields((current) => ({
                    ...current,
                    examples: current.examples.filter((_, itemIndex) => itemIndex !== index),
                  }))
                }
                type="button"
              >
                Remove example
              </button>
            </article>
          ))}
        </div>
        <button
          className="secondary-button"
          disabled={publishing}
          onClick={() =>
            updateFields((current) => ({
              ...current,
              examples: [...current.examples, { exampleEn: '', exampleMn: '' }],
            }))
          }
          type="button"
        >
          Add example
        </button>
      </section>
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
