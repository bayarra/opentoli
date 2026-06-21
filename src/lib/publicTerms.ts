import config from '@/payload.config'
import type { Category, Example, Source, Term, Translation } from '@/payload-types'
import { getPayload, type Where } from 'payload'

const getPayloadClient = async () => getPayload({ config: await config })

export const getPublishedTermBySlug = async (slug: string) => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'terms',
    depth: 2,
    limit: 1,
    overrideAccess: false,
    where: { slug: { equals: slug } },
  })
  const term = result.docs[0]

  if (!term) return null

  const [translations, examples, sources] = await Promise.all([
    payload.find({
      collection: 'translations',
      depth: 1,
      limit: 100,
      overrideAccess: false,
      sort: 'createdAt',
      where: { term: { equals: term.id } },
    }),
    payload.find({
      collection: 'examples',
      depth: 1,
      limit: 100,
      overrideAccess: false,
      sort: 'createdAt',
      where: { term: { equals: term.id } },
    }),
    payload.find({
      collection: 'sources',
      depth: 1,
      limit: 100,
      overrideAccess: false,
      sort: 'createdAt',
      where: { term: { equals: term.id } },
    }),
  ])

  return {
    examples: examples.docs as Example[],
    sources: sources.docs as Source[],
    term: term as Term,
    translations: translations.docs as Translation[],
  }
}

export const searchPublishedTerms = async (query: string) => {
  const normalizedQuery = query.trim()
  if (!normalizedQuery) return []

  const payload = await getPayloadClient()
  const translationMatches = await payload.find({
    collection: 'translations',
    depth: 0,
    limit: 100,
    overrideAccess: false,
    where: { translationMn: { contains: normalizedQuery } },
  })
  const translationTermIds = translationMatches.docs.map((translation) =>
    typeof translation.term === 'object' ? translation.term.id : translation.term,
  )
  const orConditions: Where[] = [
    { headwordEn: { contains: normalizedQuery } },
    { normalizedHeadwordEn: { contains: normalizedQuery.toLocaleLowerCase('en-US') } },
    { shortDefinitionEn: { contains: normalizedQuery } },
    { explanationEn: { contains: normalizedQuery } },
    { explanationMn: { contains: normalizedQuery } },
  ]

  if (translationTermIds.length > 0) orConditions.push({ id: { in: translationTermIds } })

  const terms = await payload.find({
    collection: 'terms',
    depth: 2,
    limit: 50,
    overrideAccess: false,
    sort: 'headwordEn',
    where: { or: orConditions },
  })

  return terms.docs as Term[]
}

export const getCategoryWithPublishedTerms = async (slug: string) => {
  const payload = await getPayloadClient()
  const categories = await payload.find({
    collection: 'categories',
    depth: 1,
    limit: 1,
    overrideAccess: false,
    where: { slug: { equals: slug } },
  })
  const category = categories.docs[0]

  if (!category) return null

  const terms = await payload.find({
    collection: 'terms',
    depth: 2,
    limit: 100,
    overrideAccess: false,
    sort: 'headwordEn',
    where: { categories: { contains: category.id } },
  })

  return { category: category as Category, terms: terms.docs as Term[] }
}

export const getRecommendedTranslation = (term: Term): Translation | null => {
  return term.recommendedTranslation && typeof term.recommendedTranslation === 'object'
    ? term.recommendedTranslation
    : null
}
