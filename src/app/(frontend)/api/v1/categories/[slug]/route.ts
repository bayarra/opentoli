import { apiNotFound, apiOk } from '@/api/v1/http'
import { categoryResource, termSummaryResource } from '@/api/v1/serialize'
import { getCategoryWithPublishedTerms } from '@/lib/publicTerms'

type RouteProps = { params: Promise<{ slug: string }> }

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: RouteProps) {
  const { slug } = await params
  const data = await getCategoryWithPublishedTerms(slug)

  if (!data) return apiNotFound('Category was not found.')

  return apiOk({
    category: categoryResource(data.category),
    terms: data.terms.map(termSummaryResource),
  })
}
