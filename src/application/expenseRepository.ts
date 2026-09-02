import type { Expense } from '../domain/expense'

const STORAGE_KEY = 'pocket-expenses-v2'

export interface ExpenseRepository {
  getAll(): Expense[]
  save(expenses: Expense[]): void
}

export const localExpenseRepository: ExpenseRepository = {
  getAll() {
    try {
      const storedExpenses = localStorage.getItem(STORAGE_KEY)
      return storedExpenses ? JSON.parse(storedExpenses) as Expense[] : []
    } catch {
      return []
    }
  },
  save(expenses) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses))
  },
}
