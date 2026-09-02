import type { BudgetRepository } from './application/budgetRepository'
import type { ExpenseRepository } from './application/expenseRepository'
import { httpBudgetRepository } from './infrastructure/http/httpBudgetRepository'
import { httpExpenseRepository } from './infrastructure/http/httpExpenseRepository'

/**
 * Composition root: binds the application's ports to their infrastructure
 * adapters. The rest of the app receives repositories from here (via props /
 * hook arguments) and never imports `infrastructure/` directly.
 */
export const repositories: {
  expenses: ExpenseRepository
  budgets: BudgetRepository
} = {
  expenses: httpExpenseRepository,
  budgets: httpBudgetRepository,
}
