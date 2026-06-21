import type { CollectionConfig } from 'payload'

import { editorialAccess, moderatorAccess } from '../access/roles'

export const ImportBatches: CollectionConfig = {
  slug: 'import-batches',
  admin: {
    defaultColumns: ['name', 'status', 'sourceTitle', 'createdAt'],
    useAsTitle: 'name',
  },
  access: {
    create: editorialAccess,
    delete: moderatorAccess,
    read: editorialAccess,
    update: editorialAccess,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'sourceTitle', type: 'text', required: true },
    { name: 'sourceUrl', type: 'text' },
    { name: 'category', type: 'relationship', relationTo: 'categories' },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      index: true,
      options: ['pending', 'validating', 'processing', 'completed', 'completed_with_errors', 'failed'],
      required: true,
    },
    { name: 'promptVersion', type: 'text' },
    { name: 'modelName', type: 'text' },
    { name: 'schemaVersion', type: 'text' },
    { name: 'totalRows', type: 'number', defaultValue: 0 },
    { name: 'acceptedRows', type: 'number', defaultValue: 0 },
    { name: 'rejectedRows', type: 'number', defaultValue: 0 },
    { name: 'duplicateRows', type: 'number', defaultValue: 0 },
    { name: 'validationReport', type: 'json' },
    { name: 'createdBy', type: 'relationship', relationTo: 'users' },
  ],
  timestamps: true,
}
