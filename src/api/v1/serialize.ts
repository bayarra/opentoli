import type {
  Category,
  Example,
  Source,
  Term,
  Translation,
} from '@/payload-types'

export const relationId = (value: unknown): number | null => {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'number' ? id : null
  }
  return null
}

export const safePublicUrl = (value?: string | null): string | null => {
  if (!value) return null

  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

export const categoryResource = (category: Category) => ({
  descriptionEn: category.descriptionEn || null,
  descriptionMn: category.descriptionMn || null,
  displayOrder: category.displayOrder,
  id: category.id,
  nameEn: category.nameEn,
  nameMn: category.nameMn,
  parentCategoryId: relationId(category.parentCategory),
  slug: category.slug,
  updatedAt: category.updatedAt,
})

export const translationResource = (translation: Translation) => ({
  explanationEn: translation.explanationEn || null,
  explanationMn: translation.explanationMn || null,
  id: translation.id,
  register: translation.register,
  reviewStatus: translation.reviewStatus,
  status: translation.status,
  translationMn: translation.translationMn,
  translationType: translation.translationType,
  updatedAt: translation.updatedAt,
  usageNote: translation.usageNote || null,
})

export const exampleResource = (example: Example) => ({
  contextId: relationId(example.context),
  exampleEn: example.exampleEn,
  exampleMn: example.exampleMn,
  id: example.id,
  reviewStatus: example.reviewStatus,
  referenceId: relationId(example.source),
  status: example.status,
  updatedAt: example.updatedAt,
})

export const referenceResource = (reference: Source) => {
  const url = safePublicUrl(reference.url)
  if (!url) return null

  return {
    id: reference.id,
    title: reference.title,
    updatedAt: reference.updatedAt,
    url,
  }
}

export const recommendedTranslationFor = (term: Term): Translation | null =>
  term.recommendedTranslation && typeof term.recommendedTranslation === 'object'
    ? term.recommendedTranslation
    : null

export const categoriesForTerm = (term: Term) =>
  (term.categories || []).flatMap((category) =>
    category && typeof category === 'object' ? [categoryResource(category as Category)] : [],
  )

export const termSummaryResource = (term: Term) => {
  const recommendedTranslation = recommendedTranslationFor(term)

  return {
    categories: categoriesForTerm(term),
    headwordEn: term.headwordEn,
    id: term.id,
    recommendedTranslationMn: recommendedTranslation?.translationMn || null,
    reviewStatus: term.reviewStatus,
    shortDefinitionEn: term.shortDefinitionEn,
    slug: term.slug,
    updatedAt: term.updatedAt,
    workflowStatus: term.workflowStatus,
  }
}

export const termDetailResource = (term: Term) => ({
  ...termSummaryResource(term),
  explanationEn: term.explanationEn,
  explanationMn: term.explanationMn,
  partOfSpeech: term.partOfSpeech || null,
  pronunciation: term.pronunciation || null,
  publishedAt: term.publishedAt || null,
  usageNoteEn: term.usageNoteEn || null,
  usageNoteMn: term.usageNoteMn || null,
})
