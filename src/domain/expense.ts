export const categories = ['Food', 'Transport', 'Shopping', 'Home', 'Subscriptions', 'Health'] as const

export type Category = (typeof categories)[number]

export type Expense = {
  id: string
  merchant: string
  category: Category
  amount: number
  date: string
  note?: string
}

export type NewExpense = Omit<Expense, 'id'>

export const categoryIcons: Record<Category, string> = {
  Food: '◒',
  Transport: '↗',
  Shopping: '◇',
  Home: '⌂',
  Subscriptions: '▣',
  Health: '✚',
}

export const categoryBudgets: Record<Category, number> = {
  Food: 450,
  Transport: 180,
  Shopping: 300,
  Home: 650,
  Subscriptions: 120,
  Health: 160,
}

export function calculateTotal(expenses: Expense[]): number {
  return expenses.reduce((total, expense) => total + expense.amount, 0)
}

export function calculateCategoryTotal(expenses: Expense[], category: Category): number {
  return calculateTotal(expenses.filter(expense => expense.category === category))
}
