import type { CollectionConfig, Where } from 'payload'

import { editorialAccess, hasRole, moderatorAccess } from '../access/roles'

const publicTranslationAccess: Where = {
  and: [{ status: { equals: 'approved' } }, { 'term._status': { equals: 'published' } }],
}

export const Translations: CollectionConfig = {
  slug: 'translations',
  admin: {
    defaultColumns: ['translationMn', 'translationType', 'status', 'reviewStatus'],
    useAsTitle: 'translationMn',
  },
  access: {
    create: editorialAccess,
    delete: moderatorAccess,
    read: ({ req }) =>
      hasRole(req.user, ['reviewer', 'language_expert', 'moderator', 'admin'])
        ? true
        : publicTranslationAccess,
    update: editorialAccess,
  },
  fields: [
    {
      name: 'term',
      type: 'relationship',
      index: true,
      relationTo: 'terms',
      required: true,
    },
    {
      name: 'translationMn',
      type: 'text',
      index: true,
      required: true,
    },
    {
      name: 'translationType',
      type: 'select',
      defaultValue: 'alternative',
      options: [
        'recommended',
        'alternative',
        'context_specific',
        'formal',
        'informal',
        'literal',
        'rejected',
        'deprecated',
      ],
      required: true,
    },
    {
      name: 'context',
      type: 'relationship',
      relationTo: 'contexts',
    },
    {
      name: 'register',
      type: 'select',
      defaultValue: 'general',
      options: ['general', 'formal', 'informal', 'technical', 'academic', 'legal', 'medical', 'business'],
      required: true,
    },
    {
      name: 'explanationEn',
      type: 'textarea',
    },
    {
      name: 'explanationMn',
      type: 'textarea',
    },
    {
      name: 'usageNote',
      type: 'textarea',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      index: true,
      options: ['draft', 'needs_review', 'approved', 'rejected', 'deprecated'],
      required: true,
    },
    {
      name: 'reviewStatus',
      type: 'select',
      defaultValue: 'not_reviewed',
      options: ['not_reviewed', 'ai_draft', 'community_reviewed', 'human_reviewed', 'expert_reviewed'],
      required: true,
    },
    {
      name: 'voteScore',
      type: 'number',
      admin: { readOnly: true },
      defaultValue: 0,
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
  ],
  timestamps: true,
}
