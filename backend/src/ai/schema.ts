import { z } from 'zod'
import { categories } from '../domain/expense.js'

/**
 * One transaction as extracted by the model. Unlike the persisted `Expense`,
 * `amount` is signed (negative for money out, positive for money in) — that's
 * how it reads off a statement. The review screen shows it signed; saving
 * converts it to the app's unsigned `Expense.amount` convention.
 */
export const extractedTransactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  merchant: z.string().trim().min(1, 'merchant is required'),
  amount: z.number().finite('amount must be a number').refine(value => value !== 0, 'amount cannot be zero'),
  category: z.enum(categories),
})

export type ExtractedTransaction = z.infer<typeof extractedTransactionSchema>

/** Loose top-level check: is the model's response even a JSON array? Each
 *  element is validated individually afterwards (see extractTransactions.ts). */
export const chunkResponseSchema = z.array(z.unknown())
