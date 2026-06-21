import type { CritiqueOutputV1, GenerationOutputV1, ResearchPacketV1 } from '../schemas/v1'

export type PreparationSource = {
  id: number
  title: string
  publisher: string
  sourceType: string
  url: string
}

export type PreparationInput = {
  category: {
    id: number
    nameEn: string
    slug: string
  }
  context?: {
    id: number
    nameEn: string
    slug: string
  }
  headwordEn: string
  sources: PreparationSource[]
  termId?: number
}

export type ProviderUsage = {
  estimatedCostUsd?: number
  inputTokens?: number
  outputTokens?: number
}

export type ProviderResult = {
  output: unknown
  usage?: ProviderUsage
}

export type AIProviderMetadata = {
  critiquePromptVersion: string
  generationPromptVersion: string
  modelName: string
  provider: string
  researchPromptVersion: string
}

export interface AIProvider {
  readonly metadata: AIProviderMetadata
  critique(input: {
    generation: GenerationOutputV1
    preparation: PreparationInput
    research: ResearchPacketV1
  }): Promise<ProviderResult>
  generate(input: {
    preparation: PreparationInput
    research: ResearchPacketV1
  }): Promise<ProviderResult>
  research(input: { preparation: PreparationInput }): Promise<ProviderResult>
}

export type ValidatedProviderOutputs = {
  critique: CritiqueOutputV1
  generation: GenerationOutputV1
  research: ResearchPacketV1
}
