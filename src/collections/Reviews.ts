import type { CollectionConfig } from 'payload'

import { editorialAccess, moderatorAccess } from '../access/roles'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    defaultColumns: ['term', 'reviewType', 'decision', 'reviewer'],
  },
  access: {
    create: editorialAccess,
    delete: moderatorAccess,
    read: editorialAccess,
    update: moderatorAccess,
  },
  fields: [
    { name: 'term', type: 'relationship', index: true, relationTo: 'terms', required: true },
    { name: 'translation', type: 'relationship', relationTo: 'translations' },
    { name: 'reviewer', type: 'relationship', relationTo: 'users', required: true },
    {
      name: 'reviewType',
      type: 'select',
      options: ['linguistic', 'technical', 'editorial', 'source_validation', 'final_approval'],
      required: true,
    },
    {
      name: 'decision',
      type: 'select',
      options: ['approved', 'changes_requested', 'rejected'],
      required: true,
    },
    { name: 'notes', type: 'textarea' },
  ],
  timestamps: true,
}
