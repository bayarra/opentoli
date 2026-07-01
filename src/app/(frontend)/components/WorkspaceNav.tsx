'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const primaryItems = [
  { href: '/workspace', label: 'Overview' },
  { href: '/workspace/drafts', label: 'Review Queue' },
  { href: '/workspace/terms', label: 'Published Terms' },
  { href: '/workspace/feedback', label: 'Community' },
  { href: '/workspace/imports', label: 'Imports' },
  { href: '/workspace/calibration', label: 'AI Quality' },
  { href: '/workspace/jobs', label: 'System Activity' },
] as const

const referenceItems = [
  { href: '/drafts', label: 'Community Review' },
  { href: '/workflow', label: 'Workflow Guide' },
  { href: '/admin', label: 'Admin Maintenance' },
] as const

const isActivePath = (pathname: string, href: string) =>
  href === '/workspace' ? pathname === href : pathname.startsWith(href)

export function WorkspaceNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Workspace navigation" className="workspace-nav">
      <div className="workspace-nav-heading">
        <span>Workspace</span>
        <small>Editor tools</small>
      </div>

      <div className="workspace-nav-section">
        {primaryItems.map((item) => (
          <Link
            aria-current={isActivePath(pathname, item.href) ? 'page' : undefined}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="workspace-nav-section workspace-nav-secondary">
        {referenceItems.map((item) => (
          <Link href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
