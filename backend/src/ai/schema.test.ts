import { describe, expect, it } from 'vitest'
import { chunkResponseSchema, extractedTransactionSchema } from './schema.js'

describe('extractedTransactionSchema', () => {
  const valid = { date: '2026-09-02', merchant: 'Continente', amount: -45.2, category: 'Groceries' }

  it('accepts a valid transaction', () => {
    const result = extractedTransactionSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('accepts a positive amount (income)', () => {
    const result = extractedTransactionSchema.safeParse({ ...valid, amount: 1200, category: 'Income' })
    expect(result.success).toBe(true)
  })

  it('rejects a non-ISO date', () => {
    const result = extractedTransactionSchema.safeParse({ ...valid, date: '02/09/2026' })
    expect(result.success).toBe(false)
  })

  it('rejects an empty merchant', () => {
    const result = extractedTransactionSchema.safeParse({ ...valid, merchant: '  ' })
    expect(result.success).toBe(false)
  })

  it('rejects a zero amount', () => {
    const result = extractedTransactionSchema.safeParse({ ...valid, amount: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects a category outside the fixed list', () => {
    const result = extractedTransactionSchema.safeParse({ ...valid, category: 'Groceries & More' })
    expect(result.success).toBe(false)
  })

  it('rejects a missing field', () => {
    const withoutAmount = { date: valid.date, merchant: valid.merchant, category: valid.category }
    const result = extractedTransactionSchema.safeParse(withoutAmount)
    expect(result.success).toBe(false)
  })
})

describe('chunkResponseSchema', () => {
  it('accepts an array', () => {
    expect(chunkResponseSchema.safeParse([]).success).toBe(true)
    expect(chunkResponseSchema.safeParse([{ any: 'thing' }]).success).toBe(true)
  })

  it('rejects a non-array (e.g. the model wrapping the array in an object)', () => {
    expect(chunkResponseSchema.safeParse({ transactions: [] }).success).toBe(false)
    expect(chunkResponseSchema.safeParse('not an array').success).toBe(false)
    expect(chunkResponseSchema.safeParse(null).success).toBe(false)
  })
})
