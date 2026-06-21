import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import { AI_SCHEMA_VERSION } from '../ai/schemas/v1'
import { editorialAccess, moderatorAccess } from '../access/roles'

export const GenerationJobs: CollectionConfig = {
  slug: 'generation-jobs',
  admin: {
    defaultColumns: ['inputHeadword', 'status', 'stage', 'attemptCount', 'updatedAt'],
    useAsTitle: 'inputHeadword',
  },
  access: {
    create: editorialAccess,
    delete: moderatorAccess,
    read: editorialAccess,
    update: editorialAccess,
  },
  fields: [
    { name: 'idempotencyKey', type: 'text', index: true, required: true, unique: true },
    { name: 'inputHeadword', type: 'text', index: true, required: true },
    { name: 'category', type: 'relationship', relationTo: 'categories', required: true },
    { name: 'context', type: 'relationship', relationTo: 'contexts' },
    { name: 'importBatch', type: 'relationship', relationTo: 'import-batches' },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'queued',
      index: true,
      options: ['queued', 'running', 'retry_scheduled', 'completed', 'failed', 'cancelled'],
      required: true,
    },
    {
      name: 'stage',
      type: 'select',
      defaultValue: 'research',
      index: true,
      options: ['research', 'generation', 'critique', 'validation', 'routing', 'complete'],
      required: true,
    },
    { name: 'attemptCount', type: 'number', defaultValue: 0, min: 0, required: true },
    { name: 'maxAttempts', type: 'number', defaultValue: 3, min: 1, required: true },
    { name: 'modelProvider', type: 'text', required: true },
    { name: 'modelName', type: 'text', required: true },
    { name: 'researchPromptVersion', type: 'text', required: true },
    { name: 'generationPromptVersion', type: 'text', required: true },
    { name: 'critiquePromptVersion', type: 'text', required: true },
    {
      name: 'schemaVersion',
      type: 'text',
      defaultValue: AI_SCHEMA_VERSION,
      required: true,
    },
    { name: 'inputPayload', type: 'json', required: true },
    { name: 'sourceInputSnapshot', type: 'json', required: true },
    { name: 'researchRawOutput', type: 'json' },
    { name: 'generationRawOutput', type: 'json' },
    { name: 'critiqueRawOutput', type: 'json' },
    { name: 'validationErrors', type: 'json' },
    { name: 'errorCode', type: 'text' },
    { name: 'errorMessage', type: 'textarea' },
    {
      name: 'queuedAt',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
      required: true,
    },
    { name: 'startedAt', type: 'date' },
    { name: 'completedAt', type: 'date' },
    { name: 'nextRetryAt', type: 'date' },
    { name: 'inputTokens', type: 'number', min: 0 },
    { name: 'outputTokens', type: 'number', min: 0 },
    { name: 'estimatedCostUsd', type: 'number', min: 0 },
    { name: 'latencyMs', type: 'number', min: 0 },
    { name: 'requestedBy', type: 'relationship', relationTo: 'users' },
  ],
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        const next = { ...originalDoc, ...data }

        if (next.schemaVersion !== AI_SCHEMA_VERSION) {
          throw new APIError(`Generation jobs must use schema version ${AI_SCHEMA_VERSION}.`, 400)
        }
        if (next.attemptCount > next.maxAttempts) {
          throw new APIError('Generation job attemptCount cannot exceed maxAttempts.', 400)
        }
        if (next.status === 'retry_scheduled') {
          if (!next.nextRetryAt) {
            throw new APIError('A retry-scheduled generation job requires nextRetryAt.', 400)
          }
          if (next.attemptCount >= next.maxAttempts) {
            throw new APIError(
              'A generation job with no attempts remaining cannot be retried.',
              400,
            )
          }
        }
        if (next.status === 'failed' && !next.errorMessage) {
          throw new APIError('A failed generation job requires an error message.', 400)
        }
        if (next.status === 'running' && !next.startedAt) {
          data.startedAt = new Date().toISOString()
        }
        if (next.status === 'completed') {
          const requiredOutputs = ['researchRawOutput', 'generationRawOutput', 'critiqueRawOutput']
          if (requiredOutputs.some((field) => !next[field])) {
            throw new APIError(
              'A completed generation job requires retained research, generation, and critique outputs.',
              400,
            )
          }
          data.stage = 'complete'
          data.completedAt = next.completedAt || new Date().toISOString()
        }

        return data
      },
    ],
  },
  timestamps: true,
}
