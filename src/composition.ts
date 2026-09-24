import type { BudgetRepository } from './application/budgetRepository'
import type { ExpenseRepository } from './application/expenseRepository'
import type { ImportRepository } from './application/importRepository'
import { httpBudgetRepository } from './infrastructure/http/httpBudgetRepository'
import { httpExpenseRepository } from './infrastructure/http/httpExpenseRepository'
import { httpImportRepository } from './infrastructure/http/httpImportRepository'

/**
 * Composition root: binds the application's ports to their infrastructure
 * adapters. The rest of the app receives repositories from here (via props /
 * hook arguments) and never imports `infrastructure/` directly.
 */
export const repositories: {
  expenses: ExpenseRepository
  budgets: BudgetRepository
  import: ImportRepository
} = {
  expenses: httpExpenseRepository,
  budgets: httpBudgetRepository,
  import: httpImportRepository,
}
