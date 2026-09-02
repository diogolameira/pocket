import type { Budgets } from '../domain/expense'
import { apiRequest } from './apiClient'

export interface BudgetRepository {
  get(): Promise<Budgets>
  save(budgets: Budgets): Promise<Budgets>
}

const ENDPOINT = '/api/budgets'

export const httpBudgetRepository: BudgetRepository = {
  get: () => apiRequest<Budgets>(ENDPOINT),
  save: budgets => apiRequest<Budgets>(ENDPOINT, { method: 'PUT', body: JSON.stringify(budgets) }),
}
