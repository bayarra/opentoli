import { getCategoryWithPublishedTerms, getRecommendedTranslation } from '@/lib/publicTerms'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type CategoryPageProps = {
  params: Promise<{ slug: string }>
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const data = await getCategoryWithPublishedTerms(slug)

  if (!data) notFound()

  return (
    <main className="content-page">
      <Link className="back-link" href="/">
        Back to OpenToli
      </Link>
      <div className="page-heading">
        <p className="eyebrow">Category</p>
        <h1>{data.category.nameEn}</h1>
        <p lang="mn">{data.category.nameMn}</p>
        {data.category.descriptionEn ? <p>{data.category.descriptionEn}</p> : null}
      </div>

      {data.terms.length === 0 ? (
        <div className="empty-state">
          <h2>No published terms yet.</h2>
          <p>Reviewed terminology will appear here as it is approved.</p>
        </div>
      ) : null}

      <div className="result-list">
        {data.terms.map((term) => {
          const translation = getRecommendedTranslation(term)

          return (
            <Link className="result-card" href={`/terms/${term.slug}`} key={term.id}>
              <div>
                <span className="status-badge">{term.reviewStatus.replaceAll('_', ' ')}</span>
                <h2>{term.headwordEn}</h2>
                <p lang="mn">{translation?.translationMn || 'Translation pending'}</p>
              </div>
              <p>{term.shortDefinitionEn}</p>
            </Link>
          )
        })}
      </div>
    </main>
  )
}
