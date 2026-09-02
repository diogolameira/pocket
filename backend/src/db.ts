import { MongoClient, type Db } from 'mongodb'
import { env } from './env.js'

let client: MongoClient | undefined
let db: Db | undefined

/**
 * Connect once and reuse the pooled client for the life of the process.
 * Safe to call multiple times — subsequent calls return the same `Db`.
 */
export async function connect(): Promise<Db> {
  if (db) return db

  client = new MongoClient(env.mongoUri)
  await client.connect()
  db = client.db(env.dbName)

  // Fail fast if the server is unreachable.
  await db.command({ ping: 1 })

  return db
}

export function getDb(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connect() during startup.')
  }
  return db
}

export async function disconnect(): Promise<void> {
  await client?.close()
  client = undefined
  db = undefined
}
