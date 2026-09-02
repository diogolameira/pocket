import { randomUUID } from 'node:crypto'
import type { Collection, Db, UpdateFilter } from 'mongodb'
import type { Category, Expense, ExpensePatch, NewExpense } from '../domain/expense.js'

/**
 * How an expense is stored in Mongo. `_id` is the string UUID that the API
 * exposes as `id`, so a document migrated from the frontend's `localStorage`
 * keeps its identity. Timestamps are server-managed bookkeeping.
 */
export type ExpenseDoc = {
  _id: string
  merchant: string
  category: Category
  amount: number
  date: string
  note?: string
  createdAt: Date
  updatedAt: Date
}

const COLLECTION = 'expenses'

function toExpense(doc: ExpenseDoc): Expense {
  return {
    id: doc._id,
    merchant: doc.merchant,
    category: doc.category,
    amount: doc.amount,
    date: doc.date,
    ...(doc.note !== undefined ? { note: doc.note } : {}),
  }
}

export class ExpenseRepository {
  private readonly collection: Collection<ExpenseDoc>

  constructor(db: Db) {
    this.collection = db.collection<ExpenseDoc>(COLLECTION)
  }

  /** Create indexes. Idempotent — safe to run on every startup. */
  async init(): Promise<void> {
    await this.collection.createIndexes([
      { key: { date: -1 } },
      { key: { category: 1, date: -1 } },
    ])
  }

  /** Newest first, matching the frontend's ordering. */
  async list(): Promise<Expense[]> {
    const docs = await this.collection
      .find()
      .sort({ date: -1, createdAt: -1 })
      .toArray()
    return docs.map(toExpense)
  }

  async findById(id: string): Promise<Expense | null> {
    const doc = await this.collection.findOne({ _id: id })
    return doc ? toExpense(doc) : null
  }

  async create(input: NewExpense, id: string = randomUUID()): Promise<Expense> {
    const now = new Date()
    const doc: ExpenseDoc = {
      _id: id,
      merchant: input.merchant,
      category: input.category,
      amount: input.amount,
      date: input.date,
      ...(input.note !== undefined ? { note: input.note } : {}),
      createdAt: now,
      updatedAt: now,
    }
    await this.collection.insertOne(doc)
    return toExpense(doc)
  }

  async update(id: string, patch: ExpensePatch): Promise<Expense | null> {
    const set: Partial<ExpenseDoc> = { updatedAt: new Date() }
    if (patch.merchant !== undefined) set.merchant = patch.merchant
    if (patch.amount !== undefined) set.amount = patch.amount
    if (patch.category !== undefined) set.category = patch.category
    if (patch.date !== undefined) set.date = patch.date
    if (typeof patch.note === 'string') set.note = patch.note

    const update: UpdateFilter<ExpenseDoc> = { $set: set }
    if (patch.note === null) {
      update.$unset = { note: '' }
    }

    const doc = await this.collection.findOneAndUpdate({ _id: id }, update, {
      returnDocument: 'after',
    })
    return doc ? toExpense(doc) : null
  }

  async remove(id: string): Promise<boolean> {
    const { deletedCount } = await this.collection.deleteOne({ _id: id })
    return deletedCount === 1
  }

  /** Bulk insert used by the seed script; ignores documents that already exist. */
  async insertMany(expenses: Expense[]): Promise<number> {
    if (expenses.length === 0) return 0
    const now = new Date()
    const docs: ExpenseDoc[] = expenses.map(({ id, note, ...rest }) => ({
      _id: id,
      ...rest,
      ...(note !== undefined ? { note } : {}),
      createdAt: now,
      updatedAt: now,
    }))
    const result = await this.collection.insertMany(docs, { ordered: false })
    return result.insertedCount
  }

  async count(): Promise<number> {
    return this.collection.estimatedDocumentCount()
  }
}
