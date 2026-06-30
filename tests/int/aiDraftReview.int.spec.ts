import { enqueueGenerationJob, processGenerationJob } from '@/ai/pipeline/jobs'
import { DeterministicAIProvider } from '@/ai/providers/deterministic'
import {
  hideEditorDraft,
  parseEditorDraftFields,
  publishEditorDraft,
  saveEditorDraft,
  updateEditorDraftVisibility,
} from '@/editor/drafts'
import { getDraftInbox } from '@/editor/data'
import {
  addDraftSource,
  removeDraftSource,
  updateDraftSource,
  verifySource,
} from '@/editor/sources'
import { getPublicAIDraftById } from '@/lib/publicAIDrafts'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let payload: Payload
let admin: User
let editor: User
let contributor: User
let technologyCategoryId: number
const termIds: number[] = []
const translationIds: number[] = []
const sourceIds: number[] = []
const jobIds: number[] = []
const draftIds: number[] = []
const decisionIds: number[] = []
const reviewIds: number[] = []
const suffix = `${process.pid}-${Date.now()}`

const createPreparedDraft = async ({
  categoryId,
  categoryName,
  categorySlug,
  headword,
  sourceVerified = true,
}: {
  categoryId: number
  categoryName: string
  categorySlug: string
  headword: string
  sourceVerified?: boolean
}) => {
  const term = await payload.create({
    collection: 'terms',
    data: {
      categories: [categoryId],
      explanationEn: `Source container for ${headword}.`,
      explanationMn: `Source container for ${headword}.`,
      headwordEn: headword,
      reviewStatus: 'not_reviewed',
      shortDefinitionEn: `Source container for ${headword}.`,
      workflowStatus: 'needs_review',
    },
    draft: true,
    overrideAccess: true,
  })
  termIds.push(term.id)
  const source = await payload.create({
    collection: 'sources',
    data: {
      isVerified: sourceVerified,
      publisher: 'OpenToli Editor Tests',
      sourceType: 'official_documentation',
      term: term.id,
      title: `Editor source for ${headword}`,
      url: `https://example.com/${encodeURIComponent(headword)}`,
    },
    overrideAccess: true,
  })
  sourceIds.push(source.id)
  const provider = new DeterministicAIProvider()
  const queued = await enqueueGenerationJob({
    payload,
    preparation: {
      category: { id: categoryId, nameEn: categoryName, slug: categorySlug },
      headwordEn: headword,
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
  jobIds.push(queued.job.id)
  const result = await processGenerationJob({ jobId: queued.job.id, payload, provider })
  if (!result.draft) throw new Error('Editor test AI draft was not generated.')
  draftIds.push(result.draft.id)
  return result.draft
}

const collectAuditIds = async () => {
  const decisions = await payload.find({
    collection: 'ai-draft-decisions',
    depth: 0,
    limit: 200,
    overrideAccess: true,
    where: { aiDraft: { in: draftIds } },
  })
  for (const decision of decisions.docs) {
    if (!decisionIds.includes(decision.id)) decisionIds.push(decision.id)
    const translationId =
      typeof decision.resultingTranslation === 'number'
        ? decision.resultingTranslation
        : decision.resultingTranslation?.id
    if (translationId && !translationIds.includes(translationId)) translationIds.push(translationId)
  }
  const reviews = await payload.find({
    collection: 'reviews',
    depth: 0,
    limit: 200,
    overrideAccess: true,
    where: { reviewer: { equals: editor.id } },
  })
  reviewIds.push(...reviews.docs.map((review) => review.id))
}

describe('simple AI draft editor workflow', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    admin = await payload.create({
      collection: 'users',
      data: {
        email: `editor-admin-${suffix}@opentoli.local`,
        name: 'Editor Admin',
        password: `editor-admin-${suffix}-password`,
        role: 'admin',
      },
      overrideAccess: true,
    })
    const technology = await payload.create({
      collection: 'categories',
      data: {
        displayOrder: 996,
        isActive: true,
        nameEn: `Editor Technology ${suffix}`,
        nameMn: `Editor Technology ${suffix}`,
        slug: `editor-technology-${suffix}`,
      },
      overrideAccess: true,
    })
    technologyCategoryId = technology.id
    editor = await payload.create({
      collection: 'users',
      data: {
        email: `editor-${suffix}@opentoli.local`,
        name: 'Simple Editor',
        password: `editor-${suffix}-password`,
        role: 'reviewer',
      },
      overrideAccess: true,
    })
    contributor = await payload.create({
      collection: 'users',
      data: {
        email: `editor-contributor-${suffix}@opentoli.local`,
        name: 'Simple Member',
        password: `editor-contributor-${suffix}-password`,
        role: 'contributor',
      },
      overrideAccess: true,
    })
  })

  afterAll(async () => {
    await collectAuditIds()
    for (const id of decisionIds.reverse()) {
      await payload.delete({ collection: 'ai-draft-decisions', id, overrideAccess: true })
    }
    for (const id of reviewIds.reverse()) {
      await payload.delete({ collection: 'reviews', id, overrideAccess: true })
    }
    for (const id of draftIds.reverse()) {
      await payload.delete({ collection: 'ai-drafts', id, overrideAccess: true })
    }
    for (const id of jobIds.reverse()) {
      await payload.delete({ collection: 'generation-jobs', id, overrideAccess: true })
    }
    for (const id of sourceIds.reverse()) {
      await payload.delete({ collection: 'sources', id, overrideAccess: true }).catch(() => null)
    }
    for (const id of translationIds.reverse()) {
      await payload.delete({ collection: 'translations', id, overrideAccess: true })
    }
    for (const id of termIds.reverse()) {
      await payload.delete({ collection: 'terms', id, overrideAccess: true })
    }
    for (const id of [contributor.id, editor.id, admin.id]) {
      await payload.delete({ collection: 'users', id, overrideAccess: true })
    }
    await payload.delete({
      collection: 'categories',
      id: technologyCategoryId,
      overrideAccess: true,
    })
  })

  it('lets an Editor save direct field edits while members cannot edit', async () => {
    const draft = await createPreparedDraft({
      categoryId: technologyCategoryId,
      categoryName: `Editor Technology ${suffix}`,
      categorySlug: `editor-technology-${suffix}`,
      headword: `simple editing ${suffix}`,
    })
    const fields = parseEditorDraftFields({
      explanationEn: 'A human-edited English explanation.',
      explanationMn: 'A human-edited Mongolian explanation.',
      headwordEn: draft.inputHeadword,
      recommendedTranslationMn: `human edited translation ${suffix}`,
    })

    await expect(
      saveEditorDraft({ actorId: contributor.id, draftId: draft.id, fields, payload }),
    ).rejects.toThrow('Editor access')
    await payload.update({
      collection: 'ai-drafts',
      data: { publicVisibility: 'public' },
      id: draft.id,
      overrideAccess: true,
      user: admin,
    })
    const saved = await saveEditorDraft({ actorId: editor.id, draftId: draft.id, fields, payload })

    expect(saved.status).toBe('editing')
    expect(saved.modifiedFields).toMatchObject({
      recommendedTranslationMn: { to: `human edited translation ${suffix}` },
    })
    expect(validateSavedTranslation(saved.generatedPayload)).toBe(
      `human edited translation ${suffix}`,
    )
    expect((await getPublicAIDraftById(draft.id))?.recommendedTranslationMn).toBe(
      `human edited translation ${suffix}`,
    )
  })

  it('publishes with one human action and requires a verified safe source', async () => {
    const draft = await createPreparedDraft({
      categoryId: technologyCategoryId,
      categoryName: `Editor Technology ${suffix}`,
      categorySlug: `editor-technology-${suffix}`,
      headword: `simple publishing ${suffix}`,
    })

    await payload.update({
      collection: 'ai-drafts',
      data: { sources: [] },
      id: draft.id,
      overrideAccess: true,
    })

    await expect(
      publishEditorDraft({
        actorId: editor.id,
        draftId: draft.id,
        payload,
      }),
    ).rejects.toThrow('verify at least one safe')

    const unverifiedSource = await payload.update({
      collection: 'sources',
      data: { isVerified: false },
      id: sourceIds[sourceIds.length - 1]!,
      overrideAccess: true,
    })

    await payload.update({
      collection: 'ai-drafts',
      data: { sources: [unverifiedSource.id] },
      id: draft.id,
      overrideAccess: true,
    })

    await expect(
      publishEditorDraft({
        actorId: editor.id,
        draftId: draft.id,
        payload,
      }),
    ).rejects.toThrow('verify at least one safe')

    await verifySource({ actor: editor, payload, sourceId: unverifiedSource.id })

    const result = await publishEditorDraft({
      actorId: editor.id,
      draftId: draft.id,
      payload,
    })
    decisionIds.push(result.decision.id)
    translationIds.push(result.translation.id)
    expect(result.term).toMatchObject({
      _status: 'published',
      reviewStatus: 'human_reviewed',
      workflowStatus: 'approved',
    })
    expect(result.translation.status).toBe('approved')
    expect(result.draft.publicVisibility).toBe('private')

    const publicTerms = await payload.find({
      collection: 'terms',
      overrideAccess: false,
      where: { id: { equals: result.term.id } },
    })
    expect(publicTerms.docs).toHaveLength(1)
  })

  it('lets an Editor resolve an AI block by verifying evidence and publishing', async () => {
    const draft = await createPreparedDraft({
      categoryId: technologyCategoryId,
      categoryName: `Editor Technology ${suffix}`,
      categorySlug: `editor-technology-${suffix}`,
      headword: `human resolved block ${suffix}`,
      sourceVerified: false,
    })
    await payload.update({
      collection: 'ai-drafts',
      context: { aiDraftDecision: true },
      data: { reviewRoute: 'blocked' },
      id: draft.id,
      overrideAccess: true,
    })

    await expect(
      publishEditorDraft({ actorId: editor.id, draftId: draft.id, payload }),
    ).rejects.toThrow('verify at least one safe')

    await verifySource({ actor: editor, payload, sourceId: sourceIds[sourceIds.length - 1]! })
    const result = await publishEditorDraft({
      actorId: editor.id,
      draftId: draft.id,
      payload,
    })
    decisionIds.push(result.decision.id)
    translationIds.push(result.translation.id)

    expect(result.term._status).toBe('published')
    expect(result.draft.status).toBe('accepted')
    expect(result.decision.previousReviewRoute).toBe('blocked')
    expect(result.decision.newReviewRoute).toBe('blocked')
  })

  it('lets Editors open and close safe drafts for public feedback', async () => {
    const draft = await createPreparedDraft({
      categoryId: technologyCategoryId,
      categoryName: `Editor Technology ${suffix}`,
      categorySlug: `editor-technology-${suffix}`,
      headword: `public feedback visibility ${suffix}`,
    })

    expect(await getPublicAIDraftById(draft.id)).toBeNull()
    await expect(
      updateEditorDraftVisibility({
        actorId: contributor.id,
        draftId: draft.id,
        payload,
        visibility: 'public',
      }),
    ).rejects.toThrow('Editor access')

    const opened = await updateEditorDraftVisibility({
      actorId: editor.id,
      draftId: draft.id,
      payload,
      visibility: 'public',
    })
    expect(opened.publicVisibility).toBe('public')
    expect((await getPublicAIDraftById(draft.id))?.id).toBe(draft.id)

    const closed = await updateEditorDraftVisibility({
      actorId: editor.id,
      draftId: draft.id,
      payload,
      visibility: 'private',
    })
    expect(closed.publicVisibility).toBe('private')
    expect(await getPublicAIDraftById(draft.id)).toBeNull()
  })

  it('blocks public feedback for blocked drafts or unsafe sources', async () => {
    const blocked = await createPreparedDraft({
      categoryId: technologyCategoryId,
      categoryName: `Editor Technology ${suffix}`,
      categorySlug: `editor-technology-${suffix}`,
      headword: `blocked public feedback ${suffix}`,
    })
    await payload.update({
      collection: 'ai-drafts',
      context: { aiDraftDecision: true },
      data: { reviewRoute: 'blocked' },
      id: blocked.id,
      overrideAccess: true,
    })

    await expect(
      updateEditorDraftVisibility({
        actorId: editor.id,
        draftId: blocked.id,
        payload,
        visibility: 'public',
      }),
    ).rejects.toThrow('Blocked drafts')

    const unsafe = await createPreparedDraft({
      categoryId: technologyCategoryId,
      categoryName: `Editor Technology ${suffix}`,
      categorySlug: `editor-technology-${suffix}`,
      headword: `unsafe public feedback ${suffix}`,
    })
    const unsafeSource = await payload.create({
      collection: 'sources',
      data: {
        isVerified: false,
        publisher: 'OpenToli Editor Tests',
        sourceType: 'other',
        term: termIds[termIds.length - 1]!,
        title: `Unsafe public feedback source for ${suffix}`,
        url: 'javascript:alert(1)',
      },
      overrideAccess: true,
    })
    sourceIds.push(unsafeSource.id)
    await payload.update({
      collection: 'ai-drafts',
      data: { sources: [unsafeSource.id] },
      id: unsafe.id,
      overrideAccess: true,
    })

    await expect(
      updateEditorDraftVisibility({
        actorId: editor.id,
        draftId: unsafe.id,
        payload,
        visibility: 'public',
      }),
    ).rejects.toThrow('safe http or https source')
  })

  it('lets Editors verify draft sources while blocking members and unsafe URLs', async () => {
    await createPreparedDraft({
      categoryId: technologyCategoryId,
      categoryName: `Editor Technology ${suffix}`,
      categorySlug: `editor-technology-${suffix}`,
      headword: `source verification ${suffix}`,
      sourceVerified: false,
    })
    const sourceId = sourceIds[sourceIds.length - 1]!

    await expect(verifySource({ actor: contributor, payload, sourceId })).rejects.toThrow(
      'Editor access',
    )

    const verified = await verifySource({ actor: editor, payload, sourceId })
    expect(verified.isVerified).toBe(true)

    const repeated = await verifySource({ actor: editor, payload, sourceId })
    expect(repeated.isVerified).toBe(true)

    const unsafe = await payload.create({
      collection: 'sources',
      data: {
        isVerified: false,
        publisher: 'OpenToli Editor Tests',
        sourceType: 'other',
        term: termIds[termIds.length - 1]!,
        title: `Unsafe source for ${suffix}`,
        url: 'javascript:alert(1)',
      },
      overrideAccess: true,
    })
    sourceIds.push(unsafe.id)

    await expect(verifySource({ actor: editor, payload, sourceId: unsafe.id })).rejects.toThrow(
      'Only http and https',
    )
  })

  it('lets Editors add, edit, and remove draft sources', async () => {
    const draft = await createPreparedDraft({
      categoryId: technologyCategoryId,
      categoryName: `Editor Technology ${suffix}`,
      categorySlug: `editor-technology-${suffix}`,
      headword: `source management ${suffix}`,
      sourceVerified: false,
    })

    const fields = {
      publisher: 'OpenToli Managed Sources',
      sourceType: 'official_documentation' as const,
      title: `Managed source ${suffix}`,
      url: `https://example.com/managed-source-${suffix}`,
    }

    await expect(
      addDraftSource({
        actor: contributor,
        draftId: draft.id,
        fields,
        payload,
      }),
    ).rejects.toThrow('Editor access')

    const added = await addDraftSource({
      actor: editor,
      draftId: draft.id,
      fields,
      payload,
    })
    sourceIds.push(added.source.id)
    expect(added.source).toMatchObject({
      isVerified: false,
      publisher: fields.publisher,
      title: fields.title,
    })

    const updated = await updateDraftSource({
      actor: editor,
      draftId: draft.id,
      fields: {
        ...fields,
        publisher: 'OpenToli Updated Sources',
        title: `Updated managed source ${suffix}`,
      },
      payload,
      sourceId: added.source.id,
    })
    expect(updated).toMatchObject({
      isVerified: false,
      publisher: 'OpenToli Updated Sources',
      title: `Updated managed source ${suffix}`,
    })

    const removed = await removeDraftSource({
      actor: editor,
      draftId: draft.id,
      payload,
      sourceId: added.source.id,
    })
    expect(removed.sourceId).toBe(added.source.id)
    await expect(
      payload.findByID({
        collection: 'sources',
        id: added.source.id,
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })

  it('closes public feedback when the last safe source is removed', async () => {
    const draft = await createPreparedDraft({
      categoryId: technologyCategoryId,
      categoryName: `Editor Technology ${suffix}`,
      categorySlug: `editor-technology-${suffix}`,
      headword: `source removal closes public ${suffix}`,
    })
    const sourceId = sourceIds[sourceIds.length - 1]!

    const opened = await updateEditorDraftVisibility({
      actorId: editor.id,
      draftId: draft.id,
      payload,
      visibility: 'public',
    })
    expect(opened.publicVisibility).toBe('public')
    expect(await getPublicAIDraftById(draft.id)).not.toBeNull()

    const removed = await removeDraftSource({
      actor: editor,
      draftId: draft.id,
      payload,
      sourceId,
    })
    expect(removed.draft.publicVisibility).toBe('private')
    expect(await getPublicAIDraftById(draft.id)).toBeNull()
  })

  it('hides an unusable draft without deleting its provenance', async () => {
    const draft = await createPreparedDraft({
      categoryId: technologyCategoryId,
      categoryName: `Editor Technology ${suffix}`,
      categorySlug: `editor-technology-${suffix}`,
      headword: `simple hidden draft ${suffix}`,
    })
    await payload.update({
      collection: 'ai-drafts',
      data: { publicVisibility: 'public' },
      id: draft.id,
      overrideAccess: true,
      user: admin,
    })
    expect(await getPublicAIDraftById(draft.id)).not.toBeNull()

    const result = await hideEditorDraft({ actorId: editor.id, draftId: draft.id, payload })
    decisionIds.push(result.decision.id)
    expect(result.draft).toMatchObject({ publicVisibility: 'private', status: 'rejected' })
    expect(await getPublicAIDraftById(draft.id)).toBeNull()
    expect((await getDraftInbox(editor))?.some((item) => item.id === draft.id)).toBe(false)

    const retainedJob = await payload.findByID({
      collection: 'generation-jobs',
      id: jobIds[jobIds.length - 1]!,
      overrideAccess: true,
    })
    expect(retainedJob.generationRawOutput).toBeTruthy()
  })
})

const validateSavedTranslation = (value: unknown) => {
  if (!value || typeof value !== 'object' || !('recommendedTranslationMn' in value)) return null
  return (value as { recommendedTranslationMn: unknown }).recommendedTranslationMn
}
