import type { CollectionConfig } from 'payload'

import { adminFieldAccess, adminOnly, canAccessAdmin, isAdmin, roles } from '../access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: ({ req }) => canAccessAdmin(req.user),
    create: async ({ req }) => {
      if (req.user) return isAdmin(req.user)

      const existingUsers = await req.payload.count({ collection: 'users', overrideAccess: true })
      return existingUsers.totalDocs === 0
    },
    delete: adminOnly,
    read: ({ req }) =>
      isAdmin(req.user) ? true : req.user ? { id: { equals: req.user.id } } : false,
    update: ({ req }) =>
      isAdmin(req.user) ? true : req.user ? { id: { equals: req.user.id } } : false,
  },
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      access: {
        create: adminFieldAccess,
        update: adminFieldAccess,
      },
      defaultValue: 'contributor',
      index: true,
      options: roles.map((role) => ({ label: role.replace('_', ' '), value: role })),
      required: true,
    },
    {
      name: 'bio',
      type: 'textarea',
    },
    {
      name: 'areasOfExpertise',
      type: 'relationship',
      hasMany: true,
      relationTo: 'categories',
    },
    {
      name: 'isActive',
      type: 'checkbox',
      access: {
        create: adminFieldAccess,
        update: adminFieldAccess,
      },
      defaultValue: true,
      index: true,
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data

        const result = await req.payload.count({ collection: 'users', overrideAccess: true })
        const isPublicRegistration = req.context.publicRegistration === true

        if (isPublicRegistration) {
          data.isActive = true
          data.role = 'contributor'
        } else if (result.totalDocs === 0) {
          data.isActive = true
          data.role = 'admin'
        }

        return data
      },
    ],
  },
}
