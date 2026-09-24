import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./client.js', () => ({
  callModel: vi.fn(),
}))

import { callModel, type ModelCallResult } from './client.js'
import { extractTransactions } from './extractTransactions.js'

const mockCallModel = vi.mocked(callModel)

beforeEach(() => {
  mockCallModel.mockReset()
})

function modelResult(text: string): ModelCallResult {
  return { text, inputTokens: 10, outputTokens: 10, latencyMs: 5 }
}

describe('extractTransactions', () => {
  it('returns validated transactions for a valid response', async () => {
    mockCallModel.mockResolvedValueOnce(modelResult(JSON.stringify([
      { date: '2026-09-02', merchant: 'Continente', amount: -45.2, category: 'Groceries' },
    ])))

    const result = await extractTransactions('some statement line')

    expect(result.unparsed).toEqual([])
    expect(result.transactions).toHaveLength(1)
    expect(result.transactions[0]).toMatchObject({
      merchant: 'Continente',
      amount: -45.2,
      category: 'Groceries',
      date: '2026-09-02',
    })
    expect(result.transactions[0]!.id).toEqual(expect.any(String))
    expect(mockCallModel).toHaveBeenCalledTimes(1)
  })

  it('rejects individual invalid rows without failing the whole chunk', async () => {
    mockCallModel.mockResolvedValueOnce(modelResult(JSON.stringify([
      { date: '2026-09-02', merchant: 'Good Row', amount: -10, category: 'Shopping' },
      { date: '02-09-2026', merchant: 'Bad Date', amount: -5, category: 'Shopping' },
      { date: '2026-09-02', merchant: 'Bad Category', amount: -5, category: 'Nonsense' },
    ])))

    const result = await extractTransactions('line')

    expect(result.transactions).toHaveLength(1)
    expect(result.transactions[0]!.merchant).toBe('Good Row')
    expect(result.unparsed).toHaveLength(2)
    expect(mockCallModel).toHaveBeenCalledTimes(1)
  })

  it('retries once on malformed JSON, then succeeds', async () => {
    mockCallModel
      .mockResolvedValueOnce(modelResult('not json'))
      .mockResolvedValueOnce(modelResult(JSON.stringify([
        { date: '2026-09-02', merchant: 'Retried', amount: 12.5, category: 'Income' },
      ])))

    const result = await extractTransactions('line')

    expect(mockCallModel).toHaveBeenCalledTimes(2)
    expect(result.transactions).toHaveLength(1)
    expect(result.transactions[0]!.merchant).toBe('Retried')

    // The retry turn should include the failed attempt plus a corrective instruction.
    const secondCallMessages = mockCallModel.mock.calls[1]![1]
    expect(secondCallMessages.length).toBeGreaterThanOrEqual(3)
  })

  it('gives up after one retry and reports the chunk as unparsed, without throwing', async () => {
    mockCallModel
      .mockResolvedValueOnce(modelResult('still not json'))
      .mockResolvedValueOnce(modelResult('still not json'))

    const result = await extractTransactions('line')

    expect(mockCallModel).toHaveBeenCalledTimes(2)
    expect(result.transactions).toEqual([])
    expect(result.unparsed).toHaveLength(1)
    expect(result.unparsed[0]!.reason).toMatch(/valid JSON/)
  })

  it('retries when the response is valid JSON but not an array', async () => {
    mockCallModel
      .mockResolvedValueOnce(modelResult(JSON.stringify({ transactions: [] })))
      .mockResolvedValueOnce(modelResult(JSON.stringify([
        { date: '2026-09-02', merchant: 'Fixed shape', amount: -3, category: 'Other' },
      ])))

    const result = await extractTransactions('line')

    expect(mockCallModel).toHaveBeenCalledTimes(2)
    expect(result.transactions).toHaveLength(1)
  })

  it('strips a markdown code fence around the JSON', async () => {
    mockCallModel.mockResolvedValueOnce(modelResult(
      '```json\n' +
        JSON.stringify([{ date: '2026-09-02', merchant: 'Fenced', amount: -1, category: 'Other' }]) +
        '\n```',
    ))

    const result = await extractTransactions('line')

    expect(result.transactions).toHaveLength(1)
    expect(result.transactions[0]!.merchant).toBe('Fenced')
  })

  it('chunks a long statement and merges results from every chunk', async () => {
    mockCallModel.mockImplementation(async () =>
      modelResult(JSON.stringify([{ date: '2026-09-02', merchant: 'Row', amount: -1, category: 'Other' }])),
    )

    const lines = Array.from({ length: 110 }, (_, i) => `line ${i}`).join('\n')
    const result = await extractTransactions(lines)

    // chunkLines(110 lines, default 50) => 3 chunks => one call and one row each.
    expect(mockCallModel).toHaveBeenCalledTimes(3)
    expect(result.transactions).toHaveLength(3)
  })

  it('returns nothing for blank input without calling the model', async () => {
    const result = await extractTransactions('   \n\n  ')

    expect(mockCallModel).not.toHaveBeenCalled()
    expect(result).toEqual({ transactions: [], unparsed: [] })
  })
})
