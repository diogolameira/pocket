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

export type Budgets = Record<Category, number>

export const categoryIcons: Record<Category, string> = {
  Food: '◒',
  Transport: '↗',
  Shopping: '◇',
  Home: '⌂',
  Subscriptions: '▣',
  Health: '✚',
}

/** Chart colours, aligned with the category accents used in the stylesheet. */
export const categoryColors: Record<Category, string> = {
  Food: '#d8a24f',
  Transport: '#5a90b0',
  Shopping: '#8b74c0',
  Home: '#5f9e63',
  Subscriptions: '#c9736e',
  Health: '#c1854b',
}

/**
 * Fallback budgets used before the server responds (or if it has none stored).
 * The persisted values from `GET /api/budgets` are the source of truth.
 */
export const defaultCategoryBudgets: Budgets = {
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

export function totalBudget(budgets: Budgets): number {
  return categories.reduce((sum, category) => sum + (budgets[category] ?? 0), 0)
}

export type CategorySummary = {
  category: Category
  total: number
  budget: number
}

export function summariseByCategory(expenses: Expense[], budgets: Budgets): CategorySummary[] {
  return categories.map(category => ({
    category,
    total: calculateCategoryTotal(expenses, category),
    budget: budgets[category] ?? 0,
  }))
}
