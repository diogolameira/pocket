/**
 * Domain model for an expense.
 *
 * Kept in sync with the frontend `src/domain/expense.ts`. The API speaks this
 * exact shape so the frontend repository can swap `localStorage` for HTTP with
 * no changes to the rest of the app.
 */

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

export type Expense = {
  id: string
  merchant: string
  category: Category
  amount: number
  date: string // ISO calendar date, `YYYY-MM-DD`
  note?: string
}

export type NewExpense = Omit<Expense, 'id'>

/**
 * A partial update. `note: null` explicitly clears the note; omitting `note`
 * leaves it untouched.
 */
export type ExpensePatch = Partial<Omit<NewExpense, 'note'>> & { note?: string | null }

export type Budgets = Record<Category, number>

/**
 * Seed values used only when a database has no stored budgets yet. Once saved,
 * the persisted values in the `settings` collection are the source of truth.
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

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && (categories as readonly string[]).includes(value)
}

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false
  const time = Date.parse(`${value}T00:00:00Z`)
  return Number.isFinite(time)
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] }

/**
 * Validate and normalise an untrusted request body into a `NewExpense`.
 * Used for both create (full body) and update (see `parseExpensePatch`).
 */
export function parseNewExpense(input: unknown): ValidationResult<NewExpense> {
  const errors: string[] = []
  const body = (input ?? {}) as Record<string, unknown>

  const merchant = typeof body.merchant === 'string' ? body.merchant.trim() : ''
  if (!merchant) errors.push('`merchant` is required.')

  const amount = typeof body.amount === 'number' ? body.amount : Number(body.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push('`amount` must be a number greater than zero.')
  }

  if (!isCategory(body.category)) {
    errors.push(`\`category\` must be one of: ${categories.join(', ')}.`)
  }

  if (!isCalendarDate(body.date)) {
    errors.push('`date` must be a valid `YYYY-MM-DD` string.')
  }

  let note: string | undefined
  if (body.note !== undefined && body.note !== null && body.note !== '') {
    if (typeof body.note !== 'string') {
      errors.push('`note` must be a string.')
    } else {
      note = body.note.trim() || undefined
    }
  }

  if (errors.length > 0) return { ok: false, errors }

  return {
    ok: true,
    value: {
      merchant,
      amount: Math.round(amount * 100) / 100,
      category: body.category as Category,
      date: body.date as string,
      ...(note !== undefined ? { note } : {}),
    },
  }
}

/**
 * Validate a partial update. Only the provided fields are validated; at least
 * one recognised field must be present.
 */
export function parseExpensePatch(input: unknown): ValidationResult<ExpensePatch> {
  const body = (input ?? {}) as Record<string, unknown>
  const patch: ExpensePatch = {}
  const errors: string[] = []

  if ('merchant' in body) {
    const merchant = typeof body.merchant === 'string' ? body.merchant.trim() : ''
    if (!merchant) errors.push('`merchant` must be a non-empty string.')
    else patch.merchant = merchant
  }

  if ('amount' in body) {
    const amount = typeof body.amount === 'number' ? body.amount : Number(body.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.push('`amount` must be a number greater than zero.')
    } else {
      patch.amount = Math.round(amount * 100) / 100
    }
  }

  if ('category' in body) {
    if (!isCategory(body.category)) {
      errors.push(`\`category\` must be one of: ${categories.join(', ')}.`)
    } else {
      patch.category = body.category
    }
  }

  if ('date' in body) {
    if (!isCalendarDate(body.date)) {
      errors.push('`date` must be a valid `YYYY-MM-DD` string.')
    } else {
      patch.date = body.date as string
    }
  }

  if ('note' in body) {
    if (body.note === undefined || body.note === null || body.note === '') {
      patch.note = null
    } else if (typeof body.note !== 'string') {
      errors.push('`note` must be a string.')
    } else {
      patch.note = body.note.trim() || null
    }
  }

  if (errors.length > 0) return { ok: false, errors }
  if (Object.keys(patch).length === 0) {
    return { ok: false, errors: ['No updatable fields provided.'] }
  }

  return { ok: true, value: patch }
}

/**
 * Validate an untrusted budgets object. Every category must be present and be a
 * finite number `>= 0`; unknown keys are ignored.
 */
export function parseBudgets(input: unknown): ValidationResult<Budgets> {
  const body = (input ?? {}) as Record<string, unknown>
  const errors: string[] = []
  const result = {} as Budgets

  for (const category of categories) {
    const raw = body[category]
    const value = typeof raw === 'number' ? raw : Number(raw)
    if (!Number.isFinite(value) || value < 0) {
      errors.push(`\`${category}\` must be a number greater than or equal to zero.`)
    } else {
      result[category] = Math.round(value * 100) / 100
    }
  }

  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, value: result }
}
