import { apiOk } from '@/api/v1/http'
import { termSummaryResource } from '@/api/v1/serialize'
import { searchPublishedTerms } from '@/lib/publicTerms'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim() || ''
  const terms = query ? await searchPublishedTerms(query) : []

  return apiOk({
    query,
    results: terms.map(termSummaryResource),
  })
}
