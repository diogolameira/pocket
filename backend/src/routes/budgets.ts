import { Router } from 'express'
import { parseBudgets } from '../domain/expense.js'
import { wrap } from '../http/asyncHandler.js'
import type { SettingsRepository } from '../repositories/settingsRepository.js'

export function createBudgetsRouter(settings: SettingsRepository): Router {
  const router = Router()

  router.get(
    '/',
    wrap(async (_req, res) => {
      res.json(await settings.getBudgets())
    }),
  )

  router.put(
    '/',
    wrap(async (req, res) => {
      const parsed = parseBudgets(req.body)
      if (!parsed.ok) {
        res.status(400).json({ error: 'Invalid budgets.', details: parsed.errors })
        return
      }
      res.json(await settings.saveBudgets(parsed.value))
    }),
  )

  return router
}
