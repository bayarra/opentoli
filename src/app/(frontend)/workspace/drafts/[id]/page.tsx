import { AIDraftEditorForm } from '@/app/(frontend)/components/AIDraftEditorForm'
import { SourceVerificationButton } from '@/app/(frontend)/components/SourceVerificationButton'
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

  const { comments, draft, generated, sources } = data
  const active = ['editing', 'needs_review'].includes(draft.status)

  return (
    <WorkspaceShell>
      <main className="content-page reviewer-page">
      <Link className="back-link" href="/workspace/drafts">
        Back to Draft Inbox
      </Link>
      <header className="reviewer-heading">
        <div>
          <p className="eyebrow">Edit AI Draft</p>
          <h1>{draft.inputHeadword}</h1>
          <p>{[data.category, data.context].filter(Boolean).join(' / ')}</p>
          <p>
            Edit the public wording here. Sources and community suggestions are shown below; raw
            AI evidence stays in the background.
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
          />
        ) : (
          <p>This draft is no longer active.</p>
        )}
      </section>

      <div className="reviewer-grid">
        <section className="review-panel">
          <p className="eyebrow">Sources</p>
          {sources.map((source) => (
            <article className="review-source" key={source.id}>
              <div>
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
              </div>
              {source.isVerified ? null : <SourceVerificationButton sourceId={source.id} />}
            </article>
          ))}
          {sources.length === 0 ? <p>No sources attached.</p> : null}
        </section>

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
      </div>
      </main>
    </WorkspaceShell>
  )
}
