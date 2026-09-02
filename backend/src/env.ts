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

export const env = {
  mongoUri: required('MONGODB_URI'),
  /** Database name. Falls back to the name embedded in the URI, then `expenses`. */
  dbName: process.env.MONGODB_DB ?? 'expenses',
  port: optionalNumber('PORT', 3000),
  /** Allowed browser origin for CORS — the Vite dev server by default. */
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
} as const
