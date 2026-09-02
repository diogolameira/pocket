/**
 * Seed the database with a starter set of expenses so the app has data to
 * render on first run. Idempotent: does nothing if the collection is non-empty
 * unless invoked with `--force`, which wipes and re-inserts.
 *
 *   npm run seed
 *   npm run seed -- --force
 */
import { randomUUID } from 'node:crypto'
import { connect, disconnect, getDb } from './db.js'
import type { Expense } from './domain/expense.js'
import { ExpenseRepository } from './repositories/expenseRepository.js'

function daysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

const sampleExpenses: Expense[] = [
  { id: randomUUID(), merchant: 'Tesco', category: 'Food', amount: 42.75, date: daysAgo(1), note: 'Weekly shop' },
  { id: randomUUID(), merchant: 'Dublin Bus', category: 'Transport', amount: 2.6, date: daysAgo(1) },
  { id: randomUUID(), merchant: 'Spotify', category: 'Subscriptions', amount: 10.99, date: daysAgo(2) },
  { id: randomUUID(), merchant: 'Zara', category: 'Shopping', amount: 59.9, date: daysAgo(3), note: 'Winter jacket' },
  { id: randomUUID(), merchant: 'Electric Ireland', category: 'Home', amount: 128.4, date: daysAgo(4), note: 'Electricity bill' },
  { id: randomUUID(), merchant: 'Boots Pharmacy', category: 'Health', amount: 18.25, date: daysAgo(5) },
  { id: randomUUID(), merchant: 'Starbucks', category: 'Food', amount: 5.4, date: daysAgo(6) },
  { id: randomUUID(), merchant: 'Circle K', category: 'Transport', amount: 65.0, date: daysAgo(7), note: 'Fuel' },
  { id: randomUUID(), merchant: 'Netflix', category: 'Subscriptions', amount: 13.99, date: daysAgo(9) },
  { id: randomUUID(), merchant: 'IKEA', category: 'Home', amount: 84.3, date: daysAgo(12), note: 'Shelving' },
  { id: randomUUID(), merchant: 'Lidl', category: 'Food', amount: 31.18, date: daysAgo(14) },
  { id: randomUUID(), merchant: 'Gym membership', category: 'Health', amount: 39.0, date: daysAgo(15) },
]

async function main() {
  const force = process.argv.includes('--force')
  await connect()
  const repo = new ExpenseRepository(getDb())
  await repo.init()

  const existing = await repo.count()
  if (existing > 0 && !force) {
    console.log(`Collection already has ${existing} expense(s). Pass --force to reset.`)
    return
  }

  if (force && existing > 0) {
    await getDb().collection('expenses').deleteMany({})
    console.log(`Cleared ${existing} existing expense(s).`)
  }

  const inserted = await repo.insertMany(sampleExpenses)
  console.log(`Seeded ${inserted} expense(s).`)
}

main()
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exitCode = 1
  })
  .finally(() => disconnect())
