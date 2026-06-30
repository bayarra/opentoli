import type { CollectionConfig } from 'payload'

import { editorialAccess, moderatorAccess } from '../access/roles'

export const ImportBatchItems: CollectionConfig = {
  slug: 'import-batch-items',
  admin: {
    defaultColumns: ['headwordEn', 'status', 'rowNumber', 'importBatch'],
    group: 'Maintenance',
    useAsTitle: 'headwordEn',
  },
  access: {
    create: editorialAccess,
    delete: moderatorAccess,
    read: editorialAccess,
    update: editorialAccess,
  },
  fields: [
    { name: 'importBatch', type: 'relationship', index: true, relationTo: 'import-batches', required: true },
    { name: 'rowNumber', type: 'number', min: 1, required: true },
    { name: 'headwordEn', type: 'text', index: true, required: true },
    { name: 'normalizedHeadwordEn', type: 'text', index: true, required: true },
    { name: 'contextNote', type: 'textarea' },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      index: true,
      options: ['pending', 'accepted', 'rejected', 'duplicate', 'queued'],
      required: true,
    },
    { name: 'validationMessages', type: 'json' },
    { name: 'term', type: 'relationship', relationTo: 'terms' },
    { name: 'generationJob', type: 'relationship', relationTo: 'generation-jobs' },
    { name: 'reviewedBy', type: 'relationship', relationTo: 'users' },
    { name: 'reviewedAt', type: 'date' },
    { name: 'createdBy', type: 'relationship', relationTo: 'users', required: true },
  ],
  timestamps: true,
}
