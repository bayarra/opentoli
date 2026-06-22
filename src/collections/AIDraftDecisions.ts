import type { CollectionConfig } from 'payload'

import { editorialAccess } from '../access/roles'
import { reviewActions } from '../review/permissions'

export const AIDraftDecisions: CollectionConfig = {
  slug: 'ai-draft-decisions',
  admin: {
    defaultColumns: [
      'aiDraft',
      'action',
      'actor',
      'previousReviewRoute',
      'newReviewRoute',
      'decisionAt',
    ],
  },
  access: {
    create: () => false,
    delete: () => false,
    read: editorialAccess,
    update: () => false,
  },
  fields: [
    { name: 'aiDraft', type: 'relationship', index: true, relationTo: 'ai-drafts', required: true },
    { name: 'actor', type: 'relationship', index: true, relationTo: 'users', required: true },
    {
      name: 'action',
      type: 'select',
      index: true,
      options: [...reviewActions],
      required: true,
    },
    {
      name: 'previousStatus',
      type: 'select',
      options: [
        'generated',
        'editing',
        'needs_review',
        'accepted',
        'partially_accepted',
        'rejected',
      ],
      required: true,
    },
    {
      name: 'newStatus',
      type: 'select',
      options: [
        'generated',
        'editing',
        'needs_review',
        'accepted',
        'partially_accepted',
        'rejected',
      ],
      required: true,
    },
    {
      name: 'previousReviewRoute',
      type: 'select',
      options: [
        'fast_review',
        'language_review',
        'domain_review',
        'community_discussion',
        'duplicate_review',
        'blocked',
      ],
      required: true,
    },
    {
      name: 'newReviewRoute',
      type: 'select',
      options: [
        'fast_review',
        'language_review',
        'domain_review',
        'community_discussion',
        'duplicate_review',
        'blocked',
      ],
      required: true,
    },
    { name: 'riskLevel', type: 'select', options: ['low', 'medium', 'high'], required: true },
    { name: 'selectedTranslationMn', type: 'text' },
    { name: 'acceptedFields', type: 'json' },
    { name: 'modifiedFields', type: 'json' },
    { name: 'rejectionReasons', type: 'json' },
    { name: 'notes', type: 'textarea', required: true },
    { name: 'resultingTerm', type: 'relationship', relationTo: 'terms' },
    { name: 'resultingTranslation', type: 'relationship', relationTo: 'translations' },
    { name: 'mergeTargetTerm', type: 'relationship', relationTo: 'terms' },
    { name: 'decisionAt', type: 'date', index: true, required: true },
  ],
  timestamps: true,
}
