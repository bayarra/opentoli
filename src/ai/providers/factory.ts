import { DeterministicAIProvider } from './deterministic'
import { OpenAIProvider } from './openai'
import type { AIProvider } from './types'

type ProviderEnvironment = {
  AI_API_KEY?: string
  AI_MODEL?: string
  AI_PROVIDER?: string
}

export const createConfiguredAIProvider = (
  environment: ProviderEnvironment = process.env as ProviderEnvironment,
): AIProvider => {
  const provider = environment.AI_PROVIDER?.trim().toLocaleLowerCase('en-US')

  if (provider === 'deterministic') return new DeterministicAIProvider()
  if (provider === 'openai') {
    return new OpenAIProvider({
      apiKey: environment.AI_API_KEY || '',
      modelName: environment.AI_MODEL || '',
    })
  }

  throw new Error(
    `Unsupported AI_PROVIDER "${environment.AI_PROVIDER || ''}". Use "openai" or "deterministic".`,
  )
}
