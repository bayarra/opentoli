'use client'

import {
  calibrationDomainAssessments,
  calibrationEditLevels,
  calibrationGoNoGoRecommendations,
  calibrationLanguageAssessments,
  calibrationOutcomeValues,
  calibrationSourceAssessments,
} from '@/calibration/options'
import { useRouter } from 'next/navigation'
import type { FormEvent } from 'react'
import { useState } from 'react'

type CalibrationOutcomeSummary = {
  domainAssessment: string
  editLevel: string
  goNoGoRecommendation: string | null
  languageAssessment: string
  notes: string
  outcome: string
  sourceAssessment: string
}

type CalibrationOutcomeFormProps = {
  draftId: number
  outcome: CalibrationOutcomeSummary | null
}

const labelFor = (value: string) => value.replaceAll('_', ' ')

const fieldsFrom = (form: HTMLFormElement, draftId: number) => {
  const data = new FormData(form)
  return {
    aiDraftId: draftId,
    domainAssessment: String(data.get('domainAssessment') || ''),
    editLevel: String(data.get('editLevel') || ''),
    goNoGoRecommendation: String(data.get('goNoGoRecommendation') || ''),
    languageAssessment: String(data.get('languageAssessment') || ''),
    notes: String(data.get('notes') || ''),
    outcome: String(data.get('outcome') || ''),
    sourceAssessment: String(data.get('sourceAssessment') || ''),
  }
}

export function CalibrationOutcomeForm({ draftId, outcome }: CalibrationOutcomeFormProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    const response = await fetch('/api/editor/calibration/outcomes', {
      body: JSON.stringify(fieldsFrom(event.currentTarget, draftId)),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    const result = await response.json().catch(() => null)

    if (!response.ok) {
      setError(result?.message || 'Calibration outcome could not be saved.')
      setSubmitting(false)
      return
    }

    router.refresh()
    setSubmitting(false)
  }

  return (
    <form className="calibration-outcome-form" onSubmit={submit}>
      <div className="calibration-form-grid">
        <label>
          Outcome
          <select defaultValue={outcome?.outcome || 'accepted_with_edits'} name="outcome">
            {calibrationOutcomeValues.map((value) => (
              <option key={value} value={value}>
                {labelFor(value)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Edit level
          <select defaultValue={outcome?.editLevel || 'not_checked'} name="editLevel">
            {calibrationEditLevels.map((value) => (
              <option key={value} value={value}>
                {labelFor(value)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Source support
          <select
            defaultValue={outcome?.sourceAssessment || 'not_checked'}
            name="sourceAssessment"
          >
            {calibrationSourceAssessments.map((value) => (
              <option key={value} value={value}>
                {labelFor(value)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Language
          <select
            defaultValue={outcome?.languageAssessment || 'not_checked'}
            name="languageAssessment"
          >
            {calibrationLanguageAssessments.map((value) => (
              <option key={value} value={value}>
                {labelFor(value)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Domain
          <select defaultValue={outcome?.domainAssessment || 'not_checked'} name="domainAssessment">
            {calibrationDomainAssessments.map((value) => (
              <option key={value} value={value}>
                {labelFor(value)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Go/no-go hint
          <select defaultValue={outcome?.goNoGoRecommendation || ''} name="goNoGoRecommendation">
            <option value="">No recommendation yet</option>
            {calibrationGoNoGoRecommendations.map((value) => (
              <option key={value} value={value}>
                {labelFor(value)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Review notes
        <textarea
          defaultValue={outcome?.notes || ''}
          name="notes"
          placeholder="Record human edits, source concerns, terminology questions, or prompt tuning evidence."
          required
          rows={4}
        />
      </label>
      <button disabled={submitting} type="submit">
        {submitting ? 'Saving outcome...' : outcome ? 'Update outcome' : 'Record outcome'}
      </button>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}
