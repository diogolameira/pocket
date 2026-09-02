import express, { type NextFunction, type Request, type Response } from 'express'
import { connect, disconnect } from './db.js'
import { env } from './env.js'
import { ExpenseRepository } from './repositories/expenseRepository.js'
import { SettingsRepository } from './repositories/settingsRepository.js'
import { createBudgetsRouter } from './routes/budgets.js'
import { createExpensesRouter } from './routes/expenses.js'

async function start() {
  const db = await connect()
  console.log(`Connected to MongoDB (db: ${env.dbName})`)

  const expenseRepository = new ExpenseRepository(db)
  await expenseRepository.init()

  const settingsRepository = new SettingsRepository(db)

  const app = express()
  app.use(express.json())

  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin
    if (env.isAllowedOrigin(origin)) {
      res.header('Access-Control-Allow-Origin', origin)
      res.header('Vary', 'Origin')
    }
    res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method === 'OPTIONS') {
      res.sendStatus(204)
      return
    }
    next()
  })

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api/expenses', createExpensesRouter(expenseRepository))
  app.use('/api/budgets', createBudgetsRouter(settingsRepository))

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found.' })
  })

  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      next(err)
      return
    }
    console.error(err)
    if (err instanceof SyntaxError && 'body' in err) {
      res.status(400).json({ error: 'Malformed JSON body.' })
      return
    }
    res.status(500).json({ error: 'Internal server error.' })
  })

  const server = app.listen(env.port, () => {
    console.log(`Backend running at http://localhost:${env.port}`)
  })

  async function shutdown(signal: string) {
    console.log(`\n${signal} received, shutting down...`)
    server.close(() => void 0)
    await disconnect()
    process.exit(0)
  }

  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))
}

start().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
