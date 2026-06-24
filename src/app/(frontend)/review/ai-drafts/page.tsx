import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Draft Inbox | OpenToli',
}

export default function DraftInboxRedirectPage() {
  redirect('/workspace/drafts')
}
