import type { Expense, NewExpense } from '../domain/expense'

export type ExpensePatch = Partial<NewExpense>

/**
 * Persistence boundary for expenses. The app depends only on this interface,
 * so the transport (HTTP, localStorage, in-memory) can be swapped freely.
 */
export interface ExpenseRepository {
  list(): Promise<Expense[]>
  create(expense: NewExpense): Promise<Expense>
  update(id: string, patch: ExpensePatch): Promise<Expense>
  remove(id: string): Promise<void>
}

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

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const ENDPOINT = `${API_URL}/api/expenses`

type ErrorBody = { error?: string; details?: string[] }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${ENDPOINT}${path}`, {
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
      // response had no JSON body
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

export const httpExpenseRepository: ExpenseRepository = {
  list: () => request<Expense[]>(''),
  create: expense =>
    request<Expense>('', { method: 'POST', body: JSON.stringify(expense) }),
  update: (id, patch) =>
    request<Expense>(`/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove: id => request<void>(`/${id}`, { method: 'DELETE' }),
}
