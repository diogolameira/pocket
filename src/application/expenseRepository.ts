import type { Expense, NewExpense } from '../domain/expense'
import { apiRequest } from './apiClient'

export { ApiError } from './apiClient'

export type ExpensePatch = Partial<NewExpense>

/**
 * Persistence boundary for expenses. The app depends only on this interface,
 * so the transport (HTTP, in-memory, …) can be swapped freely.
 */
export interface ExpenseRepository {
  list(): Promise<Expense[]>
  create(expense: NewExpense): Promise<Expense>
  update(id: string, patch: ExpensePatch): Promise<Expense>
  remove(id: string): Promise<void>
}

const ENDPOINT = '/api/expenses'

export const httpExpenseRepository: ExpenseRepository = {
  list: () => apiRequest<Expense[]>(ENDPOINT),
  create: expense =>
    apiRequest<Expense>(ENDPOINT, { method: 'POST', body: JSON.stringify(expense) }),
  update: (id, patch) =>
    apiRequest<Expense>(`${ENDPOINT}/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove: id => apiRequest<void>(`${ENDPOINT}/${id}`, { method: 'DELETE' }),
}
