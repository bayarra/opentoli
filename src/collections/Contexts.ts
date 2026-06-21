import type { CollectionConfig } from 'payload'

import { editorialAccess } from '../access/roles'
import { formatSlug } from '../utilities/formatSlug'

export const Contexts: CollectionConfig = {
  slug: 'contexts',
  admin: {
    defaultColumns: ['nameEn', 'nameMn', 'slug', 'category'],
    useAsTitle: 'nameEn',
  },
  access: {
    create: editorialAccess,
    delete: editorialAccess,
    read: () => true,
    update: editorialAccess,
  },
  fields: [
    {
      name: 'nameEn',
      type: 'text',
      required: true,
    },
    {
      name: 'nameMn',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      index: true,
      required: true,
      unique: true,
      hooks: {
        beforeValidate: [
          ({ siblingData, value }) => value || formatSlug(String(siblingData?.nameEn || '')),
        ],
      },
    },
    {
      name: 'descriptionEn',
      type: 'textarea',
    },
    {
      name: 'descriptionMn',
      type: 'textarea',
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
    },
  ],
  defaultSort: 'nameEn',
  timestamps: true,
}
