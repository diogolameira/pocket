import { useCallback, useEffect, useMemo, useState } from 'react'
import { TREND_MONTHS } from '../config'
import type { ExpensePatch, ExpenseRepository } from './expenseRepository'
import {
  calculateSpendTotal,
  summariseByCategory,
  totalBudget,
  type Budgets,
  type Category,
  type Expense,
  type NewExpense,
} from '../domain/expense'
import {
  addMonths,
  currentMonthKey,
  formatMonthLong,
  isCurrentMonth,
  isFutureMonth,
  lastMonths,
  monthKeyFromDate,
  type MonthKey,
} from '../domain/month'

export type ExpenseFilter = 'All' | Category
export type LoadStatus = 'loading' | 'ready' | 'error'

export type TrendPoint = { month: MonthKey; total: number }

function messageFrom(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Something went wrong.'
}

export function useExpenseTracker(budgets: Budgets, repository: ExpenseRepository) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ExpenseFilter>('All')
  const [selectedMonth, setSelectedMonth] = useState<MonthKey>(currentMonthKey)

  const fetchExpenses = useCallback(async () => {
    try {
      setExpenses(await repository.list())
      setStatus('ready')
    } catch (error) {
      setLoadError(messageFrom(error))
      setStatus('error')
    }
  }, [repository])

  useEffect(() => {
    // Fetch-on-mount: state is set after an await, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchExpenses()
  }, [fetchExpenses])

  const reload = useCallback(async () => {
    setStatus('loading')
    setLoadError(null)
    await fetchExpenses()
  }, [fetchExpenses])

  const monthExpenses = useMemo(
    () => expenses.filter(expense => monthKeyFromDate(expense.date) === selectedMonth),
    [expenses, selectedMonth],
  )

  const total = useMemo(() => calculateSpendTotal(monthExpenses), [monthExpenses])
  const monthBudget = useMemo(() => totalBudget(budgets), [budgets])
  const categorySummaries = useMemo(
    () => summariseByCategory(monthExpenses, budgets),
    [monthExpenses, budgets],
  )

  const visibleExpenses = useMemo(() => monthExpenses.filter(expense => {
    const matchesCategory = filter === 'All' || expense.category === filter
    const searchableText = `${expense.merchant} ${expense.note ?? ''}`.toLowerCase()
    return matchesCategory && searchableText.includes(search.trim().toLowerCase())
  }), [monthExpenses, filter, search])

  const trend = useMemo<TrendPoint[]>(() => {
    const totalsByMonth = new Map<MonthKey, number>()
    for (const expense of expenses) {
      if (expense.category === 'Income') continue
      const key = monthKeyFromDate(expense.date)
      totalsByMonth.set(key, (totalsByMonth.get(key) ?? 0) + expense.amount)
    }
    return lastMonths(selectedMonth, TREND_MONTHS).map(month => ({
      month,
      total: totalsByMonth.get(month) ?? 0,
    }))
  }, [expenses, selectedMonth])

  const goToMonth = useCallback((month: MonthKey) => {
    if (!isFutureMonth(month)) setSelectedMonth(month)
  }, [])
  const goToPreviousMonth = useCallback(
    () => setSelectedMonth(current => addMonths(current, -1)),
    [],
  )
  const goToNextMonth = useCallback(
    () => setSelectedMonth(current => {
      const next = addMonths(current, 1)
      return isFutureMonth(next) ? current : next
    }),
    [],
  )
  const resetToCurrentMonth = useCallback(() => setSelectedMonth(currentMonthKey()), [])

  const addExpense = useCallback(async (newExpense: NewExpense) => {
    setActionError(null)
    const created = await repository.create(newExpense)
    setExpenses(current => [created, ...current])
    setSelectedMonth(monthKeyFromDate(created.date))
  }, [repository])

  const updateExpense = useCallback(async (id: string, patch: ExpensePatch) => {
    setActionError(null)
    const updated = await repository.update(id, patch)
    setExpenses(current => current.map(expense => (expense.id === id ? updated : expense)))
    setSelectedMonth(monthKeyFromDate(updated.date))
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
    monthExpenses,
    visibleExpenses,
    status,
    loadError,
    actionError,
    dismissActionError: () => setActionError(null),
    reload,

    selectedMonth,
    monthLabel: formatMonthLong(selectedMonth),
    isViewingCurrentMonth: isCurrentMonth(selectedMonth),
    canGoToNextMonth: !isFutureMonth(addMonths(selectedMonth, 1)),
    goToMonth,
    goToPreviousMonth,
    goToNextMonth,
    resetToCurrentMonth,

    total,
    monthBudget,
    remaining: monthBudget - total,
    categorySummaries,
    trend,

    search,
    filter,
    setSearch,
    setFilter,
    addExpense,
    updateExpense,
    removeExpense,
  }
}
