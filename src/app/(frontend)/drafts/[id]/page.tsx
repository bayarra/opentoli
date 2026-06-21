import { FeedbackForm } from '@/app/(frontend)/components/FeedbackForm'
import { getPublicAIDraftById } from '@/lib/publicAIDrafts'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type DraftPageProps = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: DraftPageProps): Promise<Metadata> {
  const id = Number((await params).id)
  const draft = Number.isInteger(id) ? await getPublicAIDraftById(id) : null
  if (!draft) return { title: 'Draft not found | OpenToli' }

  return {
    description: `Unverified AI-prepared Mongolian translation candidates for ${draft.headwordEn}.`,
    robots: { follow: false, index: false },
    title: `${draft.headwordEn} - Unverified AI Draft | OpenToli`,
  }
}

export default async function PublicDraftPage({ params }: DraftPageProps) {
  const id = Number((await params).id)
  if (!Number.isInteger(id)) notFound()
  const draft = await getPublicAIDraftById(id)
  if (!draft) notFound()

  return (
    <main className="content-page term-page draft-page">
      <Link className="back-link" href="/">
        Back to OpenToli
      </Link>

      <section className="unverified-banner" role="status">
        <strong>Unverified AI Draft</strong>
        <p>This wording was prepared by AI and has not been approved by a human reviewer.</p>
      </section>

      <header className="term-header">
        <div>
          <span className="status-badge">Needs human review</span>
          <h1>{draft.headwordEn}</h1>
          <p>{[draft.category, draft.context].filter(Boolean).join(' / ')}</p>
        </div>
        <div className="recommended-translation draft-translation">
          <span>AI candidate, not recommended yet</span>
          <strong lang="mn">{draft.recommendedTranslationMn}</strong>
        </div>
      </header>

      <div className="term-grid">
        <section className="term-section">
          <p className="eyebrow">Draft meaning</p>
          <h2>English explanation</h2>
          <p>{draft.explanationEn}</p>
          <h2 lang="mn">Монгол тайлбарын төсөл</h2>
          <p lang="mn">{draft.explanationMn}</p>
        </section>
        <aside className="term-section term-metadata">
          <p className="eyebrow">Review state</p>
          <dl>
            <div>
              <dt>Status</dt>
              <dd>Unverified</dd>
            </div>
            <div>
              <dt>Route</dt>
              <dd>{draft.reviewRoute.replaceAll('_', ' ')}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{draft.updatedAt.slice(0, 10)}</dd>
            </div>
          </dl>
        </aside>
      </div>

      {draft.alternatives.length > 0 ? (
        <section className="term-section">
          <p className="eyebrow">Candidate alternatives</p>
          <div className="alternative-list">
            {draft.alternatives.map((candidate, index) => (
              <div key={`${candidate.translationMn}-${index}`}>
                <strong lang="mn">{candidate.translationMn}</strong>
                <span>{candidate.type.replaceAll('_', ' ')}</span>
                {candidate.usageNote ? <p>{candidate.usageNote}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {draft.examples.length > 0 ? (
        <section className="term-section">
          <p className="eyebrow">Draft examples</p>
          {draft.examples.map((example, index) => (
            <blockquote key={`${example.exampleEn}-${index}`}>
              <p>{example.exampleEn}</p>
              <p lang="mn">{example.exampleMn}</p>
            </blockquote>
          ))}
        </section>
      ) : null}

      {draft.sources.length > 0 ? (
        <section className="term-section">
          <p className="eyebrow">Evidence supplied to the draft</p>
          <ul className="source-list">
            {draft.sources.map((source) => (
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

      <section className="term-section feedback-section">
        <p className="eyebrow">Community feedback</p>
        <h2>Help improve this draft</h2>
        <FeedbackForm draftId={draft.id} />
      </section>

      <section className="term-section">
        <p className="eyebrow">Approved discussion</p>
        {draft.comments.length > 0 ? (
          <div className="comment-list">
            {draft.comments.map((comment) => (
              <article key={comment.id}>
                <div>
                  <strong>{comment.author}</strong>
                  <span>{comment.createdAt.slice(0, 10)}</span>
                </div>
                {comment.suggestedTranslationMn ? (
                  <p lang="mn">
                    <strong>{comment.suggestedTranslationMn}</strong>
                  </p>
                ) : null}
                <p>{comment.body}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted-copy">No approved feedback yet.</p>
        )}
      </section>
    </main>
  )
}
