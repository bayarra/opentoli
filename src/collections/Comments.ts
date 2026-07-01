import type { CollectionConfig, Where } from 'payload'
import { APIError } from 'payload'

import { authenticated, editorialAccess, hasRole, moderatorAccess } from '../access/roles'

const approvedComments: Where = { status: { equals: 'approved' } }
const contributionWindowMs = 10 * 60 * 1000
const maxContributionsPerWindow = 5

const relationshipId = (value: unknown): number | string | undefined => {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    if (typeof id === 'number' || typeof id === 'string') return id
  }
  return undefined
}

export const Comments: CollectionConfig = {
  slug: 'comments',
  admin: {
    defaultColumns: ['commentType', 'status', 'user', 'aiDraft', 'term', 'createdAt'],
    useAsTitle: 'body',
  },
  access: {
    create: authenticated,
    delete: moderatorAccess,
    read: ({ req }) => {
      if (hasRole(req.user, ['reviewer', 'language_expert', 'moderator', 'admin'])) return true
      if (req.user) {
        return { or: [approvedComments, { user: { equals: req.user.id } }] }
      }
      return approvedComments
    },
    update: editorialAccess,
  },
  fields: [
    { name: 'term', type: 'relationship', index: true, relationTo: 'terms' },
    { name: 'aiDraft', type: 'relationship', index: true, relationTo: 'ai-drafts' },
    { name: 'translation', type: 'relationship', relationTo: 'translations' },
    { name: 'parentComment', type: 'relationship', relationTo: 'comments' },
    { name: 'user', type: 'relationship', index: true, relationTo: 'users', required: true },
    { name: 'body', type: 'textarea', maxLength: 2000, minLength: 3, required: true },
    { name: 'suggestedTranslationMn', type: 'text', maxLength: 300 },
    { name: 'suggestedExampleEn', type: 'textarea', maxLength: 2000 },
    { name: 'suggestedExampleMn', type: 'textarea', maxLength: 2000 },
    { name: 'suggestedReferenceTitle', type: 'text', maxLength: 500 },
    { name: 'suggestedReferenceUrl', type: 'text', maxLength: 2000 },
    {
      name: 'commentType',
      type: 'select',
      defaultValue: 'general',
      options: [
        'general',
        'translation_suggestion',
        'example_suggestion',
        'usage_question',
        'reference_note',
      ],
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      index: true,
      options: ['pending', 'approved', 'rejected', 'spam', 'hidden'],
      required: true,
    },
    { name: 'moderatorNote', type: 'textarea' },
    { name: 'moderatedBy', type: 'relationship', relationTo: 'users' },
    { name: 'moderatedAt', type: 'date', admin: { readOnly: true } },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, originalDoc, req }) => {
        const next = { ...originalDoc, ...data }

        if (operation === 'create') {
          if (!req.user) throw new APIError('Authentication is required to contribute.', 401)
          if (req.user.isActive === false) throw new APIError('This account is inactive.', 403)

          const recentContributions = await req.payload.count({
            collection: 'comments',
            overrideAccess: true,
            req,
            where: {
              and: [
                { user: { equals: req.user.id } },
                {
                  createdAt: {
                    greater_than_equal: new Date(Date.now() - contributionWindowMs).toISOString(),
                  },
                },
              ],
            },
          })
          if (recentContributions.totalDocs >= maxContributionsPerWindow) {
            throw new APIError('Too many contributions. Please try again in a few minutes.', 429)
          }

          const duplicate = await req.payload.count({
            collection: 'comments',
            overrideAccess: true,
            req,
            where: {
              and: [
                { user: { equals: req.user.id } },
                { body: { equals: String(data.body || '').trim() } },
                { status: { in: ['pending', 'approved'] } },
              ],
            },
          })
          if (duplicate.totalDocs > 0) {
            throw new APIError('This contribution has already been submitted.', 409)
          }

          data.user = req.user.id
          data.status = 'approved'
          data.moderatedAt = null
          data.moderatedBy = null
          data.moderatorNote = null
        }

        const termId = relationshipId(next.term)
        const aiDraftId = relationshipId(next.aiDraft)
        if (Number(Boolean(termId)) + Number(Boolean(aiDraftId)) !== 1) {
          throw new APIError('A comment must target exactly one Term or AI Draft.', 400)
        }
        if (next.commentType === 'translation_suggestion' && !next.suggestedTranslationMn) {
          throw new APIError('A translation suggestion requires Mongolian wording.', 400)
        }
        if (
          operation === 'create' &&
          next.commentType === 'example_suggestion' &&
          (!next.suggestedExampleEn || !next.suggestedExampleMn)
        ) {
          throw new APIError('An example suggestion requires English and Mongolian text.', 400)
        }
        if (operation === 'create' && next.commentType === 'reference_note') {
          const hasStructuredReference = Boolean(
            next.suggestedReferenceTitle || next.suggestedReferenceUrl,
          )
          if (hasStructuredReference && (!next.suggestedReferenceTitle || !next.suggestedReferenceUrl)) {
            throw new APIError('A reference suggestion requires a title and URL.', 400)
          }
          if (hasStructuredReference) {
            try {
              const referenceUrl = new URL(next.suggestedReferenceUrl)
              if (!['http:', 'https:'].includes(referenceUrl.protocol)) throw new Error('unsafe')
              data.suggestedReferenceUrl = referenceUrl.toString()
            } catch {
              throw new APIError('Reference URL must use http or https.', 400)
            }
          }
        }

        if (operation === 'create' && aiDraftId) {
          const aiDraft = await req.payload.findByID({
            collection: 'ai-drafts',
            depth: 0,
            id: aiDraftId,
            overrideAccess: true,
            req,
          })
          if (
            aiDraft.publicVisibility !== 'public' ||
            !['editing', 'needs_review'].includes(aiDraft.status)
          ) {
            throw new APIError('This AI draft is not open for public feedback.', 403)
          }
        }

        if (operation === 'create' && termId) {
          const term = await req.payload.findByID({
            collection: 'terms',
            depth: 0,
            id: termId,
            overrideAccess: true,
            req,
          })
          if (term._status !== 'published') {
            throw new APIError('Only published Terms can receive public feedback.', 403)
          }
        }

        if (operation === 'update' && data.status && data.status !== originalDoc?.status) {
          if (data.status === 'pending') {
            data.moderatedAt = null
            data.moderatedBy = null
          } else {
            data.moderatedAt = new Date().toISOString()
            data.moderatedBy = req.user?.id
          }
        }

        return data
      },
    ],
  },
  timestamps: true,
}
