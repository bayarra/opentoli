import type { CollectionConfig } from 'payload'

import { editorialAccess, moderatorAccess } from '../access/roles'
import {
  calibrationDomainAssessments,
  calibrationEditLevels,
  calibrationGoNoGoRecommendations,
  calibrationLanguageAssessments,
  calibrationOutcomeValues,
} from '../calibration/options'

export const CalibrationOutcomes: CollectionConfig = {
  slug: 'calibration-outcomes',
  admin: {
    defaultColumns: ['headwordEn', 'outcome', 'editLevel', 'reviewedBy', 'reviewedAt'],
    useAsTitle: 'headwordEn',
  },
  access: {
    create: editorialAccess,
    delete: moderatorAccess,
    read: editorialAccess,
    update: editorialAccess,
  },
  fields: [
    { name: 'milestone', type: 'text', defaultValue: 'M5', index: true, required: true },
    {
      name: 'aiDraft',
      type: 'relationship',
      index: true,
      relationTo: 'ai-drafts',
      required: true,
    },
    {
      name: 'generationJob',
      type: 'relationship',
      index: true,
      relationTo: 'generation-jobs',
      required: true,
    },
    { name: 'term', type: 'relationship', index: true, relationTo: 'terms' },
    { name: 'headwordEn', type: 'text', index: true, required: true },
    {
      name: 'outcome',
      type: 'select',
      index: true,
      options: [...calibrationOutcomeValues],
      required: true,
    },
    {
      name: 'editLevel',
      type: 'select',
      defaultValue: 'not_checked',
      options: [...calibrationEditLevels],
      required: true,
    },
    {
      name: 'languageAssessment',
      type: 'select',
      defaultValue: 'not_checked',
      options: [...calibrationLanguageAssessments],
      required: true,
    },
    {
      name: 'domainAssessment',
      type: 'select',
      defaultValue: 'not_checked',
      options: [...calibrationDomainAssessments],
      required: true,
    },
    {
      name: 'goNoGoRecommendation',
      type: 'select',
      options: [...calibrationGoNoGoRecommendations],
    },
    { name: 'notes', type: 'textarea', required: true },
    { name: 'reviewedBy', type: 'relationship', index: true, relationTo: 'users', required: true },
    {
      name: 'reviewedAt',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
      index: true,
      required: true,
    },
    { name: 'modelProvider', type: 'text' },
    { name: 'modelName', type: 'text' },
    { name: 'promptVersion', type: 'text' },
    { name: 'schemaVersion', type: 'text' },
    { name: 'inputTokens', type: 'number', min: 0 },
    { name: 'outputTokens', type: 'number', min: 0 },
    { name: 'estimatedCostUsd', type: 'number', min: 0 },
    { name: 'latencyMs', type: 'number', min: 0 },
    { name: 'jobCompletedAt', type: 'date' },
  ],
  timestamps: true,
}
