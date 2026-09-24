export const categories = [
  'Groceries',
  'Restaurants & Cafes',
  'Transport',
  'Fuel',
  'Housing & Utilities',
  'Subscriptions',
  'Health',
  'Shopping',
  'Entertainment',
  'Travel',
  'Income',
  'Other',
] as const

export type Category = (typeof categories)[number]

/** Every category except `Income` — the ones spending is tracked against. */
export const spendingCategories: Category[] = categories.filter(category => category !== 'Income')

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
  Groceries: '◒',
  'Restaurants & Cafes': '☕',
  Transport: '↗',
  Fuel: '⛽',
  'Housing & Utilities': '⌂',
  Subscriptions: '▣',
  Health: '✚',
  Shopping: '◇',
  Entertainment: '▶',
  Travel: '✈',
  Income: '⊕',
  Other: '◌',
}

/** Chart colours, aligned with the category accents used in the stylesheet. */
export const categoryColors: Record<Category, string> = {
  Groceries: '#8a5a23',
  'Restaurants & Cafes': '#a15c2e',
  Transport: '#496f87',
  Fuel: '#b0522e',
  'Housing & Utilities': '#4f7a50',
  Subscriptions: '#9a5c59',
  Health: '#b3474b',
  Shopping: '#6c5794',
  Entertainment: '#a34a86',
  Travel: '#2f8a72',
  Income: '#3f7a42',
  Other: '#6b6b6b',
}

/**
 * A CSS-safe slug for a category, used as a class name (e.g. for per-category
 * icon tints). "Restaurants & Cafes" -> "restaurants-cafes".
 */
export function categorySlug(category: Category): string {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Fallback budgets used before the server responds (or if it has none stored).
 * The persisted values from `GET /api/budgets` are the source of truth.
 * `Income` has no meaningful budget — it's kept at 0 and never shown for editing.
 */
export const defaultCategoryBudgets: Budgets = {
  Groceries: 400,
  'Restaurants & Cafes': 150,
  Transport: 100,
  Fuel: 120,
  'Housing & Utilities': 650,
  Subscriptions: 60,
  Health: 100,
  Shopping: 200,
  Entertainment: 80,
  Travel: 100,
  Income: 0,
  Other: 50,
}

export function calculateTotal(expenses: Expense[]): number {
  return expenses.reduce((total, expense) => total + expense.amount, 0)
}

/** Total spending, excluding `Income` rows (money in isn't money spent). */
export function calculateSpendTotal(expenses: Expense[]): number {
  return calculateTotal(expenses.filter(expense => expense.category !== 'Income'))
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

/** One row per spending category (`Income` excluded) — used by budget
 *  progress cards and the category breakdown chart. */
export function summariseByCategory(expenses: Expense[], budgets: Budgets): CategorySummary[] {
  return spendingCategories.map(category => ({
    category,
    total: calculateCategoryTotal(expenses, category),
    budget: budgets[category] ?? 0,
  }))
}
