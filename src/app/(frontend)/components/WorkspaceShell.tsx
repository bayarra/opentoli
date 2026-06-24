import { WorkspaceNav } from '@/app/(frontend)/components/WorkspaceNav'
import type { ReactNode } from 'react'

export function WorkspaceShell({ children }: { children: ReactNode }) {
  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <WorkspaceNav />
      </aside>
      <div className="workspace-content">{children}</div>
    </div>
  )
}
