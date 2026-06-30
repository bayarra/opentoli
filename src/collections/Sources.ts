import type { CollectionConfig, Where } from 'payload'

import { editorialAccess, hasRole, moderatorAccess } from '../access/roles'

const publicReferenceAccess: Where = { 'term._status': { equals: 'published' } }

export const Sources: CollectionConfig = {
  slug: 'sources',
  admin: {
    defaultColumns: ['title', 'url', 'updatedAt'],
    description: 'Optional background links. References never approve or block terminology.',
    group: 'Maintenance',
    useAsTitle: 'title',
  },
  labels: { plural: 'References', singular: 'Reference' },
  access: {
    create: editorialAccess,
    delete: moderatorAccess,
    read: ({ req }) =>
      hasRole(req.user, ['reviewer', 'language_expert', 'moderator', 'admin'])
        ? true
        : publicReferenceAccess,
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
      name: 'translation',
      type: 'relationship',
      relationTo: 'translations',
    },
    { name: 'title', type: 'text', required: true },
    { name: 'publisher', type: 'text', required: true },
    { name: 'author', type: 'text' },
    { name: 'url', type: 'text', required: true },
    { name: 'publicationDate', type: 'date' },
    { name: 'accessedDate', type: 'date' },
    {
      name: 'sourceType',
      type: 'select',
      options: [
        'government',
        'standards_body',
        'official_documentation',
        'academic',
        'dictionary',
        'textbook',
        'professional_usage',
        'news',
        'community_discussion',
        'other',
      ],
      required: true,
    },
    { name: 'licenseNote', type: 'textarea' },
    { name: 'excerptNote', type: 'textarea' },
    { name: 'createdBy', type: 'relationship', relationTo: 'users' },
  ],
  timestamps: true,
}
