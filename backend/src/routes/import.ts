import { Router } from 'express'
import { AiNotConfiguredError } from '../ai/client.js'
import { extractTransactions } from '../ai/extractTransactions.js'
import { wrap } from '../http/asyncHandler.js'

/** Statements shouldn't realistically exceed this; guards against abuse. */
const MAX_TEXT_LENGTH = 300_000

export function createImportRouter(): Router {
  const router = Router()

  router.post(
    '/parse',
    wrap(async (req, res) => {
      const text = typeof req.body?.text === 'string' ? req.body.text.trim() : ''

      if (!text) {
        res.status(400).json({ error: 'Provide statement text to parse.' })
        return
      }
      if (text.length > MAX_TEXT_LENGTH) {
        res.status(400).json({ error: `Statement text is too long (max ${MAX_TEXT_LENGTH} characters).` })
        return
      }

      try {
        res.json(await extractTransactions(text))
      } catch (error) {
        if (error instanceof AiNotConfiguredError) {
          res.status(503).json({ error: error.message })
          return
        }
        throw error
      }
    }),
  )

  return router
}
