import Link from 'next/link'

const categories = [
  { name: 'Technology & Software', slug: 'technology-software' },
  { name: 'Artificial Intelligence & Data Science', slug: 'ai-data-science' },
  { name: 'Finance & Economics', slug: 'finance-economics' },
  { name: 'Law & Government', slug: 'law-government' },
  { name: 'Medicine & Health', slug: 'medicine-health' },
]

export default function HomePage() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <Link className="brand" href="/" aria-label="OpenToli home">
          <span className="brand-mark" aria-hidden="true">
            OT
          </span>
          <span>OpenToli</span>
        </Link>
        <nav aria-label="Primary navigation">
          <a href="#categories">Categories</a>
          <Link href="/admin">Editorial</Link>
          <Link className="nav-cta" href="/admin">
            Contribute
          </Link>
        </nav>
      </header>

      <main>
        <section className="hero">
          <p className="eyebrow">English to Mongolian terminology</p>
          <h1>Clear language for modern ideas.</h1>
          <p className="hero-copy">
            Find sourced, human-reviewed Mongolian translations for technology, science,
            finance, law, medicine, and professional life.
          </p>
          <form action="/search" className="search" role="search">
            <label className="sr-only" htmlFor="home-search">
              Search English or Mongolian terminology
            </label>
            <input
              id="home-search"
              name="q"
              placeholder="Search an English term or Mongolian translation..."
              type="search"
            />
            <button type="submit">Search</button>
          </form>
          <p className="hero-note">
            AI prepares the research. People make the final terminology decisions.
          </p>
        </section>

        <section className="trust-strip" aria-label="OpenToli editorial principles">
          <div>
            <strong>Source-grounded</strong>
            <span>Evidence stays attached to every important term.</span>
          </div>
          <div>
            <strong>Human reviewed</strong>
            <span>AI drafts never publish themselves.</span>
          </div>
          <div>
            <strong>Context aware</strong>
            <span>Translations can change across fields and uses.</span>
          </div>
        </section>

        <section className="categories" id="categories">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Explore by field</p>
              <h2>Start with the language you use at work.</h2>
            </div>
            <p>Five launch categories will open first as reviewed terminology becomes available.</p>
          </div>
          <div className="category-grid">
            {categories.map((category, index) => (
              <Link href={`/categories/${category.slug}`} key={category.slug}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{category.name}</strong>
                <span aria-hidden="true">View terms →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mongolian-callout">
          <p lang="mn">Орчин үеийн нэр томьёог ойлгомжтой, эх сурвалжтай, хамтдаа бүтээнэ.</p>
          <span>Modern terminology, built clearly and collaboratively.</span>
        </section>
      </main>

      <footer>
        <span>OpenToli</span>
        <span>Building a trusted English-to-Mongolian terminology commons.</span>
      </footer>
    </div>
  )
}
