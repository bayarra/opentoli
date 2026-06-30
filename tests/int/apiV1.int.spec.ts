import { enqueueGenerationJob, processGenerationJob } from '@/ai/pipeline/jobs'
import { DeterministicAIProvider } from '@/ai/providers/deterministic'
import { GET as categoryDetailApi } from '@/app/(frontend)/api/v1/categories/[slug]/route'
import { GET as categoriesApi } from '@/app/(frontend)/api/v1/categories/route'
import { GET as publicDraftApi } from '@/app/(frontend)/api/v1/drafts/[id]/route'
import { GET as publicDraftsApi } from '@/app/(frontend)/api/v1/drafts/route'
import { GET as editorWorkspaceApi } from '@/app/(frontend)/api/v1/editor/workspace/route'
import { GET as searchApi } from '@/app/(frontend)/api/v1/search/route'
import { GET as termApi } from '@/app/(frontend)/api/v1/terms/[slug]/route'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let payload: Payload
let admin: User
let categoryId: number
let termId: number
let translationId: number
let sourceId: number
let exampleId: number
let generationJobId: number
let aiDraftId: number
let termSlug: string
let categorySlug: string
let headword: string

const suffix = `${process.pid}-${Date.now()}`

type ApiJson = {
  data: Record<string, unknown>
  error?: Record<string, unknown>
  meta?: Record<string, unknown>
}

const readJson = async (response: Response) => response.json() as Promise<ApiJson>

const recordField = (json: ApiJson, field: string) => {
  const value = json.data[field]
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Expected API data.${field} to be an object.`)
  }
  return value as Record<string, unknown>
}

const arrayField = (json: ApiJson, field: string) => {
  const value = json.data[field]
  if (!Array.isArray(value)) throw new Error(`Expected API data.${field} to be an array.`)
  return value
}

describe('/api/v1 read contracts', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    admin = await payload.create({
      collection: 'users',
      data: {
        email: `api-v1-admin-${suffix}@opentoli.local`,
        name: 'API v1 Admin',
        password: `api-v1-admin-${suffix}-password`,
        role: 'admin',
      },
      overrideAccess: true,
    })

    const category = await payload.create({
      collection: 'categories',
      data: {
        displayOrder: 997,
        isActive: true,
        nameEn: `API v1 category ${suffix}`,
        nameMn: `API v1 category ${suffix}`,
        slug: `api-v1-category-${suffix}`,
      },
      overrideAccess: true,
    })
    categoryId = category.id
    categorySlug = category.slug

    headword = `api v1 published term ${suffix}`
    const term = await payload.create({
      collection: 'terms',
      data: {
        categories: [category.id],
        explanationEn: 'A published term for API contract tests.',
        explanationMn: 'API гэрээний тестэд зориулсан нийтэлсэн нэр томьёо.',
        headwordEn: headword,
        reviewStatus: 'human_reviewed',
        shortDefinitionEn: 'Used to verify API v1 public term reads.',
        workflowStatus: 'approved',
      },
      draft: true,
      overrideAccess: true,
    })
    termId = term.id
    termSlug = term.slug

    const translation = await payload.create({
      collection: 'translations',
      data: {
        register: 'general',
        reviewStatus: 'human_reviewed',
        status: 'approved',
        term: term.id,
        translationMn: `api v1 орчуулга ${suffix}`,
        translationType: 'recommended',
      },
      overrideAccess: true,
    })
    translationId = translation.id

    const source = await payload.create({
      collection: 'sources',
      data: {
        publisher: 'OpenToli Integration Tests',
        sourceType: 'official_documentation',
        term: term.id,
        title: 'API v1 fixture reference',
        url: 'https://example.com/opentoli-api-v1-fixture',
      },
      overrideAccess: true,
    })
    sourceId = source.id

    const example = await payload.create({
      collection: 'examples',
      data: {
        exampleEn: 'The API v1 fixture appears only in contract tests.',
        exampleMn: 'API v1 fixture нь зөвхөн гэрээний тестэд харагдана.',
        reviewStatus: 'human_reviewed',
        source: source.id,
        status: 'approved',
        term: term.id,
      },
      overrideAccess: true,
    })
    exampleId = example.id

    await payload.update({
      collection: 'terms',
      context: { trustedSeed: true },
      data: {
        _status: 'published',
        recommendedTranslation: translation.id,
      },
      draft: false,
      id: term.id,
      overrideAccess: true,
    })

    const provider = new DeterministicAIProvider()
    const queued = await enqueueGenerationJob({
      payload,
      preparation: {
        category: { id: category.id, nameEn: category.nameEn, slug: category.slug },
        headwordEn: `api v1 public draft ${suffix}`,
        sources: [
          {
            id: source.id,
            publisher: source.publisher,
            sourceType: source.sourceType,
            title: source.title,
            url: source.url,
          },
        ],
        termId: term.id,
      },
      provider,
    })
    generationJobId = queued.job.id

    const processed = await processGenerationJob({
      jobId: queued.job.id,
      payload,
      provider,
    })
    if (!processed.draft) throw new Error('The API v1 AI draft fixture was not generated.')
    aiDraftId = processed.draft.id

    await payload.update({
      collection: 'ai-drafts',
      data: { publicVisibility: 'public' },
      id: aiDraftId,
      overrideAccess: false,
      user: admin,
    })
  })

  afterAll(async () => {
    if (aiDraftId) {
      await payload.delete({ collection: 'ai-drafts', id: aiDraftId, overrideAccess: true })
    }
    if (generationJobId) {
      await payload.delete({
        collection: 'generation-jobs',
        id: generationJobId,
        overrideAccess: true,
      })
    }
    if (exampleId) {
      await payload.delete({ collection: 'examples', id: exampleId, overrideAccess: true })
    }
    if (sourceId) {
      await payload.delete({ collection: 'sources', id: sourceId, overrideAccess: true })
    }
    if (translationId) {
      await payload.delete({ collection: 'translations', id: translationId, overrideAccess: true })
    }
    if (termId) {
      await payload.delete({ collection: 'terms', id: termId, overrideAccess: true })
    }
    if (categoryId) {
      await payload.delete({ collection: 'categories', id: categoryId, overrideAccess: true })
    }
    if (admin?.id) {
      await payload.delete({ collection: 'users', id: admin.id, overrideAccess: true })
    }
  })

  it('returns stable public search, term, and category shapes', async () => {
    const searchResponse = await searchApi(
      new Request(`http://localhost/api/v1/search?q=${encodeURIComponent(headword)}`),
    )
    expect(searchResponse.status).toBe(200)
    const searchJson = await readJson(searchResponse)
    expect(searchJson.meta).toEqual({ apiVersion: 'v1' })
    const searchResults = arrayField(searchJson, 'results')
    expect(searchResults[0]).toMatchObject({
      headwordEn: headword,
      recommendedTranslationMn: `api v1 орчуулга ${suffix}`,
      slug: termSlug,
    })
    expect(searchResults[0]).not.toHaveProperty('normalizedHeadwordEn')

    const termResponse = await termApi(new Request(`http://localhost/api/v1/terms/${termSlug}`), {
      params: Promise.resolve({ slug: termSlug }),
    })
    expect(termResponse.status).toBe(200)
    const termJson = await readJson(termResponse)
    const term = recordField(termJson, 'term')
    const recommendedTranslation = recordField(termJson, 'recommendedTranslation')
    const examples = arrayField(termJson, 'examples')
    const references = arrayField(termJson, 'references')
    expect(term).toMatchObject({
      headwordEn: headword,
      reviewStatus: 'human_reviewed',
      slug: termSlug,
    })
    expect(recommendedTranslation.translationMn).toBe(`api v1 орчуулга ${suffix}`)
    expect(examples).toHaveLength(1)
    expect(references[0]).toMatchObject({
      title: 'API v1 fixture reference',
      url: 'https://example.com/opentoli-api-v1-fixture',
    })
    expect(term).not.toHaveProperty('createdBy')

    const categoriesResponse = await categoriesApi()
    expect(categoriesResponse.status).toBe(200)
    const categoriesJson = await readJson(categoriesResponse)
    expect(arrayField(categoriesJson, 'categories')).toEqual(
      expect.arrayContaining([expect.objectContaining({ slug: categorySlug })]),
    )

    const categoryResponse = await categoryDetailApi(
      new Request(`http://localhost/api/v1/categories/${categorySlug}`),
      { params: Promise.resolve({ slug: categorySlug }) },
    )
    expect(categoryResponse.status).toBe(200)
    const categoryJson = await readJson(categoryResponse)
    expect(recordField(categoryJson, 'category').slug).toBe(categorySlug)
    expect(arrayField(categoryJson, 'terms')).toEqual(
      expect.arrayContaining([expect.objectContaining({ slug: termSlug })]),
    )
  })

  it('returns only the redacted public AI draft projection', async () => {
    const draftsResponse = await publicDraftsApi()
    expect(draftsResponse.status).toBe(200)
    const draftsJson = await readJson(draftsResponse)
    expect(arrayField(draftsJson, 'drafts')).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: aiDraftId })]),
    )

    const draftResponse = await publicDraftApi(
      new Request(`http://localhost/api/v1/drafts/${aiDraftId}`),
      { params: Promise.resolve({ id: String(aiDraftId) }) },
    )
    expect(draftResponse.status).toBe(200)
    const draftJson = await readJson(draftResponse)
    const draft = recordField(draftJson, 'draft')
    expect(draft).toMatchObject({
      id: aiDraftId,
      reviewRoute: 'language_review',
    })
    expect(draft.references).toHaveLength(1)
    expect(draft).not.toHaveProperty('researchPayload')
    expect(draft).not.toHaveProperty('generatedPayload')
    expect(draft).not.toHaveProperty('critiquePayload')
    expect(draft).not.toHaveProperty('generationJob')
    expect(draft).not.toHaveProperty('modelName')
    expect(draft).not.toHaveProperty('promptVersion')
  })

  it('requires editor authentication for editor API reads', async () => {
    const response = await editorWorkspaceApi(new Request('http://localhost/api/v1/editor/workspace'))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'unauthenticated' },
      meta: { apiVersion: 'v1' },
    })
  })
})
