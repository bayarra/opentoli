import { enqueueGenerationJob, processGenerationJob } from '../../src/ai/pipeline/jobs.js'
import { DeterministicAIProvider } from '../../src/ai/providers/deterministic.js'
import config from '../../src/payload.config.js'
import { getPayload } from 'payload'

export type AccessibilityDraftFixture = {
  categoryId: number
  draftId: number
  jobId: number
  sourceId: number
  termId: number
  user: {
    email: string
    id: number
    name: string
    password: string
  }
}

export async function seedAccessibilityDraft({
  sourceVerified = true,
}: {
  sourceVerified?: boolean
} = {}): Promise<AccessibilityDraftFixture> {
  const payload = await getPayload({ config })
  const suffix = `${process.pid}-${Date.now()}`
  const password = `accessible-editor-${suffix}`
  const user = await payload.create({
    collection: 'users',
    data: {
      email: `accessible-editor-${suffix}@opentoli.local`,
      name: 'Accessibility Editor',
      password,
      role: 'admin',
    },
    overrideAccess: true,
  })
  const category = await payload.create({
    collection: 'categories',
    data: {
      displayOrder: 995,
      isActive: true,
      nameEn: `Accessibility Technology ${suffix}`,
      nameMn: `Accessibility Technology ${suffix}`,
      slug: `accessibility-technology-${suffix}`,
    },
    overrideAccess: true,
  })
  const term = await payload.create({
    collection: 'terms',
    data: {
      categories: [category.id],
      explanationEn: 'A source container used by the accessibility browser tests.',
      explanationMn: 'A source container used by the accessibility browser tests.',
      headwordEn: `keyboard workflow ${suffix}`,
      reviewStatus: 'not_reviewed',
      shortDefinitionEn: 'A workflow that remains usable without a pointing device.',
      workflowStatus: 'needs_review',
    },
    draft: true,
    overrideAccess: true,
  })
  const source = await payload.create({
    collection: 'sources',
    data: {
      isVerified: sourceVerified,
      publisher: 'OpenToli Accessibility Tests',
      sourceType: 'official_documentation',
      term: term.id,
      title: 'Keyboard workflow source',
      url: 'https://example.com/accessibility-keyboard-workflow',
    },
    overrideAccess: true,
  })
  const provider = new DeterministicAIProvider()
  const queued = await enqueueGenerationJob({
    payload,
    preparation: {
      category: { id: category.id, nameEn: category.nameEn, slug: category.slug },
      headwordEn: term.headwordEn,
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
  const result = await processGenerationJob({ jobId: queued.job.id, payload, provider })
  if (!result.draft) throw new Error('The accessibility AI draft was not generated.')

  await payload.update({
    collection: 'ai-drafts',
    data: { publicVisibility: 'public' },
    id: result.draft.id,
    overrideAccess: true,
    user,
  })

  return {
    categoryId: category.id,
    draftId: result.draft.id,
    jobId: queued.job.id,
    sourceId: source.id,
    termId: term.id,
    user: { email: user.email, id: user.id, name: user.name, password },
  }
}

export async function cleanupAccessibilityDraft(fixture: AccessibilityDraftFixture) {
  const payload = await getPayload({ config })
  await payload.delete({
    collection: 'comments',
    overrideAccess: true,
    where: { aiDraft: { equals: fixture.draftId } },
  })
  await payload.delete({ collection: 'ai-drafts', id: fixture.draftId, overrideAccess: true })
  await payload.delete({ collection: 'generation-jobs', id: fixture.jobId, overrideAccess: true })
  await payload.delete({ collection: 'sources', id: fixture.sourceId, overrideAccess: true })
  await payload.delete({ collection: 'terms', id: fixture.termId, overrideAccess: true })
  await payload.delete({ collection: 'categories', id: fixture.categoryId, overrideAccess: true })
  await payload.delete({ collection: 'users', id: fixture.user.id, overrideAccess: true })
}
