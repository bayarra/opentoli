import { resolveTestDatabaseUrl } from '@/testing/database'
import { describe, expect, it } from 'vitest'

describe('integration database isolation', () => {
  it('derives a dedicated test database from the development URL', () => {
    const result = resolveTestDatabaseUrl({
      DATABASE_URL: 'postgres://postgres:postgres@127.0.0.1:5432/opentoli',
    })
    expect(new URL(result).pathname).toBe('/opentoli_test')
  })

  it('rejects an explicitly configured non-test database', () => {
    expect(() =>
      resolveTestDatabaseUrl({
        DATABASE_URL: 'postgres://postgres:postgres@127.0.0.1:5432/opentoli',
        TEST_DATABASE_URL: 'postgres://postgres:postgres@127.0.0.1:5432/production',
      }),
    ).toThrow('ending in "_test"')
  })
})
