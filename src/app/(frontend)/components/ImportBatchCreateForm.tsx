'use client'

import { useRouter } from 'next/navigation'
import type { FormEvent } from 'react'
import { useState } from 'react'

type CategoryOption = { id: number; nameEn: string; nameMn: string }

export function ImportBatchCreateForm({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [inputMode, setInputMode] = useState<'csv' | 'manual'>('manual')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    const data = new FormData(event.currentTarget)
    const response = await fetch('/api/editor/imports', {
      body: JSON.stringify({ categoryId: data.get('categoryId'), inputMode, name: data.get('name'), rawInput: data.get('rawInput') }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    const result = await response.json().catch(() => null)
    if (!response.ok) {
      setError(result?.message || 'Import batch could not be prepared.')
      setSubmitting(false)
      return
    }
    router.push(`/workspace/imports/${result.batchId}`)
    router.refresh()
  }

  return <form className="import-create-form" onSubmit={submit}>
    <div className="term-editor-grid">
      <label>Batch name<input name="name" placeholder="July software terminology" required /></label>
      <label>Category<select name="categoryId" required><option value="">Choose a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.nameEn} / {category.nameMn}</option>)}</select></label>
      <label>Input format<select onChange={(event) => setInputMode(event.target.value as 'csv' | 'manual')} value={inputMode}><option value="manual">One headword per line</option><option value="csv">CSV with headword and optional context</option></select></label>
      <div className="wide-field import-format-note"><strong>{inputMode === 'manual' ? 'Manual format' : 'CSV format'}</strong><code>{inputMode === 'manual' ? 'authentication\nauthorization\naccess control' : 'headword,context\nauthentication,"identity verification"'}</code></div>
      <label className="wide-field">Terms to prepare<textarea name="rawInput" placeholder={inputMode === 'manual' ? 'One English headword per line' : 'headword,context'} required rows={10} /></label>
    </div>
    <button disabled={submitting} type="submit">{submitting ? 'Preparing...' : 'Prepare for review'}</button>
    {error ? <p className="form-error" role="alert">{error}</p> : null}
  </form>
}
