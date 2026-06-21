import type { CollectionConfig, Where } from 'payload'

import { editorialAccess, hasRole, moderatorAccess } from '../access/roles'

const publicExampleAccess: Where = {
  and: [{ status: { equals: 'approved' } }, { 'term._status': { equals: 'published' } }],
}

export const Examples: CollectionConfig = {
  slug: 'examples',
  admin: {
    defaultColumns: ['exampleEn', 'status', 'reviewStatus'],
    useAsTitle: 'exampleEn',
  },
  access: {
    create: editorialAccess,
    delete: moderatorAccess,
    read: ({ req }) =>
      hasRole(req.user, ['reviewer', 'language_expert', 'moderator', 'admin'])
        ? true
        : publicExampleAccess,
    update: editorialAccess,
  },
  fields: [
    { name: 'term', type: 'relationship', index: true, relationTo: 'terms', required: true },
    { name: 'translation', type: 'relationship', relationTo: 'translations' },
    { name: 'exampleEn', type: 'textarea', required: true },
    { name: 'exampleMn', type: 'textarea', required: true },
    { name: 'context', type: 'relationship', relationTo: 'contexts' },
    { name: 'source', type: 'relationship', relationTo: 'sources' },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      index: true,
      options: ['draft', 'needs_review', 'approved', 'rejected'],
      required: true,
    },
    {
      name: 'reviewStatus',
      type: 'select',
      defaultValue: 'not_reviewed',
      options: ['not_reviewed', 'ai_draft', 'community_reviewed', 'human_reviewed', 'expert_reviewed'],
      required: true,
    },
    { name: 'createdBy', type: 'relationship', relationTo: 'users' },
  ],
  timestamps: true,
}
