import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../env.js', () => ({
  env: { geminiApiKey: 'test-key', geminiModel: 'gemini-3.5-flash-lite' },
}))

const generateContentMock = vi.fn()

vi.mock('@google/genai', async importOriginal => {
  const actual = await importOriginal<typeof import('@google/genai')>()
  return {
    ...actual,
    // A plain function, not an arrow function — arrow functions can't be
    // constructors, and this mock is invoked with `new GoogleGenAI(...)`.
    GoogleGenAI: vi.fn().mockImplementation(function GoogleGenAI() {
      return { models: { generateContent: generateContentMock } }
    }),
  }
})

const { ApiError } = await import('@google/genai')
const { callModel } = await import('./client.js')

function okResponse(text: string) {
  return {
    text,
    usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 34 },
  }
}

beforeEach(() => {
  generateContentMock.mockReset()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

/** Run `promise` while letting any pending fake-timer delays elapse. Attaches
 *  a handler synchronously so a rejection isn't briefly "unhandled" while
 *  fake timers are advancing — the real assertion still sees it, via the
 *  returned promise. */
async function settle<T>(promise: Promise<T>): Promise<T> {
  promise.catch(() => {})
  await vi.advanceTimersByTimeAsync(10_000)
  return promise
}

describe('callModel', () => {
  it('returns text and token usage on success', async () => {
    generateContentMock.mockResolvedValueOnce(okResponse('hello'))

    const result = await settle(callModel('system', [{ role: 'user', content: 'hi' }]))

    expect(result.text).toBe('hello')
    expect(result.inputTokens).toBe(12)
    expect(result.outputTokens).toBe(34)
    expect(generateContentMock).toHaveBeenCalledTimes(1)
  })

  it('retries a 503 "overloaded" error and succeeds', async () => {
    generateContentMock
      .mockRejectedValueOnce(new ApiError({ message: 'high demand', status: 503 }))
      .mockResolvedValueOnce(okResponse('recovered'))

    const result = await settle(callModel('system', [{ role: 'user', content: 'hi' }]))

    expect(result.text).toBe('recovered')
    expect(generateContentMock).toHaveBeenCalledTimes(2)
  })

  it('retries a 429 rate limit error', async () => {
    generateContentMock
      .mockRejectedValueOnce(new ApiError({ message: 'rate limited', status: 429 }))
      .mockResolvedValueOnce(okResponse('ok'))

    await settle(callModel('system', [{ role: 'user', content: 'hi' }]))

    expect(generateContentMock).toHaveBeenCalledTimes(2)
  })

  it('gives up after exhausting retries on repeated 503s', async () => {
    generateContentMock.mockRejectedValue(new ApiError({ message: 'high demand', status: 503 }))

    await expect(settle(callModel('system', [{ role: 'user', content: 'hi' }]))).rejects.toThrow('high demand')
    expect(generateContentMock).toHaveBeenCalledTimes(3)
  })

  it('does not retry a non-retryable error (e.g. bad request)', async () => {
    generateContentMock.mockRejectedValueOnce(new ApiError({ message: 'bad request', status: 400 }))

    await expect(settle(callModel('system', [{ role: 'user', content: 'hi' }]))).rejects.toThrow('bad request')
    expect(generateContentMock).toHaveBeenCalledTimes(1)
  })

  it('does not retry a plain non-ApiError failure', async () => {
    generateContentMock.mockRejectedValueOnce(new TypeError('network down'))

    await expect(settle(callModel('system', [{ role: 'user', content: 'hi' }]))).rejects.toThrow('network down')
    expect(generateContentMock).toHaveBeenCalledTimes(1)
  })
})
