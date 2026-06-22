import type { AiDraft, User } from '@/payload-types'

import { getRole, type Role } from '../access/roles'

export const reviewActions = ['accept', 'modify', 'reject', 'reroute', 'merge'] as const
export type ReviewAction = (typeof reviewActions)[number]

export const relationshipId = (value: unknown): number | undefined => {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'number' ? id : undefined
  }
  return undefined
}

const editorialRoles: Role[] = ['reviewer', 'language_expert', 'moderator', 'admin']

export const isEditorialUser = (user: User | null | undefined): user is User =>
  Boolean(user?.isActive !== false && getRole(user) && editorialRoles.includes(getRole(user)!))

const hasCategoryExpertise = (user: User, categoryId: number): boolean =>
  (user.areasOfExpertise || []).some((category) => relationshipId(category) === categoryId)

export const assertCanReviewAIDraft = ({
  action,
  draft,
  user,
}: {
  action: ReviewAction
  draft: AiDraft
  user: User
}) => {
  if (!isEditorialUser(user)) throw new Error('Editorial reviewer access is required.')

  const role = getRole(user)!
  const isAdmin = role === 'admin'
  const isModerator = role === 'moderator'
  const categoryId = relationshipId(draft.inputCategory)
  const isDomainExpert = Boolean(categoryId && hasCategoryExpertise(user, categoryId))

  if (action === 'merge' && !isAdmin && !isModerator) {
    throw new Error('Only a moderator or administrator can merge a duplicate AI draft.')
  }
  if (action === 'merge') {
    if (draft.reviewRoute !== 'duplicate_review') {
      throw new Error('Reroute the AI draft to duplicate review before merging it.')
    }
    return
  }

  if (action === 'reroute') {
    if (!isAdmin && !isModerator) {
      throw new Error('Only a moderator or administrator can change a required review route.')
    }
    return
  }

  if (action === 'reject') return

  if (draft.reviewRoute === 'blocked') {
    throw new Error('A blocked AI draft must be rerouted or rejected before it can be accepted.')
  }
  if (draft.reviewRoute === 'duplicate_review') {
    throw new Error('A duplicate-review draft must be merged, rerouted, or rejected.')
  }
  if (draft.riskLevel === 'high' || draft.reviewRoute === 'domain_review') {
    if (!isAdmin && !isDomainExpert) {
      throw new Error('This draft requires a reviewer with expertise in its category.')
    }
    return
  }
  if (draft.reviewRoute === 'language_review' && role !== 'language_expert' && !isAdmin) {
    throw new Error('This draft requires a language expert.')
  }
  if (draft.reviewRoute === 'community_discussion' && !isAdmin && !isModerator) {
    throw new Error('A moderator must resolve a community-discussion draft.')
  }
}

export const assertSafeReroute = (draft: AiDraft, nextRoute: AiDraft['reviewRoute']) => {
  if (nextRoute === draft.reviewRoute) throw new Error('Choose a different review route.')
  if (
    draft.riskLevel === 'high' &&
    !['domain_review', 'duplicate_review', 'blocked'].includes(nextRoute)
  ) {
    throw new Error('A high-risk draft cannot be moved to a reduced review route.')
  }
  if (draft.reviewRoute === 'language_review' && nextRoute === 'fast_review') {
    throw new Error('A language-review draft cannot be downgraded to fast review.')
  }
}
