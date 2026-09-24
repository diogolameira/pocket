import { ApiError, GoogleGenAI } from '@google/genai'
import { env } from '../env.js'

export class AiNotConfiguredError extends Error {}

/** Provider-agnostic chat turn — kept independent of the Gemini SDK's own
 *  `Content`/`role` shape so callers (retry logic, tests) don't need to know
 *  which model provider is behind `callModel`. */
export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

let client: GoogleGenAI | undefined

/**
 * Created on first use, not at import time, so the rest of the API can start
 * and run without `GEMINI_API_KEY` — only the import endpoint needs it.
 */
function getClient(): GoogleGenAI {
  if (!env.geminiApiKey) {
    throw new AiNotConfiguredError(
      'Statement import is not configured: set GEMINI_API_KEY in the backend environment.',
    )
  }
  client ??= new GoogleGenAI({ apiKey: env.geminiApiKey })
  return client
}

export type ModelCallResult = {
  text: string
  inputTokens: number
  outputTokens: number
  latencyMs: number
}

/** HTTP statuses worth retrying: rate limiting and transient server-side
 *  failures (Gemini's shared capacity returns 503 "high demand" often enough
 *  that this is the normal case, not the exception). */
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504])
const MAX_ATTEMPTS = 3
const BASE_DELAY_MS = 500

function isRetryable(error: unknown): error is ApiError {
  return error instanceof ApiError && RETRYABLE_STATUSES.has(error.status)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * One logical request, retried with backoff for transient failures (rate
 * limits, "model overloaded" 503s). Callers still own the separate concern of
 * retrying a response that came back but wasn't usable JSON.
 */
export async function callModel(system: string, messages: ChatMessage[]): Promise<ModelCallResult> {
  const ai = getClient()
  const start = Date.now()

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: env.geminiModel,
        contents: messages.map(message => ({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: message.content }],
        })),
        config: {
          systemInstruction: system,
          temperature: 0,
          maxOutputTokens: 4096,
        },
      })

      return {
        text: response.text ?? '',
        inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
        outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
        latencyMs: Date.now() - start,
      }
    } catch (error) {
      if (!isRetryable(error) || attempt === MAX_ATTEMPTS) throw error
      const delayMs = Math.round(BASE_DELAY_MS * 2 ** (attempt - 1) + Math.random() * 250)
      console.warn(JSON.stringify({ event: 'import.model.retry', attempt, status: error.status, delayMs }))
      await sleep(delayMs)
    }
  }

  // Unreachable — the loop above always returns or throws — but keeps TS happy.
  throw new Error('callModel: retry loop exited unexpectedly')
}
