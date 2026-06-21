import type { CollectionConfig } from 'payload'

import { editorialAccess } from '../access/roles'
import { formatSlug } from '../utilities/formatSlug'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    defaultColumns: ['nameEn', 'nameMn', 'slug', 'isActive'],
    useAsTitle: 'nameEn',
  },
  access: {
    create: editorialAccess,
    delete: editorialAccess,
    read: ({ req }) => (req.user ? true : { isActive: { equals: true } }),
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
      name: 'parentCategory',
      type: 'relationship',
      relationTo: 'categories',
    },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
      index: true,
      required: true,
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      index: true,
    },
  ],
  defaultSort: 'displayOrder',
  timestamps: true,
}
