export class ApiError extends Error {
  status: number
  details: string[]

  constructor(message: string, status: number, details: string[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

type ErrorBody = { error?: string; details?: string[] }

/** Fetch JSON from the backend, turning any failure into an `ApiError`. */
export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    })
  } catch {
    throw new ApiError('Could not reach the server. Is the backend running?', 0)
  }

  if (!response.ok) {
    let body: ErrorBody = {}
    try {
      body = (await response.json()) as ErrorBody
    } catch {
      // no JSON body
    }
    throw new ApiError(
      body.error ?? `Request failed (${response.status})`,
      response.status,
      body.details ?? [],
    )
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
