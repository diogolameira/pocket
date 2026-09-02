import { Router, type Request, type Response, type NextFunction } from 'express'
import { parseExpensePatch, parseNewExpense } from '../domain/expense.js'
import type { ExpenseRepository } from '../repositories/expenseRepository.js'

/** Express param values are loosely typed; narrow to a plain string. */
function idParam(req: Request): string {
  return String(req.params.id)
}

/** Wrap an async handler so rejected promises reach the error middleware. */
function wrap(
  handler: (req: Request, res: Response) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res).catch(next)
  }
}

export function createExpensesRouter(repo: ExpenseRepository): Router {
  const router = Router()

  router.get(
    '/',
    wrap(async (_req, res) => {
      res.json(await repo.list())
    }),
  )

  router.get(
    '/:id',
    wrap(async (req, res) => {
      const expense = await repo.findById(idParam(req))
      if (!expense) {
        res.status(404).json({ error: 'Expense not found.' })
        return
      }
      res.json(expense)
    }),
  )

  router.post(
    '/',
    wrap(async (req, res) => {
      const parsed = parseNewExpense(req.body)
      if (!parsed.ok) {
        res.status(400).json({ error: 'Invalid expense.', details: parsed.errors })
        return
      }
      const created = await repo.create(parsed.value)
      res.status(201).json(created)
    }),
  )

  router.patch(
    '/:id',
    wrap(async (req, res) => {
      const parsed = parseExpensePatch(req.body)
      if (!parsed.ok) {
        res.status(400).json({ error: 'Invalid update.', details: parsed.errors })
        return
      }
      const updated = await repo.update(idParam(req), parsed.value)
      if (!updated) {
        res.status(404).json({ error: 'Expense not found.' })
        return
      }
      res.json(updated)
    }),
  )

  router.delete(
    '/:id',
    wrap(async (req, res) => {
      const removed = await repo.remove(idParam(req))
      if (!removed) {
        res.status(404).json({ error: 'Expense not found.' })
        return
      }
      res.status(204).end()
    }),
  )

  return router
}
