import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import { editorialAccess, hasRole, moderatorAccess } from '../access/roles'
import { formatSlug } from '../utilities/formatSlug'

const humanReviewStatuses = ['human_reviewed', 'expert_reviewed'] as const

export const Terms: CollectionConfig = {
  slug: 'terms',
  admin: {
    defaultColumns: ['headwordEn', 'workflowStatus', 'reviewStatus', '_status'],
    useAsTitle: 'headwordEn',
  },
  access: {
    create: editorialAccess,
    delete: moderatorAccess,
    read: ({ req }) =>
      hasRole(req.user, ['reviewer', 'language_expert', 'moderator', 'admin'])
        ? true
        : { _status: { equals: 'published' } },
    update: editorialAccess,
  },
  defaultSort: 'headwordEn',
  fields: [
    {
      name: 'headwordEn',
      type: 'text',
      index: true,
      required: true,
    },
    {
      name: 'normalizedHeadwordEn',
      type: 'text',
      admin: { readOnly: true },
      index: true,
      required: true,
      unique: true,
    },
    {
      name: 'slug',
      type: 'text',
      index: true,
      required: true,
      unique: true,
    },
    {
      name: 'partOfSpeech',
      type: 'select',
      options: ['noun', 'verb', 'adjective', 'adverb', 'phrase', 'acronym', 'other'],
    },
    {
      name: 'pronunciation',
      type: 'text',
    },
    {
      name: 'shortDefinitionEn',
      type: 'textarea',
      required: true,
    },
    {
      name: 'explanationEn',
      type: 'textarea',
      required: true,
    },
    {
      name: 'explanationMn',
      type: 'textarea',
      required: true,
    },
    {
      name: 'usageNoteEn',
      type: 'textarea',
    },
    {
      name: 'usageNoteMn',
      type: 'textarea',
    },
    {
      name: 'workflowStatus',
      type: 'select',
      defaultValue: 'draft',
      index: true,
      options: ['draft', 'needs_review', 'needs_discussion', 'reviewed', 'approved', 'archived'],
      required: true,
    },
    {
      name: 'reviewStatus',
      type: 'select',
      defaultValue: 'not_reviewed',
      index: true,
      options: [
        'not_reviewed',
        'ai_draft',
        'community_reviewed',
        'human_reviewed',
        'expert_reviewed',
      ],
      required: true,
    },
    {
      name: 'categories',
      type: 'relationship',
      hasMany: true,
      relationTo: 'categories',
      required: true,
    },
    {
      name: 'contexts',
      type: 'relationship',
      hasMany: true,
      relationTo: 'contexts',
    },
    {
      name: 'recommendedTranslation',
      type: 'relationship',
      relationTo: 'translations',
    },
    {
      name: 'relatedTerms',
      type: 'relationship',
      hasMany: true,
      relationTo: 'terms',
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'reviewedBy',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'approvedBy',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: { readOnly: true },
      index: true,
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, originalDoc, req }) => {
        if (data._status !== 'published') return data

        const nextDocument = { ...originalDoc, ...data }
        const isTrustedSeed = req.context?.trustedSeed === true
        const canPublish = hasRole(req.user, ['moderator', 'admin']) || isTrustedSeed

        if (!canPublish) {
          throw new APIError('Only a moderator or administrator can publish a term.', 403)
        }

        if (nextDocument.workflowStatus !== 'approved') {
          throw new APIError('A term must be approved before publication.', 400)
        }

        if (!humanReviewStatuses.includes(nextDocument.reviewStatus)) {
          throw new APIError('A term requires human or expert review before publication.', 400)
        }

        if (!nextDocument.recommendedTranslation) {
          throw new APIError('A recommended translation is required before publication.', 400)
        }

        if (!isTrustedSeed && (!nextDocument.reviewedBy || !nextDocument.approvedBy)) {
          throw new APIError('Reviewer and approver attribution are required before publication.', 400)
        }

        data.publishedAt = data.publishedAt || originalDoc?.publishedAt || new Date().toISOString()
        return data
      },
    ],
    beforeValidate: [
      ({ data }) => {
        if (!data?.headwordEn) return data

        data.normalizedHeadwordEn = data.headwordEn.trim().toLocaleLowerCase('en-US')
        data.slug = data.slug || formatSlug(data.headwordEn)
        return data
      },
    ],
  },
  timestamps: true,
  versions: {
    drafts: {
      autosave: false,
    },
    maxPerDoc: 50,
  },
}
