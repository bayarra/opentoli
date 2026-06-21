import type { CritiqueOutputV1, GenerationOutputV1, ResearchPacketV1 } from '../schemas/v1'
import type { PreparationInput } from '../providers/types'

const highRiskCategories = new Set(['finance-economics', 'law-government', 'medicine-health'])

export type RiskRoute = Pick<GenerationOutputV1, 'reviewRoute' | 'riskLevel'>

export const routeAIDraft = ({
  critique,
  generation,
  preparation,
  research,
}: {
  critique: CritiqueOutputV1
  generation: GenerationOutputV1
  preparation: PreparationInput
  research: ResearchPacketV1
}): RiskRoute => {
  if (
    preparation.sources.length === 0 ||
    research.sourceIds.length === 0 ||
    critique.blockingIssues.length > 0 ||
    critique.checks.sourceQuality.assessment === 'fail'
  ) {
    return { reviewRoute: 'blocked', riskLevel: 'high' }
  }

  if (highRiskCategories.has(preparation.category.slug)) {
    return { reviewRoute: 'domain_review', riskLevel: 'high' }
  }

  if (
    generation.confidenceDimensions.ambiguity === 'high' ||
    critique.recommendedReviewRoute === 'community_discussion'
  ) {
    return { reviewRoute: 'community_discussion', riskLevel: 'medium' }
  }

  if (
    generation.confidenceDimensions.translationNaturalness !== 'high' ||
    critique.checks.mongolianNaturalness.assessment !== 'pass'
  ) {
    return { reviewRoute: 'language_review', riskLevel: 'medium' }
  }

  if (
    generation.confidenceDimensions.sourceSupport === 'high' &&
    generation.confidenceDimensions.domainAccuracy === 'high' &&
    critique.recommendedRiskLevel === 'low'
  ) {
    return { reviewRoute: 'fast_review', riskLevel: 'low' }
  }

  return {
    reviewRoute: critique.recommendedReviewRoute,
    riskLevel: critique.recommendedRiskLevel,
  }
}
