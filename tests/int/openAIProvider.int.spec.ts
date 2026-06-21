import { createConfiguredAIProvider } from '@/ai/providers/factory'
import { OpenAIProvider, type OpenAIResponseTransport } from '@/ai/providers/openai'
import type { PreparationInput } from '@/ai/providers/types'
import { AI_SCHEMA_VERSION } from '@/ai/schemas/v1'
import type { ResponseCreateParamsNonStreaming } from 'openai/resources/responses/responses'
import { describe, expect, it } from 'vitest'

const preparation: PreparationInput = {
  category: { id: 1, nameEn: 'Technology & Software', slug: 'technology-software' },
  headwordEn: 'authentication',
  sources: [
    {
      id: 2,
      publisher: 'NIST',
      sourceType: 'government',
      title: 'NIST Authentication Glossary',
      url: 'https://csrc.nist.gov/glossary/term/authentication',
    },
  ],
  termId: 3,
}

const research = {
  acronymExpansion: null,
  ambiguities: [],
  canonicalMeaning: 'Verification that a claimed identity is genuine.',
  confusedTerms: ['authorization'],
  domainMeanings: ['Identity verification in software security.'],
  existingMongolianUsage: [],
  headwordEn: 'authentication',
  partOfSpeech: 'noun',
  reviewerQuestions: [],
  schemaVersion: AI_SCHEMA_VERSION,
  sourceIds: [2],
}

const generation = {
  alternativeTranslations: [],
  categories: ['Technology & Software'],
  confidenceDimensions: {
    ambiguity: 'low',
    conceptUnderstanding: 'high',
    domainAccuracy: 'medium',
    sourceSupport: 'high',
    translationNaturalness: 'medium',
  },
  contexts: [],
  examples: [
    {
      exampleEn: 'The application requires authentication.',
      exampleMn: 'Аппликейшн танин баталгаажуулалт шаарддаг.',
    },
  ],
  explanationEn: 'The process of verifying a claimed identity.',
  explanationMn: 'Мэдүүлсэн мөн чанарыг шалгаж баталгаажуулах үйл явц.',
  headwordEn: 'authentication',
  humanReviewRequired: true,
  recommendedTranslationMn: 'танин баталгаажуулалт',
  relatedTerms: ['authorization'],
  reviewerQuestions: [],
  reviewRoute: 'language_review',
  riskLevel: 'medium',
  schemaVersion: AI_SCHEMA_VERSION,
  searchKeywords: ['identity'],
}

const passingCheck = { assessment: 'pass', notes: [] }
const critique = {
  blockingIssues: [],
  checks: {
    literalTranslationArtifacts: passingCheck,
    mongolianNaturalness: { assessment: 'warning', notes: ['Language review required.'] },
    semanticAccuracy: passingCheck,
    sourceQuality: passingCheck,
    terminologyConflicts: passingCheck,
    unsupportedClaims: passingCheck,
  },
  recommendedReviewRoute: 'language_review',
  recommendedRiskLevel: 'medium',
  requiredExpertise: ['language'],
  schemaVersion: AI_SCHEMA_VERSION,
  summary: 'Human language review is required.',
}

const response = (output: unknown) => ({
  error: null,
  output_text: JSON.stringify(output),
  status: 'completed' as const,
  usage: {
    input_tokens: 11,
    input_tokens_details: { cached_tokens: 0 },
    output_tokens: 7,
    output_tokens_details: { reasoning_tokens: 2 },
    total_tokens: 18,
  },
})

describe('OpenAI provider adapter', () => {
  it('uses strict Responses API schemas and returns parsed output with usage', async () => {
    const requests: ResponseCreateParamsNonStreaming[] = []
    const outputs = [research, generation, critique]
    const responses: OpenAIResponseTransport = {
      create: async (params) => {
        requests.push(params)
        return response(outputs.shift())
      },
    }
    const provider = new OpenAIProvider({
      apiKey: 'test-only-key',
      modelName: 'gpt-5-mini',
      responses,
    })

    const researchResult = await provider.research({ preparation })
    const generationResult = await provider.generate({
      preparation,
      research: researchResult.output as never,
    })
    await provider.critique({
      generation: generationResult.output as never,
      preparation,
      research: researchResult.output as never,
    })

    expect(requests).toHaveLength(3)
    expect(requests.every((request) => request.model === 'gpt-5-mini')).toBe(true)
    expect(requests.every((request) => request.store === false)).toBe(true)
    expect(requests.every((request) => request.reasoning?.effort === 'low')).toBe(true)
    expect(researchResult.usage).toEqual({ inputTokens: 11, outputTokens: 7 })
    expect(researchResult.output).not.toHaveProperty('acronymExpansion')

    const format = requests[0]?.text?.format
    expect(format?.type).toBe('json_schema')
    if (format?.type !== 'json_schema') throw new Error('Expected JSON Schema format.')
    expect(format.strict).toBe(true)
    const strictSchema = format.schema as {
      properties: Record<string, { type?: string | string[] }>
      required: string[]
    }
    expect(strictSchema.required).toContain('acronymExpansion')
    expect(strictSchema.properties.acronymExpansion?.type).toEqual(['string', 'null'])
    expect(strictSchema.properties.schemaVersion?.type).toBe('string')
  })

  it('rejects incomplete or malformed API responses', async () => {
    const incomplete = new OpenAIProvider({
      apiKey: 'test-only-key',
      modelName: 'gpt-5-mini',
      responses: {
        create: async () => ({
          error: null,
          output_text: '',
          status: 'incomplete',
          usage: undefined,
        }),
      },
    })
    await expect(incomplete.research({ preparation })).rejects.toThrow('status incomplete')

    const malformed = new OpenAIProvider({
      apiKey: 'test-only-key',
      modelName: 'gpt-5-mini',
      responses: {
        create: async () => ({
          error: null,
          output_text: 'not-json',
          status: 'completed',
          usage: undefined,
        }),
      },
    })
    await expect(malformed.research({ preparation })).rejects.toThrow('not valid JSON')
  })

  it('selects configured providers and validates OpenAI secrets', () => {
    expect(
      createConfiguredAIProvider({
        AI_API_KEY: 'test-only-key',
        AI_MODEL: 'gpt-5-mini',
        AI_PROVIDER: 'OpenAI',
      }).metadata.provider,
    ).toBe('openai')
    expect(createConfiguredAIProvider({ AI_PROVIDER: 'deterministic' }).metadata.provider).toBe(
      'deterministic',
    )
    expect(() =>
      createConfiguredAIProvider({ AI_MODEL: 'gpt-5-mini', AI_PROVIDER: 'openai' }),
    ).toThrow('AI_API_KEY')
  })
})
