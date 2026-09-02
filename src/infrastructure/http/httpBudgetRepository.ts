import type { BudgetRepository } from '../../application/budgetRepository'
import type { Budgets } from '../../domain/expense'
import { apiRequest } from './apiClient'

const ENDPOINT = '/api/budgets'

/** HTTP adapter for the `BudgetRepository` port. */
export const httpBudgetRepository: BudgetRepository = {
  get: () => apiRequest<Budgets>(ENDPOINT),
  save: budgets => apiRequest<Budgets>(ENDPOINT, { method: 'PUT', body: JSON.stringify(budgets) }),
}
