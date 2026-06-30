export const calibrationOutcomeValues = [
  'accepted_as_is',
  'accepted_with_edits',
  'needs_regeneration',
  'duplicate',
  'rejected',
] as const

export const calibrationEditLevels = ['none', 'minor', 'major', 'rewrite', 'not_checked'] as const

export const calibrationLanguageAssessments = [
  'natural',
  'minor_edits',
  'major_edits',
  'not_checked',
] as const

export const calibrationDomainAssessments = [
  'accurate',
  'needs_expert_review',
  'incorrect',
  'not_checked',
] as const

export const calibrationGoNoGoRecommendations = [
  'continue',
  'tune_prompt',
  'pause_batch',
  'not_ready',
] as const
