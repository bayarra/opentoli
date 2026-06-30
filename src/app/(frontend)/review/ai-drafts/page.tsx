import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Review Queue | OpenToli',
}

export default function DraftInboxRedirectPage() {
  redirect('/workspace/drafts')
}
