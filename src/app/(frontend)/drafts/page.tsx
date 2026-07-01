import { getPublicAIDrafts } from '@/lib/publicAIDrafts'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  description: 'Public unverified AI drafts open for community feedback.',
  robots: { follow: true, index: false },
  title: 'Community Review | OpenToli',
}

export const dynamic = 'force-dynamic'

export default async function PublicDraftsPage() {
  const drafts = await getPublicAIDrafts()

  return (
    <main className="content-page">
      <div className="page-heading">
        <p className="eyebrow">Community review</p>
        <h1>Unverified AI drafts open for feedback.</h1>
        <p>
          Editors opened these unverified drafts to gather community input. Signed-in members can
          post comments and suggestions immediately; Editors decide what becomes canonical later.
        </p>
      </div>

      {drafts.length === 0 ? (
        <div className="empty-state">
          <h2>No drafts are open for community review right now.</h2>
          <p>
            Editors can open drafts for feedback from the Review Queue. Until then,
            contributors can search published terms or read the workflow guide.
          </p>
          <div className="empty-actions">
            <Link href="/search">Search terms</Link>
            <Link href="/workflow">Read workflow</Link>
          </div>
        </div>
      ) : null}

      <div className="result-list">
        {drafts.map((draft) => (
          <Link className="result-card" href={`/drafts/${draft.id}`} key={draft.id}>
            <div>
              <span className="status-badge">Unverified AI Draft</span>
              <h2>{draft.headwordEn}</h2>
              <p lang="mn">{draft.recommendedTranslationMn}</p>
            </div>
            <p>
              {[draft.category, `Updated ${draft.updatedAt.slice(0, 10)}`]
                .filter(Boolean)
                .join(' / ')}
            </p>
          </Link>
        ))}
      </div>
    </main>
  )
}
