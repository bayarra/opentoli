import { getRole, isEditor } from '@/access/roles'
import type { User } from '@/payload-types'

export const isEditorUser = (user: User | null | undefined): user is User =>
  Boolean(user?.isActive !== false && isEditor(user))

export const editorLabel = (user: User): string =>
  user.name || user.email || getRole(user) || 'Editor'

export const relationshipId = (value: unknown): number | undefined => {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'number' ? id : undefined
  }
  return undefined
}
