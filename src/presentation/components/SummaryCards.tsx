import { formatCurrency } from '../formatters'

type SummaryCardsProps = {
  expenseCount: number
  total: number
  budget: number
  remaining: number
}

export function SummaryCards({ expenseCount, total, budget, remaining }: SummaryCardsProps) {
  const today = new Date()
  const dayOfMonth = today.getDate()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const daysRemaining = Math.max(daysInMonth - dayOfMonth + 1, 1)
  const percentage = budget > 0 ? Math.round(total / budget * 100) : 0

  return (
    <section className="summary-grid" aria-label="Monthly summary">
      <article className="summary-card featured">
        <div className="summary-label"><span className="summary-icon">↗</span><span>Spent this month<small>Across {expenseCount} expenses</small></span></div>
        <strong>{formatCurrency(total)}</strong>
        <div className="progress"><span style={{ width: `${Math.min(percentage, 100)}%` }} /></div>
        <p>{percentage}% of {formatCurrency(budget)} monthly budget</p>
      </article>
      <article className="summary-card">
        <div className="summary-label"><span className="summary-icon pale">◎</span><span>Daily average<small>Based on this month</small></span></div>
        <strong>{formatCurrency(total / dayOfMonth)}</strong>
        <span className="trend">Calculated from your expenses</span>
      </article>
      <article className="summary-card">
        <div className="summary-label"><span className="summary-icon pale">◫</span><span>Left to spend<small>Until month end</small></span></div>
        <strong>{formatCurrency(remaining)}</strong>
        <span className="trend"><b>{formatCurrency(remaining / daysRemaining)}</b> per day</span>
      </article>
    </section>
  )
}
