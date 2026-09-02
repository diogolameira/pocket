import type { Expense, NewExpense } from '../domain/expense'

export type ExpensePatch = Partial<NewExpense>

/**
 * Port: how the application persists expenses. The app depends only on this
 * interface; an adapter in `infrastructure/` implements it and is bound in
 * `composition.ts`, so the transport (HTTP, in-memory, …) can be swapped freely.
 */
export interface ExpenseRepository {
  list(): Promise<Expense[]>
  create(expense: NewExpense): Promise<Expense>
  update(id: string, patch: ExpensePatch): Promise<Expense>
  remove(id: string): Promise<void>
}
