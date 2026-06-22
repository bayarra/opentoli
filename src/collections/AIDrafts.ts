import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import {
  AI_SCHEMA_VERSION,
  confidenceLevels,
  reviewRoutes,
  riskLevels,
  validateCritiqueOutputV1,
  validateGenerationOutputV1,
  validateResearchPacketV1,
} from '../ai/schemas/v1'
import { editorFieldAccess, editorialAccess, moderatorAccess } from '../access/roles'

const completeDraftStatuses = [
  'generated',
  'needs_review',
  'accepted',
  'partially_accepted',
  'rejected',
]

export const AIDrafts: CollectionConfig = {
  slug: 'ai-drafts',
  admin: {
    defaultColumns: ['inputHeadword', 'status', 'riskLevel', 'reviewRoute', 'updatedAt'],
    useAsTitle: 'inputHeadword',
  },
  access: {
    create: editorialAccess,
    delete: moderatorAccess,
    read: editorialAccess,
    update: editorialAccess,
  },
  fields: [
    { name: 'term', type: 'relationship', index: true, relationTo: 'terms' },
    {
      name: 'generationJob',
      type: 'relationship',
      index: true,
      relationTo: 'generation-jobs',
      required: true,
      unique: true,
    },
    { name: 'inputHeadword', type: 'text', index: true, required: true },
    { name: 'inputCategory', type: 'relationship', relationTo: 'categories', required: true },
    { name: 'inputContext', type: 'relationship', relationTo: 'contexts' },
    { name: 'sources', type: 'relationship', hasMany: true, relationTo: 'sources' },
    { name: 'researchPayload', type: 'json', required: true },
    { name: 'generatedPayload', type: 'json', required: true },
    { name: 'critiquePayload', type: 'json', required: true },
    {
      name: 'schemaVersion',
      type: 'text',
      defaultValue: AI_SCHEMA_VERSION,
      required: true,
    },
    { name: 'modelProvider', type: 'text', required: true },
    { name: 'modelName', type: 'text', required: true },
    { name: 'promptVersion', type: 'text', required: true },
    {
      name: 'confidenceDimensions',
      type: 'group',
      fields: [
        ...[
          'conceptUnderstanding',
          'translationNaturalness',
          'domainAccuracy',
          'sourceSupport',
          'ambiguity',
        ].map((name) => ({
          name,
          type: 'select' as const,
          options: [...confidenceLevels],
          required: true,
        })),
      ],
    },
    {
      name: 'riskLevel',
      type: 'select',
      index: true,
      options: [...riskLevels],
      required: true,
    },
    {
      name: 'reviewRoute',
      type: 'select',
      index: true,
      options: [...reviewRoutes],
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'generated',
      index: true,
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
    { name: 'generatedBy', type: 'text', required: true },
    {
      name: 'publicVisibility',
      type: 'select',
      access: {
        create: editorFieldAccess,
        update: editorFieldAccess,
      },
      defaultValue: 'private',
      index: true,
      options: ['private', 'public'],
      required: true,
    },
    {
      name: 'publicFeedbackOpenedAt',
      type: 'date',
      admin: { readOnly: true },
    },
    { name: 'reviewedBy', type: 'relationship', relationTo: 'users' },
    {
      name: 'reviewOutcome',
      type: 'select',
      options: ['accepted', 'modified', 'rejected', 'merged'],
    },
    { name: 'acceptedFields', type: 'json' },
    { name: 'modifiedFields', type: 'json' },
    { name: 'rejectionReasons', type: 'json' },
    { name: 'decidedAt', type: 'date', admin: { readOnly: true } },
    { name: 'mergedIntoTerm', type: 'relationship', relationTo: 'terms' },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, originalDoc, req }) => {
        const next = { ...originalDoc, ...data }
        const statusChanged =
          operation === 'update' && data.status && data.status !== originalDoc?.status
        const routeChanged =
          operation === 'update' &&
          data.reviewRoute &&
          data.reviewRoute !== originalDoc?.reviewRoute

        const resolvedStatuses = ['accepted', 'partially_accepted', 'rejected']
        if (
          (routeChanged ||
            (statusChanged &&
              (resolvedStatuses.includes(data.status) ||
                resolvedStatuses.includes(originalDoc?.status)))) &&
          req.context.aiDraftDecision !== true
        ) {
          throw new APIError('Use the reviewer workspace to resolve or reroute an AI draft.', 403)
        }

        if (next.schemaVersion !== AI_SCHEMA_VERSION) {
          throw new APIError(`AI drafts must use schema version ${AI_SCHEMA_VERSION}.`, 400)
        }

        try {
          validateResearchPacketV1(next.researchPayload)
          validateGenerationOutputV1(next.generatedPayload)
          validateCritiqueOutputV1(next.critiquePayload)
        } catch (error) {
          throw new APIError(error instanceof Error ? error.message : 'Invalid AI output.', 400)
        }

        if (completeDraftStatuses.includes(next.status)) {
          const required = ['researchPayload', 'generatedPayload', 'critiquePayload']
          if (required.some((field) => !next[field])) {
            throw new APIError(
              'A completed AI draft requires research, generation, and critique payloads.',
              400,
            )
          }
        }

        if (['accepted', 'partially_accepted', 'rejected'].includes(next.status)) {
          if (!next.reviewedBy || !next.reviewOutcome || !next.decidedAt) {
            throw new APIError(
              'A resolved AI draft requires a reviewer, outcome, and decision timestamp.',
              400,
            )
          }
        }

        if (next.publicVisibility === 'public') {
          if (!['editing', 'needs_review'].includes(next.status)) {
            throw new APIError('Only active AI drafts can be opened for public feedback.', 400)
          }
          if (next.reviewRoute === 'blocked') {
            throw new APIError('Blocked AI drafts cannot be opened for public feedback.', 400)
          }
          if (!Array.isArray(next.sources) || next.sources.length === 0) {
            throw new APIError('A sourced AI draft is required for public feedback.', 400)
          }
          if (originalDoc?.publicVisibility !== 'public') {
            data.publicFeedbackOpenedAt = new Date().toISOString()
          }
        }

        if (operation === 'create') {
          const generationJobId =
            typeof next.generationJob === 'object' ? next.generationJob.id : next.generationJob
          const generationJob = await req.payload.findByID({
            collection: 'generation-jobs',
            id: generationJobId,
            overrideAccess: true,
            req,
          })
          if (generationJob.status !== 'completed') {
            throw new APIError(
              'An AI draft can only be created from a completed generation job.',
              400,
            )
          }
        }

        return data
      },
    ],
  },
  timestamps: true,
}
