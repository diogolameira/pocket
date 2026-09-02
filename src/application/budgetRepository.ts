import type { Budgets } from '../domain/expense'

/**
 * Port: how the application reads and writes category budgets. Implemented by an
 * adapter in `infrastructure/` and bound in `composition.ts`.
 */
export interface BudgetRepository {
  get(): Promise<Budgets>
  save(budgets: Budgets): Promise<Budgets>
}
