import Link from 'next/link'

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = '' } = await searchParams

  return (
    <main className="search-page">
      <Link href="/">Back to OpenToli</Link>
      <p className="eyebrow">Search</p>
      <h1>{q ? `Results for "${q}"` : 'Search OpenToli'}</h1>
      <p>
        The bilingual search index will become available after the editorial term model is in
        place. The public interface is ready for that data source.
      </p>
      <form action="/search" className="search" role="search">
        <label className="sr-only" htmlFor="results-search">
          Search English or Mongolian terminology
        </label>
        <input defaultValue={q} id="results-search" name="q" type="search" />
        <button type="submit">Search</button>
      </form>
    </main>
  )
}
