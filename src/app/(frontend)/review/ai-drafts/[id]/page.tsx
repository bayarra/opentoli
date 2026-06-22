import { AIDraftDecisionForm } from '@/app/(frontend)/components/AIDraftDecisionForm'
import { getCurrentUser } from '@/lib/currentUser'
import { getReviewerDraft } from '@/review/reviewerData'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

type ReviewPageProps = { params: Promise<{ id: string }> }

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Review AI Draft | OpenToli',
}

export default async function AIDraftReviewPage({ params }: ReviewPageProps) {
  const user = await getCurrentUser()
  const id = Number((await params).id)
  if (!user) redirect(`/login?next=${encodeURIComponent(`/review/ai-drafts/${id}`)}`)
  if (!Number.isInteger(id)) notFound()
  const data = await getReviewerDraft(id, user)
  if (!data) notFound()

  const { comments, critique, decisions, draft, generated, research, sources } = data
  const actionable = ['editing', 'needs_review'].includes(draft.status)

  return (
    <main className="content-page reviewer-page">
      <Link className="back-link" href="/review/ai-drafts">
        Back to review queue
      </Link>
      <header className="reviewer-heading">
        <div>
          <p className="eyebrow">Private reviewer evidence</p>
          <h1>{draft.inputHeadword}</h1>
          <p>{[data.category, data.context].filter(Boolean).join(' / ')}</p>
        </div>
        <div className="review-queue-badges">
          <span className={`risk-badge risk-${draft.riskLevel}`}>{draft.riskLevel} risk</span>
          <span>{draft.reviewRoute.replaceAll('_', ' ')}</span>
          <span>{draft.status.replaceAll('_', ' ')}</span>
        </div>
      </header>

      <div className="reviewer-grid">
        <section className="review-panel">
          <p className="eyebrow">Generated candidate</p>
          <h2 lang="mn">{generated.recommendedTranslationMn}</h2>
          <p>{generated.explanationEn}</p>
          <p lang="mn">{generated.explanationMn}</p>
          <h3>Alternatives</h3>
          {generated.alternativeTranslations.map((candidate, index) => (
            <article className="review-candidate" key={`${candidate.translationMn}-${index}`}>
              <strong lang="mn">{candidate.translationMn}</strong>
              <span>{candidate.type.replaceAll('_', ' ')}</span>
              {candidate.usageNote ? <p>{candidate.usageNote}</p> : null}
              {candidate.rejectionReason ? <p>{candidate.rejectionReason}</p> : null}
            </article>
          ))}
        </section>

        <section className="review-panel">
          <p className="eyebrow">Confidence</p>
          <dl className="confidence-list">
            {Object.entries(draft.confidenceDimensions).map(([dimension, confidence]) => (
              <div key={dimension}>
                <dt>{dimension.replaceAll(/([A-Z])/g, ' $1')}</dt>
                <dd>{confidence}</dd>
              </div>
            ))}
          </dl>
          <p className="eyebrow">Critique</p>
          <p>{critique.summary}</p>
          {Object.entries(critique.checks).map(([name, check]) => (
            <article className={`critique-check critique-${check.assessment}`} key={name}>
              <strong>{name.replaceAll(/([A-Z])/g, ' $1')}</strong>
              <span>{check.assessment}</span>
              {check.notes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </article>
          ))}
        </section>
      </div>

      <section className="review-panel">
        <p className="eyebrow">Research packet</p>
        <h2>Canonical meaning</h2>
        <p>{research.canonicalMeaning}</p>
        <div className="reviewer-grid compact-grid">
          <div>
            <h3>Ambiguities</h3>
            {research.ambiguities.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
          <div>
            <h3>Reviewer questions</h3>
            {research.reviewerQuestions.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="review-panel">
        <p className="eyebrow">Sources</p>
        {sources.map((source) => (
          <article className="review-source" key={source.id}>
            {source.url ? (
              <a href={source.url} rel="noreferrer" target="_blank">
                {source.title}
              </a>
            ) : (
              <strong>{source.title}</strong>
            )}
            <span>
              {source.publisher} / {source.isVerified ? 'verified' : 'not verified'}
            </span>
          </article>
        ))}
      </section>

      <section className="review-panel">
        <p className="eyebrow">Community feedback</p>
        {comments.map((comment) => (
          <article className="review-comment" key={comment.id}>
            <div>
              <strong>{comment.author}</strong>
              <span>{comment.status}</span>
            </div>
            {comment.suggestedTranslationMn ? (
              <p lang="mn">
                <strong>{comment.suggestedTranslationMn}</strong>
              </p>
            ) : null}
            <p>{comment.body}</p>
          </article>
        ))}
        {comments.length === 0 ? <p>No community feedback.</p> : null}
      </section>

      <section className="review-panel">
        <p className="eyebrow">Decision history</p>
        {decisions.map((decision) => (
          <article className="decision-history" key={decision.id}>
            <div>
              <strong>{decision.action}</strong>
              <span>
                {decision.actor} / {decision.decisionAt.slice(0, 10)}
              </span>
            </div>
            <p>{decision.notes}</p>
          </article>
        ))}
        {decisions.length === 0 ? <p>No recorded decisions.</p> : null}
      </section>

      <section className="review-panel">
        <p className="eyebrow">Human decision</p>
        {actionable ? (
          <AIDraftDecisionForm
            draftId={draft.id}
            initial={{
              explanationEn: generated.explanationEn,
              explanationMn: generated.explanationMn,
              headwordEn: generated.headwordEn,
              selectedTranslationMn: generated.recommendedTranslationMn,
            }}
          />
        ) : (
          <p>
            This AI draft is not actionable. Current outcome:{' '}
            <strong>{draft.reviewOutcome || draft.status}</strong>.
          </p>
        )}
      </section>
    </main>
  )
}
