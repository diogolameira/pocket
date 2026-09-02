import { useCallback, useEffect, useState } from 'react'
import { httpBudgetRepository, type BudgetRepository } from './budgetRepository'
import { defaultCategoryBudgets, type Budgets } from '../domain/expense'

export type BudgetsStatus = 'loading' | 'ready' | 'error'

function messageFrom(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export function useBudgets(repository: BudgetRepository = httpBudgetRepository) {
  const [budgets, setBudgets] = useState<Budgets>(defaultCategoryBudgets)
  const [status, setStatus] = useState<BudgetsStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  /** Bumped whenever a fresh set of budgets arrives from the server, so the
   *  editor can re-seed its draft by remounting. */
  const [revision, setRevision] = useState(0)

  const fetchBudgets = useCallback(async () => {
    try {
      setBudgets(await repository.get())
      setRevision(current => current + 1)
      setStatus('ready')
    } catch (caught) {
      setError(messageFrom(caught, 'Failed to load budgets.'))
      setStatus('error')
    }
  }, [repository])

  useEffect(() => {
    // Fetch-on-mount: state is set after an await, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchBudgets()
  }, [fetchBudgets])

  const reload = useCallback(async () => {
    setStatus('loading')
    setError(null)
    await fetchBudgets()
  }, [fetchBudgets])

  const save = useCallback(async (next: Budgets): Promise<boolean> => {
    setSaving(true)
    setError(null)
    try {
      setBudgets(await repository.save(next))
      return true
    } catch (caught) {
      setError(messageFrom(caught, 'Failed to save budgets.'))
      return false
    } finally {
      setSaving(false)
    }
  }, [repository])

  return { budgets, status, error, saving, revision, save, reload }
}
