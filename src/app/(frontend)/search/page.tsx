import { getRecommendedTranslation, searchPublishedTerms } from '@/lib/publicTerms'
import Link from 'next/link'

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = '' } = await searchParams
  const terms = await searchPublishedTerms(q)

  return (
    <main className="content-page">
      <Link className="back-link" href="/">
        Back to OpenToli
      </Link>
      <div className="page-heading">
        <p className="eyebrow">Search</p>
        <h1>{q ? `Results for "${q}"` : 'Search OpenToli'}</h1>
        <p>
          Search published English headwords, Mongolian translations, and bilingual explanations.
        </p>
      </div>
      <form action="/search" className="search" role="search">
        <label className="sr-only" htmlFor="results-search">
          Search English or Mongolian terminology
        </label>
        <input defaultValue={q} id="results-search" name="q" type="search" />
        <button type="submit">Search</button>
      </form>

      {q && terms.length === 0 ? (
        <div className="empty-state">
          <h2>No published terms found.</h2>
          <p>Try a broader English or Mongolian search phrase.</p>
        </div>
      ) : null}

      <div className="result-list">
        {terms.map((term) => {
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
