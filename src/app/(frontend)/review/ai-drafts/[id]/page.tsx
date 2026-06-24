import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

type EditorPageProps = { params: Promise<{ id: string }> }

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Edit AI Draft | OpenToli',
}

export default async function AIDraftEditorRedirectPage({ params }: EditorPageProps) {
  const { id } = await params
  redirect(`/workspace/drafts/${id}`)
}
