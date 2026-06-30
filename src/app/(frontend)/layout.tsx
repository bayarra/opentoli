import React from 'react'
import './styles.css'
import { AccountNav } from '@/app/(frontend)/components/AccountNav'
import Link from 'next/link'

export const metadata = {
  description:
    'Find clear, human-reviewed Mongolian translations for modern English terminology.',
  title: 'OpenToli | English-to-Mongolian terminology',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html data-scroll-behavior="smooth" lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <header className="site-header app-header">
          <div className="site-header-inner">
            <Link className="brand" href="/" aria-label="OpenToli home">
              <span className="brand-mark" aria-hidden="true">
                OT
              </span>
              <span>OpenToli</span>
            </Link>
            <nav aria-label="Primary navigation">
              <Link href="/">Home</Link>
              <Link href="/search">Search</Link>
              <Link href="/workflow">Workflow</Link>
              <Link href="/drafts">Public drafts</Link>
              <AccountNav />
            </nav>
          </div>
        </header>
        <div id="main-content">{children}</div>
        <footer className="site-footer">
          <span>OpenToli</span>
          <span>Use OpenToli web for search, feedback, and editorial review.</span>
        </footer>
      </body>
    </html>
  )
}
