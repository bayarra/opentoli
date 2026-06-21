import { getPublishedTermBySlug, getRecommendedTranslation } from '@/lib/publicTerms'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type TermPageProps = {
  params: Promise<{ slug: string }>
}

export default async function TermPage({ params }: TermPageProps) {
  const { slug } = await params
  const data = await getPublishedTermBySlug(slug)

  if (!data) notFound()

  const { examples, sources, term, translations } = data
  const recommendedTranslation = getRecommendedTranslation(term)
  const alternatives = translations.filter(
    (translation) => translation.id !== recommendedTranslation?.id,
  )

  return (
    <main className="content-page term-page">
      <Link className="back-link" href="/">
        Back to OpenToli
      </Link>

      <header className="term-header">
        <div>
          <span className="status-badge">{term.reviewStatus.replaceAll('_', ' ')}</span>
          <h1>{term.headwordEn}</h1>
          <p>{[term.partOfSpeech, term.pronunciation].filter(Boolean).join(' · ')}</p>
        </div>
        <div className="recommended-translation">
          <span>Recommended Mongolian</span>
          <strong lang="mn">{recommendedTranslation?.translationMn || 'Translation pending'}</strong>
        </div>
      </header>

      <div className="term-grid">
        <section className="term-section">
          <p className="eyebrow">Meaning</p>
          <h2>English explanation</h2>
          <p>{term.explanationEn}</p>
          <h2 lang="mn">Монгол тайлбар</h2>
          <p lang="mn">{term.explanationMn}</p>
        </section>

        <aside className="term-section term-metadata">
          <p className="eyebrow">Trust and context</p>
          <dl>
            <div>
              <dt>Workflow</dt>
              <dd>{term.workflowStatus.replaceAll('_', ' ')}</dd>
            </div>
            <div>
              <dt>Review</dt>
              <dd>{term.reviewStatus.replaceAll('_', ' ')}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{new Date(term.updatedAt).toISOString().slice(0, 10)}</dd>
            </div>
          </dl>
        </aside>
      </div>

      {alternatives.length > 0 ? (
        <section className="term-section">
          <p className="eyebrow">Alternatives</p>
          <div className="alternative-list">
            {alternatives.map((translation) => (
              <div key={translation.id}>
                <strong lang="mn">{translation.translationMn}</strong>
                <span>{translation.translationType.replaceAll('_', ' ')}</span>
                {translation.explanationEn ? <p>{translation.explanationEn}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {examples.length > 0 ? (
        <section className="term-section">
          <p className="eyebrow">Examples</p>
          {examples.map((example) => (
            <blockquote key={example.id}>
              <p>{example.exampleEn}</p>
              <p lang="mn">{example.exampleMn}</p>
            </blockquote>
          ))}
        </section>
      ) : null}

      {sources.length > 0 ? (
        <section className="term-section">
          <p className="eyebrow">Sources</p>
          <ul className="source-list">
            {sources.map((source) => (
              <li key={source.id}>
                <a href={source.url} rel="noreferrer" target="_blank">
                  {source.title}
                </a>
                <span>{source.publisher}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {term.usageNoteEn ? (
        <section className="editorial-note">
          <strong>Editorial note</strong>
          <p>{term.usageNoteEn}</p>
          {term.usageNoteMn ? <p lang="mn">{term.usageNoteMn}</p> : null}
        </section>
      ) : null}
    </main>
  )
}
