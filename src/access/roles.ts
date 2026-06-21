import type { Access, FieldAccess } from 'payload'

export const roles = [
  'reader',
  'contributor',
  'reviewer',
  'language_expert',
  'moderator',
  'admin',
] as const

export type Role = (typeof roles)[number]

type UserWithRole = {
  id: number | string
  role?: Role
}

const getRole = (user: unknown): Role | undefined => (user as UserWithRole | null)?.role

export const isAdmin = (user: unknown): boolean => getRole(user) === 'admin'

export const adminOnly: Access = ({ req }) => isAdmin(req.user)

export const adminFieldAccess: FieldAccess = ({ req }) => isAdmin(req.user)

export const editorialAccess: Access = ({ req }) => {
  const role = getRole(req.user)

  return Boolean(role && ['reviewer', 'language_expert', 'moderator', 'admin'].includes(role))
}

export const authenticated: Access = ({ req }) => Boolean(req.user)

export const canAccessAdmin = (user: unknown): boolean => {
  const role = getRole(user)

  return Boolean(role && ['reviewer', 'language_expert', 'moderator', 'admin'].includes(role))
}
