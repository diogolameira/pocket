import { useCallback, useState } from 'react'
import type { NewExpense } from '../domain/expense'
import type { ImportRepository, ParsedTransaction, UnparsedRow } from './importRepository'

export type ParseStatus = 'idle' | 'parsing' | 'ready' | 'error'
export type ReviewRowStatus = 'pending' | 'saving' | 'saved' | 'error'

export type ReviewRow = ParsedTransaction & {
  selected: boolean
  status: ReviewRowStatus
  error?: string
}

type EditableFields = Pick<ParsedTransaction, 'date' | 'merchant' | 'amount' | 'category'>

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.'
}

/** Signed statement amount -> the app's unsigned `Expense.amount` convention. */
function toNewExpense(row: ReviewRow): NewExpense {
  return { merchant: row.merchant, amount: Math.abs(row.amount), category: row.category, date: row.date }
}

/**
 * Owns the statement-import review flow: parse raw text into rows, let the
 * user edit/include-or-exclude each one, then save the selected rows through
 * the same `saveExpense` the rest of the app already uses.
 */
export function useStatementImport(repository: ImportRepository, saveExpense: (expense: NewExpense) => Promise<void>) {
  const [status, setStatus] = useState<ParseStatus>('idle')
  const [parseError, setParseError] = useState<string | null>(null)
  const [rows, setRows] = useState<ReviewRow[]>([])
  const [unparsed, setUnparsed] = useState<UnparsedRow[]>([])
  const [saving, setSaving] = useState(false)

  const parse = useCallback(async (text: string) => {
    setStatus('parsing')
    setParseError(null)
    try {
      const result = await repository.parse(text)
      setRows(result.transactions.map(transaction => ({ ...transaction, selected: true, status: 'pending' as const })))
      setUnparsed(result.unparsed)
      setStatus('ready')
    } catch (error) {
      setParseError(messageFrom(error))
      setStatus('error')
    }
  }, [repository])

  const reset = useCallback(() => {
    setStatus('idle')
    setParseError(null)
    setRows([])
    setUnparsed([])
  }, [])

  const updateRow = useCallback((id: string, patch: Partial<EditableFields>) => {
    setRows(current => current.map(row => (
      row.id === id ? { ...row, ...patch, status: 'pending', error: undefined } : row
    )))
  }, [])

  const toggleRow = useCallback((id: string) => {
    setRows(current => current.map(row => (row.id === id ? { ...row, selected: !row.selected } : row)))
  }, [])

  const toggleAll = useCallback((selected: boolean) => {
    setRows(current => current.map(row => ({ ...row, selected })))
  }, [])

  const removeRow = useCallback((id: string) => {
    setRows(current => current.filter(row => row.id !== id))
  }, [])

  const saveSelected = useCallback(async () => {
    setSaving(true)
    const targets = rows.filter(row => row.selected)

    for (const target of targets) {
      setRows(current => current.map(row => (
        row.id === target.id ? { ...row, status: 'saving', error: undefined } : row
      )))
      try {
        await saveExpense(toNewExpense(target))
        setRows(current => current.filter(row => row.id !== target.id))
      } catch (error) {
        setRows(current => current.map(row => (
          row.id === target.id ? { ...row, status: 'error', error: messageFrom(error) } : row
        )))
      }
    }

    setSaving(false)
  }, [rows, saveExpense])

  return {
    status,
    parseError,
    rows,
    unparsed,
    saving,
    selectedCount: rows.filter(row => row.selected).length,
    parse,
    reset,
    updateRow,
    toggleRow,
    toggleAll,
    removeRow,
    saveSelected,
  }
}
