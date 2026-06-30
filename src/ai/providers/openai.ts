import OpenAI from 'openai'
import type {
  Response,
  ResponseCreateParamsNonStreaming,
} from 'openai/resources/responses/responses'

import {
  critiqueOutputSchemaV1,
  generationOutputSchemaV1,
  researchPacketSchemaV1,
} from '../schemas/v1'
import type { AIProvider, AIProviderMetadata, ProviderResult } from './types'

type JsonSchema = Record<string, unknown>

export type OpenAIResponseTransport = {
  create(
    params: ResponseCreateParamsNonStreaming,
  ): Promise<Pick<Response, 'error' | 'output_text' | 'status' | 'usage'>>
}

export type OpenAIProviderOptions = {
  apiKey: string
  modelName: string
  responses?: OpenAIResponseTransport
}

const makeNullable = (schema: JsonSchema): JsonSchema => {
  const type = schema.type
  if (typeof type === 'string') return { ...schema, type: [type, 'null'] }
  if (Array.isArray(type)) return { ...schema, type: [...new Set([...type, 'null'])] }
  return { anyOf: [schema, { type: 'null' }] }
}

export const toOpenAIStrictSchema = (source: unknown): JsonSchema => {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    throw new Error('OpenAI structured-output schema must be an object.')
  }

  const schema = source as JsonSchema
  const result = Object.fromEntries(
    Object.entries(schema)
      .filter(([key]) => key !== '$id')
      .map(([key, value]) => [key, value]),
  ) as JsonSchema

  if (!result.type && result.const !== undefined) {
    result.type =
      typeof result.const === 'number' && Number.isInteger(result.const)
        ? 'integer'
        : typeof result.const
  }
  if (!result.type && Array.isArray(result.enum) && result.enum.length > 0) {
    const enumTypes = [
      ...new Set(
        result.enum.map((value) =>
          typeof value === 'number' && Number.isInteger(value) ? 'integer' : typeof value,
        ),
      ),
    ]
    if (enumTypes.length === 1) result.type = enumTypes[0]
  }

  if (result.items) result.items = toOpenAIStrictSchema(result.items)
  if (result.properties && typeof result.properties === 'object') {
    const properties = result.properties as Record<string, unknown>
    const originallyRequired = new Set(
      Array.isArray(result.required)
        ? result.required.filter((item): item is string => typeof item === 'string')
        : [],
    )
    result.properties = Object.fromEntries(
      Object.entries(properties).map(([name, property]) => {
        const strictProperty = toOpenAIStrictSchema(property)
        return [name, originallyRequired.has(name) ? strictProperty : makeNullable(strictProperty)]
      }),
    )
    result.additionalProperties = false
    result.required = Object.keys(properties)
  }

  return result
}

const stripNullObjectProperties = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stripNullObjectProperties)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, nested]) => nested !== null)
      .map(([key, nested]) => [key, stripNullObjectProperties(nested)]),
  )
}

const responseError = (response: Pick<Response, 'error' | 'output_text' | 'status'>): string => {
  if (response.error) return `${response.error.code}: ${response.error.message}`
  if (response.status && response.status !== 'completed') {
    return `OpenAI response ended with status ${response.status}.`
  }
  if (!response.output_text) return 'OpenAI response did not contain output text.'
  return ''
}

export class OpenAIProvider implements AIProvider {
  readonly metadata: AIProviderMetadata
  private readonly apiKey: string
  private responses?: OpenAIResponseTransport

  constructor({ apiKey, modelName, responses }: OpenAIProviderOptions) {
    if (!apiKey.trim()) throw new Error('AI_API_KEY is required for the OpenAI provider.')
    if (!modelName.trim()) throw new Error('AI_MODEL is required for the OpenAI provider.')

    this.metadata = {
      critiquePromptVersion: 'openai-critique.v1',
      generationPromptVersion: 'openai-generation.v1',
      modelName,
      provider: 'openai',
      researchPromptVersion: 'openai-research.v1',
    }
    this.apiKey = apiKey
    this.responses = responses
  }

  private getResponses(): OpenAIResponseTransport {
    if (this.responses) return this.responses

    const client = new OpenAI({ apiKey: this.apiKey })
    this.responses = {
      create: (params) => client.responses.create(params),
    }
    return this.responses
  }

  private async request({
    input,
    instructions,
    maxOutputTokens,
    name,
    schema,
  }: {
    input: unknown
    instructions: string
    maxOutputTokens: number
    name: string
    schema: unknown
  }): Promise<ProviderResult> {
    const response = await this.getResponses().create({
      input: JSON.stringify(input),
      instructions,
      max_output_tokens: maxOutputTokens,
      model: this.metadata.modelName,
      reasoning: { effort: 'low' },
      store: false,
      text: {
        format: {
          name,
          schema: toOpenAIStrictSchema(schema),
          strict: true,
          type: 'json_schema',
        },
        verbosity: 'low',
      },
    })

    const error = responseError(response)
    if (error) throw new Error(error)

    let parsed: unknown
    try {
      parsed = JSON.parse(response.output_text)
    } catch {
      throw new Error('OpenAI structured output was not valid JSON.')
    }

    return {
      output: stripNullObjectProperties(parsed),
      usage: response.usage
        ? {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
          }
        : undefined,
    }
  }

  research({ preparation }: Parameters<AIProvider['research']>[0]): Promise<ProviderResult> {
    return this.request({
      input: { preparation },
      instructions: [
        'You prepare English-to-Mongolian terminology research for human reviewers.',
        'Treat supplied references as optional background context, not proof of a translation.',
        'Do not claim that you opened URLs, do not invent quotations, and surface uncertainty explicitly.',
        'Write original concise explanations and return only the requested structured output.',
      ].join(' '),
      maxOutputTokens: 2_500,
      name: 'opentoli_research_v1',
      schema: researchPacketSchemaV1,
    })
  }

  generate({
    preparation,
    research,
  }: Parameters<AIProvider['generate']>[0]): Promise<ProviderResult> {
    return this.request({
      input: { preparation, research },
      instructions: [
        'You draft English-to-Mongolian terminology for focused human review.',
        'Prefer natural Mongolian over literal calques and provide multiple defensible candidates.',
        'Never describe a candidate as official unless supplied evidence establishes that fact.',
        'Keep humanReviewRequired true and return only the requested structured output.',
      ].join(' '),
      maxOutputTokens: 3_500,
      name: 'opentoli_generation_v1',
      schema: generationOutputSchemaV1,
    })
  }

  critique({
    generation,
    preparation,
    research,
  }: Parameters<AIProvider['critique']>[0]): Promise<ProviderResult> {
    return this.request({
      input: { generation, preparation, research },
      instructions: [
        'Act as an independent skeptical critic of an AI-prepared English-to-Mongolian term.',
        'Check semantic accuracy, Mongolian naturalness, literal artifacts, terminology conflicts, and unsupported claims.',
        'Do not block or reroute a draft because references are missing or incomplete.',
        'Do not approve publication and return only the requested structured output.',
      ].join(' '),
      maxOutputTokens: 2_500,
      name: 'opentoli_critique_v1',
      schema: critiqueOutputSchemaV1,
    })
  }
}
