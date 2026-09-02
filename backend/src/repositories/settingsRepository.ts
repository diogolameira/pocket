import type { Collection, Db } from 'mongodb'
import { defaultCategoryBudgets, type Budgets } from '../domain/expense.js'

/** Single-document settings store. Each setting is one document keyed by `_id`. */
type SettingsDoc = {
  _id: string
  budgets?: Budgets
  updatedAt: Date
}

const COLLECTION = 'settings'
const BUDGETS_ID = 'budgets'

export class SettingsRepository {
  private readonly collection: Collection<SettingsDoc>

  constructor(db: Db) {
    this.collection = db.collection<SettingsDoc>(COLLECTION)
  }

  /**
   * Stored budgets merged over the defaults, so every category always has a
   * value even if the stored document predates a newly added category.
   */
  async getBudgets(): Promise<Budgets> {
    const doc = await this.collection.findOne({ _id: BUDGETS_ID })
    return { ...defaultCategoryBudgets, ...(doc?.budgets ?? {}) }
  }

  async saveBudgets(budgets: Budgets): Promise<Budgets> {
    await this.collection.updateOne(
      { _id: BUDGETS_ID },
      { $set: { budgets, updatedAt: new Date() } },
      { upsert: true },
    )
    return budgets
  }
}
