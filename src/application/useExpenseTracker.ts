import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ApiError,
  httpExpenseRepository,
  type ExpensePatch,
  type ExpenseRepository,
} from './expenseRepository'
import {
  calculateCategoryTotal,
  calculateTotal,
  categories,
  categoryBudgets,
  type Category,
  type Expense,
  type NewExpense,
} from '../domain/expense'

export type ExpenseFilter = 'All' | Category
export type LoadStatus = 'loading' | 'ready' | 'error'

function messageFrom(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) return error.message
  return 'Something went wrong.'
}

export function useExpenseTracker(repository: ExpenseRepository = httpExpenseRepository) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ExpenseFilter>('All')

  const load = useCallback(async () => {
    setStatus('loading')
    setLoadError(null)
    try {
      setExpenses(await repository.list())
      setStatus('ready')
    } catch (error) {
      setLoadError(messageFrom(error))
      setStatus('error')
    }
  }, [repository])

  useEffect(() => {
    void load()
  }, [load])

  const total = useMemo(() => calculateTotal(expenses), [expenses])
  const monthBudget = useMemo(
    () => Object.values(categoryBudgets).reduce((sum, budget) => sum + budget, 0),
    [],
  )

  const categorySummaries = useMemo(() => categories.map(category => ({
    category,
    total: calculateCategoryTotal(expenses, category),
    budget: categoryBudgets[category],
  })), [expenses])

  const visibleExpenses = useMemo(() => expenses.filter(expense => {
    const matchesCategory = filter === 'All' || expense.category === filter
    const searchableText = `${expense.merchant} ${expense.note ?? ''}`.toLowerCase()
    return matchesCategory && searchableText.includes(search.trim().toLowerCase())
  }), [expenses, filter, search])

  const addExpense = useCallback(async (newExpense: NewExpense) => {
    setActionError(null)
    const created = await repository.create(newExpense)
    setExpenses(current => [created, ...current])
  }, [repository])

  const updateExpense = useCallback(async (id: string, patch: ExpensePatch) => {
    setActionError(null)
    const updated = await repository.update(id, patch)
    setExpenses(current => current.map(expense => (expense.id === id ? updated : expense)))
  }, [repository])

  const removeExpense = useCallback(async (id: string) => {
    setActionError(null)
    const snapshot = expenses
    setExpenses(current => current.filter(expense => expense.id !== id))
    try {
      await repository.remove(id)
    } catch (error) {
      setExpenses(snapshot)
      setActionError(messageFrom(error))
    }
  }, [expenses, repository])

  return {
    expenses,
    visibleExpenses,
    status,
    loadError,
    actionError,
    dismissActionError: () => setActionError(null),
    reload: load,
    total,
    monthBudget,
    remaining: monthBudget - total,
    categorySummaries,
    search,
    filter,
    setSearch,
    setFilter,
    addExpense,
    updateExpense,
    removeExpense,
  }
}
