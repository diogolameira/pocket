import type { ExpenseRepository } from '../../application/expenseRepository'
import type { Expense } from '../../domain/expense'
import { apiRequest } from './apiClient'

const ENDPOINT = '/api/expenses'

/** HTTP adapter for the `ExpenseRepository` port. */
export const httpExpenseRepository: ExpenseRepository = {
  list: () => apiRequest<Expense[]>(ENDPOINT),
  create: expense =>
    apiRequest<Expense>(ENDPOINT, { method: 'POST', body: JSON.stringify(expense) }),
  update: (id, patch) =>
    apiRequest<Expense>(`${ENDPOINT}/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove: id => apiRequest<void>(`${ENDPOINT}/${id}`, { method: 'DELETE' }),
}
