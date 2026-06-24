'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const primaryItems = [
  { href: '/workspace', label: 'Overview' },
  { href: '/workspace/drafts', label: 'Draft Inbox' },
  { href: '/workspace/feedback', label: 'Feedback' },
  { href: '/workspace/jobs', label: 'Agent Jobs' },
  { href: '/workspace/calibration', label: 'Calibration' },
] as const

const referenceItems = [
  { href: '/drafts', label: 'Public Drafts' },
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
