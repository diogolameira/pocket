import { useState, type FormEvent } from 'react'
import { categories, type Category, type NewExpense } from '../../domain/expense'

type AddExpenseModalProps = {
  onAdd: (expense: NewExpense) => Promise<void>
  onClose: () => void
}

function toLocalDateInputValue(date: Date): string {
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

export function AddExpenseModal({ onAdd, onClose }: AddExpenseModalProps) {
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
      await onAdd({
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
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="add-title" onMouseDown={event => event.stopPropagation()}>
        <div className="modal-header"><div><p className="eyebrow">NEW TRANSACTION</p><h2 id="add-title">Add an expense</h2></div><button onClick={onClose} aria-label="Close">×</button></div>
        <form onSubmit={handleSubmit}>
          <label>Merchant<input name="merchant" placeholder="Merchant name" required autoFocus /></label>
          <div className="form-row">
            <label>Amount (€)<input name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" required /></label>
            <label>Date<input name="date" type="date" defaultValue={toLocalDateInputValue(new Date())} required /></label>
          </div>
          <label>Category<select name="category">{categories.map(category => <option key={category}>{category}</option>)}</select></label>
          <label>Note <span>(optional)</span><input name="note" placeholder="Add context" /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose} disabled={submitting}>Cancel</button><button className="primary-button" type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Add expense'}</button></div>
        </form>
      </section>
    </div>
  )
}
