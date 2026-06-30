import { AIDraftEditorForm } from '@/app/(frontend)/components/AIDraftEditorForm'
import { DraftVisibilityForm } from '@/app/(frontend)/components/DraftVisibilityForm'
import { DraftReferenceManager } from '@/app/(frontend)/components/DraftReferenceManager'
import { WorkspaceShell } from '@/app/(frontend)/components/WorkspaceShell'
import { getEditorDraft } from '@/editor/data'
import { getCurrentUser } from '@/lib/currentUser'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

type EditorPageProps = { params: Promise<{ id: string }> }

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Edit AI Draft | OpenToli',
}

export const dynamic = 'force-dynamic'

export default async function AIDraftEditorPage({ params }: EditorPageProps) {
  const user = await getCurrentUser()
  const id = Number((await params).id)
  if (!user) redirect(`/login?next=${encodeURIComponent(`/workspace/drafts/${id}`)}`)
  if (!Number.isInteger(id)) notFound()
  const data = await getEditorDraft(id, user)
  if (!data) notFound()

  const { comments, draft, generated, references } = data
  const active = ['editing', 'needs_review'].includes(draft.status)
  const publicFeedbackDisabledReason = 'Only active drafts can be opened for public feedback.'

  return (
    <WorkspaceShell>
      <main className="content-page reviewer-page">
      <Link className="back-link" href="/workspace/drafts">
        Back to Review Queue
      </Link>
      <header className="reviewer-heading">
        <div>
          <p className="eyebrow">Review AI draft</p>
          <h1>{draft.inputHeadword}</h1>
          <p>{[data.category, data.context].filter(Boolean).join(' / ')}</p>
          <p>
            Edit the public wording here. Community suggestions are shown below; optional
            references and raw AI evidence stay in the background.
          </p>
        </div>
        <div className="review-queue-badges">
          <span>
            {draft.publicVisibility === 'public' ? 'Public unverified draft' : 'Private draft'}
          </span>
        </div>
      </header>

      <section className="review-panel">
        <p className="eyebrow">Term fields</p>
        {active ? (
          <AIDraftEditorForm
            draftId={draft.id}
            initial={{
              explanationEn: generated.explanationEn,
              explanationMn: generated.explanationMn,
              headwordEn: generated.headwordEn,
              recommendedTranslationMn: generated.recommendedTranslationMn,
            }}
            qualityReview={data.qualityReview}
          />
        ) : (
          <p>This draft is no longer active.</p>
        )}
      </section>

      <section className="review-panel">
        <p className="eyebrow">Public feedback</p>
        <h2>Open or close community review.</h2>
        <p>
          Public feedback shows only the safe redacted draft projection. It does not verify,
          approve, or publish this term.
        </p>
        <DraftVisibilityForm
          canOpen={active}
          disabledReason={publicFeedbackDisabledReason}
          draftId={draft.id}
          isPublic={draft.publicVisibility === 'public'}
        />
      </section>

      <div className="reviewer-grid">
        <section className="review-panel">
          <p className="eyebrow">Community suggestions</p>
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
          {comments.length === 0 ? <p>No community suggestions.</p> : null}
        </section>

        <section className="review-panel">
          <details className="editor-more-actions">
            <summary>References (optional)</summary>
            <p>
              These links show background material used during preparation. They are not required
              to publish and do not prove that a translation is correct.
            </p>
            <DraftReferenceManager draftId={draft.id} references={references} />
          </details>
        </section>
      </div>
      </main>
    </WorkspaceShell>
  )
}
