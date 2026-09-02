import { useEffect, useState, type FormEvent } from 'react'
import { categories, type Category, type Expense, type NewExpense } from '../../domain/expense'

type ExpenseModalProps = {
  /** When set, the modal edits this expense; otherwise it creates a new one. */
  expense?: Expense | null
  onSubmit: (expense: NewExpense) => Promise<void>
  onDelete?: () => void
  onClose: () => void
}

function toLocalDateInputValue(date: Date): string {
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

export function ExpenseModal({ expense, onSubmit, onDelete, onClose }: ExpenseModalProps) {
  const isEditing = Boolean(expense)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const amount = Number(form.get('amount'))
    const merchant = String(form.get('merchant')).trim()

    if (!merchant || amount <= 0) {
      setError('Enter a merchant and an amount greater than zero.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await onSubmit({
        merchant,
        amount,
        category: form.get('category') as Category,
        date: String(form.get('date')),
        note: String(form.get('note')).trim() || undefined,
      })
      onClose()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not save the expense.')
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-modal-title"
        onMouseDown={event => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">{isEditing ? 'EDIT TRANSACTION' : 'NEW TRANSACTION'}</p>
            <h2 id="expense-modal-title">{isEditing ? 'Edit expense' : 'Add an expense'}</h2>
          </div>
          <button onClick={onClose} aria-label="Close">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>Merchant
            <input name="merchant" placeholder="Merchant name" defaultValue={expense?.merchant ?? ''} required autoFocus />
          </label>
          <div className="form-row">
            <label>Amount (€)
              <input name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" defaultValue={expense?.amount ?? ''} required />
            </label>
            <label>Date
              <input name="date" type="date" defaultValue={expense?.date ?? toLocalDateInputValue(new Date())} required />
            </label>
          </div>
          <label>Category
            <select name="category" defaultValue={expense?.category ?? categories[0]}>
              {categories.map(category => <option key={category}>{category}</option>)}
            </select>
          </label>
          <label>Note <span>(optional)</span>
            <input name="note" placeholder="Add context" defaultValue={expense?.note ?? ''} />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            {isEditing && onDelete && (
              <button type="button" className="danger-button" onClick={onDelete} disabled={submitting}>Delete</button>
            )}
            <button type="button" className="secondary-button" onClick={onClose} disabled={submitting}>Cancel</button>
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : isEditing ? 'Save changes' : 'Add expense'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
