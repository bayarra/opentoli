import { apiNotFound, apiOk } from '@/api/v1/http'
import {
  exampleResource,
  recommendedTranslationFor,
  referenceResource,
  termDetailResource,
  translationResource,
} from '@/api/v1/serialize'
import { getPublishedTermBySlug } from '@/lib/publicTerms'

type RouteProps = { params: Promise<{ slug: string }> }

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: RouteProps) {
  const { slug } = await params
  const data = await getPublishedTermBySlug(slug)

  if (!data) return apiNotFound('Published term was not found.')

  const recommendedTranslation = recommendedTranslationFor(data.term)
  const alternatives = data.translations.filter(
    (translation) => translation.id !== recommendedTranslation?.id,
  )

  return apiOk({
    alternatives: alternatives.map(translationResource),
    examples: data.examples.map(exampleResource),
    recommendedTranslation: recommendedTranslation
      ? translationResource(recommendedTranslation)
      : null,
    references: data.references.flatMap((reference) => {
      const resource = referenceResource(reference)
      return resource ? [resource] : []
    }),
    term: termDetailResource(data.term),
  })
}
