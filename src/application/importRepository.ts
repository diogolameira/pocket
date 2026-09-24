import type { Category } from '../domain/expense'

/**
 * One transaction as extracted from a statement. Unlike the persisted
 * `Expense`, `amount` is signed (negative for money out, positive for money
 * in) — that's how it reads on a statement. `useStatementImport` converts it
 * to the app's unsigned `NewExpense` shape when a row is saved.
 */
export type ParsedTransaction = {
  id: string
  date: string
  merchant: string
  amount: number
  category: Category
}

export type UnparsedRow = {
  reason: string
  raw?: string
}

export type ParseResult = {
  transactions: ParsedTransaction[]
  unparsed: UnparsedRow[]
}

/** Port: how the application turns raw statement text into transactions. */
export interface ImportRepository {
  parse(text: string): Promise<ParseResult>
}
