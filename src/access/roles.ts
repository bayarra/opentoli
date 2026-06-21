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

export const getRole = (user: unknown): Role | undefined => (user as UserWithRole | null)?.role

export const hasRole = (user: unknown, allowedRoles: readonly Role[]): boolean => {
  const role = getRole(user)

  return Boolean(role && allowedRoles.includes(role))
}

export const isAdmin = (user: unknown): boolean => getRole(user) === 'admin'

export const adminOnly: Access = ({ req }) => isAdmin(req.user)

export const adminFieldAccess: FieldAccess = ({ req }) => isAdmin(req.user)

export const moderatorFieldAccess: FieldAccess = ({ req }) =>
  hasRole(req.user, ['moderator', 'admin'])

export const editorialAccess: Access = ({ req }) => {
  return hasRole(req.user, ['reviewer', 'language_expert', 'moderator', 'admin'])
}

export const moderatorAccess: Access = ({ req }) => hasRole(req.user, ['moderator', 'admin'])

export const authenticated: Access = ({ req }) => Boolean(req.user)

export const canAccessAdmin = (user: unknown): boolean => {
  return hasRole(user, ['reviewer', 'language_expert', 'moderator', 'admin'])
}
