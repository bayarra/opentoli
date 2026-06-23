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
    <main className="site-shell">
      <section className="hero">
        <p className="eyebrow">English to Mongolian terminology</p>
        <h1>Clear language for modern ideas.</h1>
        <p className="hero-copy">
          Find sourced, human-reviewed Mongolian translations for technology, science, finance,
          law, medicine, and professional life.
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
        <div className="hero-actions" aria-label="Primary workflow links">
          <Link href="/workflow">How OpenToli works</Link>
          <Link href="/workspace">Editor workspace</Link>
        </div>
        <p className="hero-note">
          AI prepares the research. Contributors suggest improvements. Editors publish the final
          wording from OpenToli web.
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
          <strong>Web-first workflow</strong>
          <span>Editors and contributors work in OpenToli pages, not the admin panel.</span>
        </div>
      </section>

      <section className="workflow-strip" aria-labelledby="workflow-summary">
        <div>
          <p className="eyebrow">What should I do?</p>
          <h2 id="workflow-summary">Use the web app for the terminology workflow.</h2>
          <p>
            Visitors search and read. Members comment on public drafts. Editors open the Draft
            Inbox, edit four fields, then choose Publish or Hide. Payload admin is only for system
            maintenance and emergency data checks.
          </p>
        </div>
        <div className="workflow-actions">
          <Link href="/drafts">Review public drafts</Link>
          <Link href="/workflow">Full workflow</Link>
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
              <span aria-hidden="true">View terms -&gt;</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mongolian-callout">
        <p lang="mn">
          Modern Mongolian terminology should be clear, sourced, and built together.
        </p>
        <span>Modern terminology, built clearly and collaboratively.</span>
      </section>
    </main>
  )
}
