'use client'

import { useRouter } from 'next/navigation'
import type { FormEvent } from 'react'
import { useState } from 'react'

type Option = { id: number; nameEn: string; nameMn: string }
type ContextOption = Option & { categoryId: number | null }
type Alternative = {
  contextId: number | null
  explanationEn: string
  explanationMn: string
  id?: number
  register: string
  translationMn: string
  translationType: string
  usageNote: string
}
type Example = { contextId: number | null; exampleEn: string; exampleMn: string; id?: number }
type Reference = { id?: number; title: string; url: string }

type PublishedTermEditorFormProps = {
  categories: Option[]
  contexts: ContextOption[]
  initial: {
    alternativeTranslations: Alternative[]
    categoryIds: number[]
    contextIds: number[]
    examples: Example[]
    explanationEn: string
    explanationMn: string
    headwordEn: string
    partOfSpeech: string
    recommendedTranslation: { id: number; translationMn: string }
    references: Reference[]
    shortDefinitionEn: string
    usageNoteEn: string
    usageNoteMn: string
  }
  termId: number
}

const selectedIds = (element: HTMLSelectElement) =>
  Array.from(element.selectedOptions, (option) => Number(option.value))

export function PublishedTermEditorForm({ categories, contexts, initial, termId }: PublishedTermEditorFormProps) {
  const router = useRouter()
  const [alternatives, setAlternatives] = useState(initial.alternativeTranslations)
  const [examples, setExamples] = useState(initial.examples)
  const [references, setReferences] = useState(initial.references)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSaved(false)
    setSubmitting(true)
    const form = event.currentTarget
    const data = new FormData(form)
    const response = await fetch(`/api/editor/terms/${termId}`, {
      body: JSON.stringify({
        alternativeTranslations: alternatives,
        categoryIds: selectedIds(form.elements.namedItem('categoryIds') as HTMLSelectElement),
        contextIds: selectedIds(form.elements.namedItem('contextIds') as HTMLSelectElement),
        examples,
        explanationEn: data.get('explanationEn'),
        explanationMn: data.get('explanationMn'),
        headwordEn: data.get('headwordEn'),
        partOfSpeech: data.get('partOfSpeech'),
        recommendedTranslation: {
          id: initial.recommendedTranslation.id,
          translationMn: data.get('recommendedTranslationMn'),
        },
        references,
        shortDefinitionEn: data.get('shortDefinitionEn'),
        usageNoteEn: data.get('usageNoteEn'),
        usageNoteMn: data.get('usageNoteMn'),
      }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'PATCH',
    })
    const result = await response.json().catch(() => null)
    if (!response.ok) {
      setError(result?.message || 'Published term could not be saved.')
      setSubmitting(false)
      return
    }
    setSaved(true)
    setSubmitting(false)
    router.refresh()
  }

  return (
    <form className="published-term-editor" onSubmit={submit}>
      <section className="workspace-panel term-editor-section">
        <div className="panel-heading"><div><p className="eyebrow">Canonical wording</p><h2>Term and explanations</h2></div></div>
        <div className="term-editor-grid">
          <label>English headword<input defaultValue={initial.headwordEn} name="headwordEn" required /></label>
          <label>Part of speech<select defaultValue={initial.partOfSpeech} name="partOfSpeech"><option value="">Not specified</option>{['noun','verb','adjective','adverb','phrase','acronym','other'].map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="wide-field">Short English definition<textarea defaultValue={initial.shortDefinitionEn} name="shortDefinitionEn" required rows={3} /></label>
          <label className="wide-field">English explanation<textarea defaultValue={initial.explanationEn} name="explanationEn" required rows={5} /></label>
          <label className="wide-field">Mongolian explanation<textarea defaultValue={initial.explanationMn} lang="mn" name="explanationMn" required rows={5} /></label>
          <label>English usage note<textarea defaultValue={initial.usageNoteEn} name="usageNoteEn" rows={3} /></label>
          <label>Mongolian usage note<textarea defaultValue={initial.usageNoteMn} lang="mn" name="usageNoteMn" rows={3} /></label>
          <label>Categories<select defaultValue={initial.categoryIds.map(String)} multiple name="categoryIds" required>{categories.map((item) => <option key={item.id} value={item.id}>{item.nameEn} / {item.nameMn}</option>)}</select></label>
          <label>Contexts<select defaultValue={initial.contextIds.map(String)} multiple name="contextIds">{contexts.map((item) => <option key={item.id} value={item.id}>{item.nameEn} / {item.nameMn}</option>)}</select></label>
        </div>
      </section>

      <section className="workspace-panel term-editor-section">
        <div className="panel-heading"><div><p className="eyebrow">Translations</p><h2>Recommended and alternatives</h2></div></div>
        <label>Recommended Mongolian translation<input defaultValue={initial.recommendedTranslation.translationMn} lang="mn" name="recommendedTranslationMn" required /></label>
        <div className="repeatable-list">
          {alternatives.map((item, index) => (
            <article key={item.id || `new-${index}`}>
              <div className="term-editor-grid">
                <label>Mongolian wording<input lang="mn" onChange={(event) => setAlternatives((items) => items.map((value, itemIndex) => itemIndex === index ? { ...value, translationMn: event.target.value } : value))} required value={item.translationMn} /></label>
                <label>Type<select onChange={(event) => setAlternatives((items) => items.map((value, itemIndex) => itemIndex === index ? { ...value, translationType: event.target.value } : value))} value={item.translationType}>{['alternative','context_specific','formal','informal','literal'].map((value) => <option key={value} value={value}>{value.replaceAll('_',' ')}</option>)}</select></label>
                <label>Register<select onChange={(event) => setAlternatives((items) => items.map((value, itemIndex) => itemIndex === index ? { ...value, register: event.target.value } : value))} value={item.register}>{['general','formal','informal','technical','academic','legal','medical','business'].map((value) => <option key={value}>{value}</option>)}</select></label>
                <label>Context<select onChange={(event) => setAlternatives((items) => items.map((value, itemIndex) => itemIndex === index ? { ...value, contextId: event.target.value ? Number(event.target.value) : null } : value))} value={item.contextId || ''}><option value="">No specific context</option>{contexts.map((context) => <option key={context.id} value={context.id}>{context.nameEn}</option>)}</select></label>
                <label>English explanation<textarea onChange={(event) => setAlternatives((items) => items.map((value, itemIndex) => itemIndex === index ? { ...value, explanationEn: event.target.value } : value))} rows={2} value={item.explanationEn} /></label>
                <label>Mongolian explanation<textarea lang="mn" onChange={(event) => setAlternatives((items) => items.map((value, itemIndex) => itemIndex === index ? { ...value, explanationMn: event.target.value } : value))} rows={2} value={item.explanationMn} /></label>
              </div>
              <button className="secondary-button" onClick={() => setAlternatives((items) => items.filter((_, itemIndex) => itemIndex !== index))} type="button">Remove alternative</button>
            </article>
          ))}
        </div>
        <button className="secondary-button" onClick={() => setAlternatives((items) => [...items, { contextId: null, explanationEn: '', explanationMn: '', register: 'general', translationMn: '', translationType: 'alternative', usageNote: '' }])} type="button">Add alternative</button>
      </section>

      <section className="workspace-panel term-editor-section">
        <div className="panel-heading"><div><p className="eyebrow">Usage</p><h2>Examples</h2></div></div>
        <div className="repeatable-list">{examples.map((item, index) => <article key={item.id || `new-${index}`}><label>English example<textarea onChange={(event) => setExamples((items) => items.map((value, itemIndex) => itemIndex === index ? { ...value, exampleEn: event.target.value } : value))} required rows={2} value={item.exampleEn} /></label><label>Mongolian example<textarea lang="mn" onChange={(event) => setExamples((items) => items.map((value, itemIndex) => itemIndex === index ? { ...value, exampleMn: event.target.value } : value))} required rows={2} value={item.exampleMn} /></label><label>Context<select onChange={(event) => setExamples((items) => items.map((value, itemIndex) => itemIndex === index ? { ...value, contextId: event.target.value ? Number(event.target.value) : null } : value))} value={item.contextId || ''}><option value="">No specific context</option>{contexts.map((context) => <option key={context.id} value={context.id}>{context.nameEn}</option>)}</select></label><button className="secondary-button" onClick={() => setExamples((items) => items.filter((_, itemIndex) => itemIndex !== index))} type="button">Remove example</button></article>)}</div>
        <button className="secondary-button" onClick={() => setExamples((items) => [...items, { contextId: null, exampleEn: '', exampleMn: '' }])} type="button">Add example</button>
      </section>

      <section className="workspace-panel term-editor-section">
        <div className="panel-heading"><div><p className="eyebrow">Background</p><h2>Optional references</h2></div></div>
        <div className="repeatable-list">{references.map((item, index) => <article key={item.id || `new-${index}`}><label>Title<input onChange={(event) => setReferences((items) => items.map((value, itemIndex) => itemIndex === index ? { ...value, title: event.target.value } : value))} required value={item.title} /></label><label>URL<input onChange={(event) => setReferences((items) => items.map((value, itemIndex) => itemIndex === index ? { ...value, url: event.target.value } : value))} required type="url" value={item.url} /></label><button className="secondary-button" onClick={() => setReferences((items) => items.filter((_, itemIndex) => itemIndex !== index))} type="button">Remove reference</button></article>)}</div>
        <button className="secondary-button" onClick={() => setReferences((items) => [...items, { title: '', url: '' }])} type="button">Add reference</button>
      </section>

      <div className="sticky-save-bar">
        <button disabled={submitting} type="submit">{submitting ? 'Saving...' : 'Save published term'}</button>
        {saved ? <span role="status">Published term saved.</span> : null}
        {error ? <span className="form-error" role="alert">{error}</span> : null}
      </div>
    </form>
  )
}
