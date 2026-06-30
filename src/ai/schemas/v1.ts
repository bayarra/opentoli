export const AI_SCHEMA_VERSION = '1.0.0' as const

export const confidenceLevels = ['low', 'medium', 'high'] as const
export const riskLevels = ['low', 'medium', 'high'] as const
export const reviewRoutes = [
  'fast_review',
  'language_review',
  'domain_review',
  'community_discussion',
  'duplicate_review',
  'blocked',
] as const

type ConfidenceLevel = (typeof confidenceLevels)[number]
type RiskLevel = (typeof riskLevels)[number]
type ReviewRoute = (typeof reviewRoutes)[number]
type Assessment = 'pass' | 'warning' | 'fail'

export type ConfidenceDimensions = {
  ambiguity: ConfidenceLevel
  conceptUnderstanding: ConfidenceLevel
  domainAccuracy: ConfidenceLevel
  sourceSupport: ConfidenceLevel
  translationNaturalness: ConfidenceLevel
}

export type ResearchPacketV1 = {
  schemaVersion: typeof AI_SCHEMA_VERSION
  headwordEn: string
  canonicalMeaning: string
  partOfSpeech?: string
  acronymExpansion?: string
  domainMeanings: string[]
  confusedTerms: string[]
  existingMongolianUsage: Array<{
    wording: string
    sourceId?: number
    note?: string
  }>
  ambiguities: string[]
  reviewerQuestions: string[]
  sourceIds: number[]
}

export type GenerationOutputV1 = {
  schemaVersion: typeof AI_SCHEMA_VERSION
  headwordEn: string
  recommendedTranslationMn: string
  alternativeTranslations: Array<{
    translationMn: string
    type: 'alternative' | 'context_specific' | 'formal' | 'literal' | 'borrowed' | 'rejected'
    context?: string
    usageNote?: string
    rejectionReason?: string
  }>
  explanationEn: string
  explanationMn: string
  categories: string[]
  contexts: string[]
  examples: Array<{ exampleEn: string; exampleMn: string }>
  relatedTerms: string[]
  searchKeywords: string[]
  reviewerQuestions: string[]
  confidenceDimensions: ConfidenceDimensions
  riskLevel: RiskLevel
  reviewRoute: ReviewRoute
  humanReviewRequired: true
}

export type CritiqueOutputV1 = {
  schemaVersion: typeof AI_SCHEMA_VERSION
  summary: string
  checks: {
    semanticAccuracy: { assessment: Assessment; notes: string[] }
    mongolianNaturalness: { assessment: Assessment; notes: string[] }
    literalTranslationArtifacts: { assessment: Assessment; notes: string[] }
    terminologyConflicts: { assessment: Assessment; notes: string[] }
    unsupportedClaims: { assessment: Assessment; notes: string[] }
    sourceQuality: { assessment: Assessment; notes: string[] }
  }
  requiredExpertise: Array<'language' | 'domain' | 'source_validation'>
  recommendedRiskLevel: RiskLevel
  recommendedReviewRoute: ReviewRoute
  blockingIssues: string[]
}

export class AIOutputValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Invalid AI output: ${issues.join('; ')}`)
    this.name = 'AIOutputValidationError'
  }
}

type JsonRecord = Record<string, unknown>

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const validateString = (record: JsonRecord, key: string, issues: string[], path = ''): void => {
  if (typeof record[key] !== 'string' || record[key].trim().length === 0) {
    issues.push(`${path}${key} must be a non-empty string`)
  }
}

const validateStringArray = (
  record: JsonRecord,
  key: string,
  issues: string[],
  path = '',
): void => {
  const value = record[key]
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    issues.push(`${path}${key} must be an array of strings`)
  }
}

const validateEnum = (
  value: unknown,
  allowed: readonly string[],
  path: string,
  issues: string[],
): void => {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    issues.push(`${path} must be one of: ${allowed.join(', ')}`)
  }
}

const validateVersion = (record: JsonRecord, issues: string[]): void => {
  if (record.schemaVersion !== AI_SCHEMA_VERSION) {
    issues.push(`schemaVersion must equal ${AI_SCHEMA_VERSION}`)
  }
}

const finishValidation = <T>(value: unknown, issues: string[]): T => {
  if (issues.length > 0) throw new AIOutputValidationError(issues)
  return value as T
}

export const validateResearchPacketV1 = (value: unknown): ResearchPacketV1 => {
  if (!isRecord(value)) throw new AIOutputValidationError(['research packet must be an object'])

  const issues: string[] = []
  validateVersion(value, issues)
  validateString(value, 'headwordEn', issues)
  validateString(value, 'canonicalMeaning', issues)
  validateStringArray(value, 'domainMeanings', issues)
  validateStringArray(value, 'confusedTerms', issues)
  validateStringArray(value, 'ambiguities', issues)
  validateStringArray(value, 'reviewerQuestions', issues)

  if (!Array.isArray(value.sourceIds) || value.sourceIds.some((item) => !Number.isInteger(item))) {
    issues.push('sourceIds must be an array of integer IDs')
  }

  if (!Array.isArray(value.existingMongolianUsage)) {
    issues.push('existingMongolianUsage must be an array')
  } else {
    value.existingMongolianUsage.forEach((item, index) => {
      if (!isRecord(item)) {
        issues.push(`existingMongolianUsage[${index}] must be an object`)
        return
      }
      validateString(item, 'wording', issues, `existingMongolianUsage[${index}].`)
      if (item.sourceId !== undefined && !Number.isInteger(item.sourceId)) {
        issues.push(`existingMongolianUsage[${index}].sourceId must be an integer`)
      }
    })
  }

  return finishValidation<ResearchPacketV1>(value, issues)
}

export const validateGenerationOutputV1 = (value: unknown): GenerationOutputV1 => {
  if (!isRecord(value)) throw new AIOutputValidationError(['generation output must be an object'])

  const issues: string[] = []
  validateVersion(value, issues)
  validateString(value, 'headwordEn', issues)
  validateString(value, 'recommendedTranslationMn', issues)
  validateString(value, 'explanationEn', issues)
  validateString(value, 'explanationMn', issues)
  for (const key of [
    'categories',
    'contexts',
    'relatedTerms',
    'searchKeywords',
    'reviewerQuestions',
  ]) {
    validateStringArray(value, key, issues)
  }

  if (!Array.isArray(value.alternativeTranslations)) {
    issues.push('alternativeTranslations must be an array')
  } else {
    value.alternativeTranslations.forEach((item, index) => {
      if (!isRecord(item)) {
        issues.push(`alternativeTranslations[${index}] must be an object`)
        return
      }
      validateString(item, 'translationMn', issues, `alternativeTranslations[${index}].`)
      validateEnum(
        item.type,
        ['alternative', 'context_specific', 'formal', 'literal', 'borrowed', 'rejected'],
        `alternativeTranslations[${index}].type`,
        issues,
      )
    })
  }

  if (!Array.isArray(value.examples)) {
    issues.push('examples must be an array')
  } else {
    value.examples.forEach((item, index) => {
      if (!isRecord(item)) {
        issues.push(`examples[${index}] must be an object`)
        return
      }
      validateString(item, 'exampleEn', issues, `examples[${index}].`)
      validateString(item, 'exampleMn', issues, `examples[${index}].`)
    })
  }

  if (!isRecord(value.confidenceDimensions)) {
    issues.push('confidenceDimensions must be an object')
  } else {
    for (const key of [
      'ambiguity',
      'conceptUnderstanding',
      'domainAccuracy',
      'sourceSupport',
      'translationNaturalness',
    ]) {
      validateEnum(
        value.confidenceDimensions[key],
        confidenceLevels,
        `confidenceDimensions.${key}`,
        issues,
      )
    }
  }

  validateEnum(value.riskLevel, riskLevels, 'riskLevel', issues)
  validateEnum(value.reviewRoute, reviewRoutes, 'reviewRoute', issues)
  if (value.humanReviewRequired !== true) issues.push('humanReviewRequired must be true')

  return finishValidation<GenerationOutputV1>(value, issues)
}

export const validateCritiqueOutputV1 = (value: unknown): CritiqueOutputV1 => {
  if (!isRecord(value)) throw new AIOutputValidationError(['critique output must be an object'])

  const issues: string[] = []
  validateVersion(value, issues)
  validateString(value, 'summary', issues)
  validateStringArray(value, 'blockingIssues', issues)

  if (!isRecord(value.checks)) {
    issues.push('checks must be an object')
  } else {
    for (const key of [
      'semanticAccuracy',
      'mongolianNaturalness',
      'literalTranslationArtifacts',
      'terminologyConflicts',
      'unsupportedClaims',
      'sourceQuality',
    ]) {
      const check = value.checks[key]
      if (!isRecord(check)) {
        issues.push(`checks.${key} must be an object`)
        continue
      }
      validateEnum(
        check.assessment,
        ['pass', 'warning', 'fail'],
        `checks.${key}.assessment`,
        issues,
      )
      validateStringArray(check, 'notes', issues, `checks.${key}.`)
    }
  }

  if (!Array.isArray(value.requiredExpertise)) {
    issues.push('requiredExpertise must be an array')
  } else {
    value.requiredExpertise.forEach((item, index) =>
      validateEnum(
        item,
        ['language', 'domain', 'source_validation'],
        `requiredExpertise[${index}]`,
        issues,
      ),
    )
  }
  validateEnum(value.recommendedRiskLevel, riskLevels, 'recommendedRiskLevel', issues)
  validateEnum(value.recommendedReviewRoute, reviewRoutes, 'recommendedReviewRoute', issues)

  return finishValidation<CritiqueOutputV1>(value, issues)
}

const stringArraySchema = { items: { type: 'string' }, type: 'array' } as const

export const researchPacketSchemaV1 = {
  $id: 'https://opentoli.org/schemas/ai/research-packet/1.0.0',
  additionalProperties: false,
  properties: {
    schemaVersion: { const: AI_SCHEMA_VERSION },
    headwordEn: { minLength: 1, type: 'string' },
    canonicalMeaning: { minLength: 1, type: 'string' },
    partOfSpeech: { type: 'string' },
    acronymExpansion: { type: 'string' },
    domainMeanings: stringArraySchema,
    confusedTerms: stringArraySchema,
    existingMongolianUsage: {
      items: {
        additionalProperties: false,
        properties: {
          wording: { minLength: 1, type: 'string' },
          sourceId: { type: 'integer' },
          note: { type: 'string' },
        },
        required: ['wording'],
        type: 'object',
      },
      type: 'array',
    },
    ambiguities: stringArraySchema,
    reviewerQuestions: stringArraySchema,
    sourceIds: { items: { type: 'integer' }, type: 'array' },
  },
  required: [
    'schemaVersion',
    'headwordEn',
    'canonicalMeaning',
    'domainMeanings',
    'confusedTerms',
    'existingMongolianUsage',
    'ambiguities',
    'reviewerQuestions',
    'sourceIds',
  ],
  type: 'object',
} as const

export const generationOutputSchemaV1 = {
  $id: 'https://opentoli.org/schemas/ai/generation-output/1.0.0',
  additionalProperties: false,
  properties: {
    schemaVersion: { const: AI_SCHEMA_VERSION },
    headwordEn: { minLength: 1, type: 'string' },
    recommendedTranslationMn: { minLength: 1, type: 'string' },
    alternativeTranslations: {
      items: {
        additionalProperties: false,
        properties: {
          translationMn: { minLength: 1, type: 'string' },
          type: {
            enum: ['alternative', 'context_specific', 'formal', 'literal', 'borrowed', 'rejected'],
          },
          context: { type: 'string' },
          usageNote: { type: 'string' },
          rejectionReason: { type: 'string' },
        },
        required: ['translationMn', 'type'],
        type: 'object',
      },
      type: 'array',
    },
    explanationEn: { minLength: 1, type: 'string' },
    explanationMn: { minLength: 1, type: 'string' },
    categories: stringArraySchema,
    contexts: stringArraySchema,
    examples: {
      items: {
        additionalProperties: false,
        properties: {
          exampleEn: { minLength: 1, type: 'string' },
          exampleMn: { minLength: 1, type: 'string' },
        },
        required: ['exampleEn', 'exampleMn'],
        type: 'object',
      },
      type: 'array',
    },
    relatedTerms: stringArraySchema,
    searchKeywords: stringArraySchema,
    reviewerQuestions: stringArraySchema,
    confidenceDimensions: {
      additionalProperties: false,
      properties: {
        ambiguity: { enum: confidenceLevels },
        conceptUnderstanding: { enum: confidenceLevels },
        domainAccuracy: { enum: confidenceLevels },
        sourceSupport: { enum: confidenceLevels },
        translationNaturalness: { enum: confidenceLevels },
      },
      required: [
        'ambiguity',
        'conceptUnderstanding',
        'domainAccuracy',
        'sourceSupport',
        'translationNaturalness',
      ],
      type: 'object',
    },
    riskLevel: { enum: riskLevels },
    reviewRoute: { enum: reviewRoutes },
    humanReviewRequired: { const: true },
  },
  required: [
    'schemaVersion',
    'headwordEn',
    'recommendedTranslationMn',
    'alternativeTranslations',
    'explanationEn',
    'explanationMn',
    'categories',
    'contexts',
    'examples',
    'relatedTerms',
    'searchKeywords',
    'reviewerQuestions',
    'confidenceDimensions',
    'riskLevel',
    'reviewRoute',
    'humanReviewRequired',
  ],
  type: 'object',
} as const

const critiqueCheckSchema = {
  additionalProperties: false,
  properties: {
    assessment: { enum: ['pass', 'warning', 'fail'] },
    notes: stringArraySchema,
  },
  required: ['assessment', 'notes'],
  type: 'object',
} as const

export const critiqueOutputSchemaV1 = {
  $id: 'https://opentoli.org/schemas/ai/critique-output/1.0.0',
  additionalProperties: false,
  properties: {
    schemaVersion: { const: AI_SCHEMA_VERSION },
    summary: { minLength: 1, type: 'string' },
    checks: {
      additionalProperties: false,
      properties: {
        semanticAccuracy: critiqueCheckSchema,
        mongolianNaturalness: critiqueCheckSchema,
        literalTranslationArtifacts: critiqueCheckSchema,
        terminologyConflicts: critiqueCheckSchema,
        unsupportedClaims: critiqueCheckSchema,
        sourceQuality: critiqueCheckSchema,
      },
      required: [
        'semanticAccuracy',
        'mongolianNaturalness',
        'literalTranslationArtifacts',
        'terminologyConflicts',
        'unsupportedClaims',
        'sourceQuality',
      ],
      type: 'object',
    },
    requiredExpertise: {
      // Historical payloads may retain source_validation, but new provider output cannot request it.
      items: { enum: ['language', 'domain'] },
      type: 'array',
    },
    recommendedRiskLevel: { enum: riskLevels },
    recommendedReviewRoute: { enum: reviewRoutes },
    blockingIssues: stringArraySchema,
  },
  required: [
    'schemaVersion',
    'summary',
    'checks',
    'requiredExpertise',
    'recommendedRiskLevel',
    'recommendedReviewRoute',
    'blockingIssues',
  ],
  type: 'object',
} as const
