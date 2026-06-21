import { describe, expect, it } from 'vitest'

import { formatSlug } from '@/utilities/formatSlug'

describe('formatSlug', () => {
  it('normalizes an English headword for URLs', () => {
    expect(formatSlug('  Artificial Intelligence & Data Science  ')).toBe(
      'artificial-intelligence-data-science',
    )
  })

  it('removes combining marks', () => {
    expect(formatSlug('Café terminology')).toBe('cafe-terminology')
  })
})
