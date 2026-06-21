import Link from 'next/link'
import { notFound } from 'next/navigation'

const categoryNames: Record<string, string> = {
  'ai-data-science': 'Artificial Intelligence & Data Science',
  'finance-economics': 'Finance & Economics',
  'law-government': 'Law & Government',
  'medicine-health': 'Medicine & Health',
  'technology-software': 'Technology & Software',
}

type CategoryPageProps = {
  params: Promise<{ slug: string }>
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const name = categoryNames[slug]

  if (!name) notFound()

  return (
    <main className="search-page">
      <Link href="/">← OpenToli</Link>
      <p className="eyebrow">Category</p>
      <h1>{name}</h1>
      <p>
        Reviewed terminology will appear here after the editorial data model and calibration
        batch are complete.
      </p>
    </main>
  )
}
