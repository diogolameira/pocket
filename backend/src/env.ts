import dotenv from 'dotenv'

dotenv.config()

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function optionalNumber(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer.`)
  }
  return parsed
}

/** Explicitly allowed browser origins (comma-separated in CORS_ORIGIN). */
const configuredOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/

export const env = {
  mongoUri: required('MONGODB_URI'),
  /** Database name. Falls back to the name embedded in the URI, then `expenses`. */
  dbName: process.env.MONGODB_DB ?? 'expenses',
  port: optionalNumber('PORT', 3000),
  /**
   * Statement-import feature. Optional at boot — the rest of the API works
   * without it — but required by `POST /api/import/parse`, which reports a
   * clear error if it's missing rather than crashing the server on startup.
   */
  geminiApiKey: process.env.GEMINI_API_KEY,
  /**
   * Cheap, fast model — statement extraction doesn't need a frontier model.
   * Pinned to a concrete model rather than a `-latest` alias: Google throttles
   * older/aliased models for newer API keys with 503 "high demand" errors and
   * explicitly directs new projects to the current Flash-Lite tier instead.
   */
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite',
  /**
   * Whether a browser `Origin` is allowed. Any localhost origin passes (dev
   * servers hop ports), plus anything listed in CORS_ORIGIN.
   */
  isAllowedOrigin(origin: string | undefined): boolean {
    if (!origin) return false
    return LOCALHOST_ORIGIN.test(origin) || configuredOrigins.includes(origin)
  },
} as const
