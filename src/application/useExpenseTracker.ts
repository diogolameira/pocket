import { useEffect, useMemo, useState } from 'react'
import { localExpenseRepository } from './expenseRepository'
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

export function useExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>(localExpenseRepository.getAll)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ExpenseFilter>('All')

  useEffect(() => {
    localExpenseRepository.save(expenses)
  }, [expenses])

  const total = useMemo(() => calculateTotal(expenses), [expenses])
  const monthBudget = useMemo(
    () => Object.values(categoryBudgets).reduce((total, budget) => total + budget, 0),
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

  function addExpense(newExpense: NewExpense) {
    const expense: Expense = { ...newExpense, id: crypto.randomUUID() }
    setExpenses(current => [expense, ...current])
  }

  function removeExpense(id: string) {
    setExpenses(current => current.filter(expense => expense.id !== id))
  }

  return {
    expenses,
    visibleExpenses,
    total,
    monthBudget,
    remaining: monthBudget - total,
    categorySummaries,
    search,
    filter,
    setSearch,
    setFilter,
    addExpense,
    removeExpense,
  }
}
