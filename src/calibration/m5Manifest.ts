import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const M5_MANIFEST_PATH = path.resolve(
  process.cwd(),
  'data/calibration/m5-technology-software.json',
)

export const allowedDifficulties = [
  'straightforward',
  'ambiguous',
  'domain_sensitive',
] as const

export const allowedSourceTypes = [
  'government',
  'standards_body',
  'official_documentation',
  'academic',
  'dictionary',
  'textbook',
  'professional_usage',
  'news',
  'community_discussion',
  'other',
] as const

export type M5Difficulty = (typeof allowedDifficulties)[number]
export type M5SourceType = (typeof allowedSourceTypes)[number]

export type M5Source = {
  id: string
  licenseNote?: string
  publisher: string
  sourceType: M5SourceType
  title: string
  url: string
}

export type M5Term = {
  context: string
  difficulty: M5Difficulty
  headwordEn: string
  id: string
  notes?: string
  priority: number
  sourceRefs?: string[]
  subcategory: string
}

export type M5Manifest = {
  categoryName: string
  categorySlug: string
  description: string
  milestone: 'M5'
  name: string
  requiredAmbiguousTerms: string[]
  runPolicy: {
    defaultPrepareCommand: string
    firstBatchSize: number
    processOneJobCommand: string
    stopConditions: string[]
    subsequentBatchSize: number
  }
  sources: M5Source[]
  terms: M5Term[]
  version: number
}

export type M5ManifestStats = {
  difficultyCounts: Record<M5Difficulty, number>
  referenceCount: number
  termCount: number
}

export type M5ManifestValidation = {
  errors: string[]
  stats: M5ManifestStats
  warnings: string[]
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isAllowed = <T extends readonly string[]>(value: unknown, allowed: T): value is T[number] =>
  typeof value === 'string' && allowed.includes(value)

const normalizeHeadword = (headword: string) => headword.trim().toLocaleLowerCase('en-US')

const isValidUrl = (value: string): boolean => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:'
  } catch {
    return false
  }
}

export const loadM5Manifest = async (
  manifestPath: string = M5_MANIFEST_PATH,
): Promise<M5Manifest> => {
  const raw = await readFile(manifestPath, 'utf8')
  return JSON.parse(raw) as M5Manifest
}

export const validateM5Manifest = (manifest: unknown): M5ManifestValidation => {
  const errors: string[] = []
  const warnings: string[] = []
  const difficultyCounts: Record<M5Difficulty, number> = {
    ambiguous: 0,
    domain_sensitive: 0,
    straightforward: 0,
  }

  if (!isRecord(manifest)) {
    return {
      errors: ['Manifest must be a JSON object.'],
      stats: { difficultyCounts, referenceCount: 0, termCount: 0 },
      warnings,
    }
  }

  if (manifest.milestone !== 'M5') errors.push('milestone must be M5.')
  if (manifest.categorySlug !== 'technology-software') {
    errors.push('categorySlug must be technology-software.')
  }
  if (manifest.version !== 1) errors.push('version must be 1.')

  const sources = Array.isArray(manifest.sources) ? manifest.sources : []
  const terms = Array.isArray(manifest.terms) ? manifest.terms : []
  const requiredAmbiguousTerms = Array.isArray(manifest.requiredAmbiguousTerms)
    ? manifest.requiredAmbiguousTerms
    : []

  if (terms.length !== 50) errors.push(`Expected exactly 50 terms, found ${terms.length}.`)

  const sourceIds = new Set<string>()
  for (const [index, source] of sources.entries()) {
    if (!isRecord(source)) {
      errors.push(`sources[${index}] must be an object.`)
      continue
    }

    const id = source.id
    const title = source.title
    const publisher = source.publisher
    const sourceType = source.sourceType
    const url = source.url

    if (typeof id !== 'string' || id.trim().length === 0) {
      errors.push(`sources[${index}].id must be a non-empty string.`)
    } else if (sourceIds.has(id)) {
      errors.push(`Duplicate source id: ${id}.`)
    } else {
      sourceIds.add(id)
    }

    if (typeof title !== 'string' || title.trim().length === 0) {
      errors.push(`sources[${index}].title must be a non-empty string.`)
    }
    if (typeof publisher !== 'string' || publisher.trim().length === 0) {
      errors.push(`sources[${index}].publisher must be a non-empty string.`)
    }
    if (!isAllowed(sourceType, allowedSourceTypes)) {
      errors.push(`sources[${index}].sourceType is not supported.`)
    }
    if (typeof url !== 'string' || !isValidUrl(url)) {
      errors.push(`sources[${index}].url must be a valid https URL.`)
    }
  }

  const termIds = new Set<string>()
  const priorities = new Set<number>()
  const normalizedHeadwords = new Set<string>()

  for (const [index, term] of terms.entries()) {
    if (!isRecord(term)) {
      errors.push(`terms[${index}] must be an object.`)
      continue
    }

    const id = term.id
    const priority = term.priority
    const headwordEn = term.headwordEn
    const subcategory = term.subcategory
    const context = term.context
    const difficulty = term.difficulty
    const sourceRefs = term.sourceRefs

    if (typeof id !== 'string' || id.trim().length === 0) {
      errors.push(`terms[${index}].id must be a non-empty string.`)
    } else if (termIds.has(id)) {
      errors.push(`Duplicate term id: ${id}.`)
    } else {
      termIds.add(id)
    }

    if (
      typeof priority !== 'number' ||
      !Number.isInteger(priority) ||
      priority < 1 ||
      priority > terms.length
    ) {
      errors.push(`terms[${index}].priority must be an integer from 1 to ${terms.length}.`)
    } else if (priorities.has(priority)) {
      errors.push(`Duplicate term priority: ${priority}.`)
    } else {
      priorities.add(priority)
    }

    if (typeof headwordEn !== 'string' || headwordEn.trim().length === 0) {
      errors.push(`terms[${index}].headwordEn must be a non-empty string.`)
    } else {
      const normalized = normalizeHeadword(headwordEn)
      if (normalizedHeadwords.has(normalized)) {
        errors.push(`Duplicate headword: ${headwordEn}.`)
      } else {
        normalizedHeadwords.add(normalized)
      }
    }

    if (typeof subcategory !== 'string' || subcategory.trim().length === 0) {
      errors.push(`terms[${index}].subcategory must be a non-empty string.`)
    }
    if (typeof context !== 'string' || context.trim().length === 0) {
      errors.push(`terms[${index}].context must be a non-empty string.`)
    }

    if (!isAllowed(difficulty, allowedDifficulties)) {
      errors.push(`terms[${index}].difficulty is not supported.`)
    } else {
      difficultyCounts[difficulty] += 1
    }

    if (sourceRefs !== undefined && !Array.isArray(sourceRefs)) {
      errors.push(`terms[${index}].sourceRefs must be an array when provided.`)
    } else if (Array.isArray(sourceRefs)) {
      for (const sourceRef of sourceRefs) {
        if (typeof sourceRef !== 'string' || !sourceIds.has(sourceRef)) {
          errors.push(`terms[${index}] references unknown source: ${String(sourceRef)}.`)
        }
      }
    }
  }

  for (const required of requiredAmbiguousTerms) {
    if (typeof required !== 'string') {
      errors.push('requiredAmbiguousTerms must contain only strings.')
      continue
    }
    if (!normalizedHeadwords.has(normalizeHeadword(required))) {
      errors.push(`Required ambiguous term is missing: ${required}.`)
    }
  }

  if (difficultyCounts.ambiguous < 15) {
    warnings.push('Calibration set has fewer than 15 ambiguous terms.')
  }
  if (difficultyCounts.domain_sensitive < 8) {
    warnings.push('Calibration set has fewer than 8 domain-sensitive terms.')
  }

  return {
    errors,
    stats: {
      difficultyCounts,
      referenceCount: sources.length,
      termCount: terms.length,
    },
    warnings,
  }
}

export const assertValidM5Manifest = (manifest: unknown): asserts manifest is M5Manifest => {
  const validation = validateM5Manifest(manifest)
  if (validation.errors.length > 0) {
    throw new Error(`Invalid M5 calibration manifest:\n- ${validation.errors.join('\n- ')}`)
  }
}
