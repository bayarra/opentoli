import { AI_SCHEMA_VERSION } from '../schemas/v1'
import type { AIProvider, ProviderResult } from './types'

const usage = { estimatedCostUsd: 0, inputTokens: 0, outputTokens: 0 }

export class DeterministicAIProvider implements AIProvider {
  readonly metadata = {
    critiquePromptVersion: 'deterministic-critique.v1',
    generationPromptVersion: 'deterministic-generation.v1',
    modelName: 'deterministic-fixture-v1',
    provider: 'deterministic',
    researchPromptVersion: 'deterministic-research.v1',
  }

  readonly calls = {
    critique: 0,
    generate: 0,
    research: 0,
  }

  async research({ preparation }: Parameters<AIProvider['research']>[0]): Promise<ProviderResult> {
    this.calls.research += 1

    return {
      output: {
        ambiguities: ['The preferred Mongolian noun form requires language review.'],
        canonicalMeaning:
          preparation.headwordEn === 'authentication'
            ? 'The process of verifying that a claimed identity is genuine.'
            : `A source-grounded working definition for ${preparation.headwordEn}.`,
        confusedTerms:
          preparation.headwordEn === 'authentication' ? ['authorization', 'identification'] : [],
        domainMeanings: [`Usage in ${preparation.category.nameEn}.`],
        existingMongolianUsage: [],
        headwordEn: preparation.headwordEn,
        partOfSpeech: 'noun',
        reviewerQuestions: ['Which Mongolian wording is most natural for the intended context?'],
        schemaVersion: AI_SCHEMA_VERSION,
        sourceIds: preparation.sources.map((source) => source.id),
      },
      usage,
    }
  }

  async generate({ preparation }: Parameters<AIProvider['generate']>[0]): Promise<ProviderResult> {
    this.calls.generate += 1
    const isAuthentication = preparation.headwordEn === 'authentication'

    return {
      output: {
        alternativeTranslations: [
          {
            context: preparation.context?.nameEn || preparation.category.nameEn,
            translationMn: isAuthentication
              ? 'нэвтрэлтийг баталгаажуулах'
              : `${preparation.headwordEn} - хувилбар орчуулга`,
            type: 'alternative',
            usageNote: 'Retain as a candidate until a language reviewer decides.',
          },
        ],
        categories: [preparation.category.nameEn],
        confidenceDimensions: {
          ambiguity: 'low',
          conceptUnderstanding: 'high',
          domainAccuracy: 'medium',
          sourceSupport: preparation.sources.length > 0 ? 'high' : 'low',
          translationNaturalness: 'medium',
        },
        contexts: preparation.context ? [preparation.context.nameEn] : [],
        examples: [
          {
            exampleEn: isAuthentication
              ? 'The application requires two-factor authentication.'
              : `This example uses ${preparation.headwordEn} in context.`,
            exampleMn: isAuthentication
              ? 'Уг аппликейшн хоёр хүчин зүйлт танин баталгаажуулалт шаарддаг.'
              : 'Энэ жишээг хүн хянаж, монгол хэлээр засварлана.',
          },
        ],
        explanationEn: isAuthentication
          ? 'The process of verifying the identity claimed by a user, device, or system.'
          : `A draft explanation of ${preparation.headwordEn} for human review.`,
        explanationMn: isAuthentication
          ? 'Хэрэглэгч, төхөөрөмж эсвэл системийн мэдүүлсэн мөн чанарыг шалгаж баталгаажуулах үйл явц.'
          : 'Хүний хяналт шаардлагатай монгол тайлбарын төсөл.',
        headwordEn: preparation.headwordEn,
        humanReviewRequired: true,
        recommendedTranslationMn: isAuthentication
          ? 'танин баталгаажуулалт'
          : `${preparation.headwordEn} - монгол орчуулгын төсөл`,
        relatedTerms: isAuthentication ? ['authorization', 'identity'] : [],
        reviewerQuestions: ['Should the recommended candidate be edited before acceptance?'],
        reviewRoute: 'language_review',
        riskLevel: 'medium',
        schemaVersion: AI_SCHEMA_VERSION,
        searchKeywords: [preparation.headwordEn],
      },
      usage,
    }
  }

  async critique({ preparation }: Parameters<AIProvider['critique']>[0]): Promise<ProviderResult> {
    this.calls.critique += 1
    const passingCheck = { assessment: 'pass', notes: [] }

    return {
      output: {
        blockingIssues:
          preparation.sources.length > 0 ? [] : ['No supporting source was supplied.'],
        checks: {
          literalTranslationArtifacts: passingCheck,
          mongolianNaturalness: {
            assessment: 'warning',
            notes: ['A Mongolian language reviewer must confirm the preferred wording.'],
          },
          semanticAccuracy: passingCheck,
          sourceQuality: {
            assessment: preparation.sources.length > 0 ? 'pass' : 'fail',
            notes: preparation.sources.length > 0 ? [] : ['Source evidence is required.'],
          },
          terminologyConflicts: passingCheck,
          unsupportedClaims: passingCheck,
        },
        recommendedReviewRoute: preparation.sources.length > 0 ? 'language_review' : 'blocked',
        recommendedRiskLevel: preparation.sources.length > 0 ? 'medium' : 'high',
        requiredExpertise: ['language', 'source_validation'],
        schemaVersion: AI_SCHEMA_VERSION,
        summary:
          'The concept is usable as a draft, but the Mongolian wording requires human review.',
      },
      usage,
    }
  }
}
