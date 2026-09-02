import { daysInMonth, elapsedDaysInMonth, isCurrentMonth, type MonthKey } from '../../domain/month'
import { formatCurrency, formatPercent } from '../formatters'

type SummaryCardsProps = {
  expenseCount: number
  total: number
  budget: number
  remaining: number
  selectedMonth: MonthKey
}

export function SummaryCards({ expenseCount, total, budget, remaining, selectedMonth }: SummaryCardsProps) {
  const isCurrent = isCurrentMonth(selectedMonth)
  const totalDays = daysInMonth(selectedMonth)
  const elapsed = elapsedDaysInMonth(selectedMonth)
  const daysLeft = isCurrent ? Math.max(totalDays - elapsed + 1, 1) : 0
  const dailyAverage = elapsed > 0 ? total / elapsed : 0
  const percentage = budget > 0 ? (total / budget) * 100 : 0

  return (
    <section className="summary-grid" aria-label="Monthly summary">
      <article className="summary-card featured">
        <div className="summary-label"><span className="summary-icon">↗</span><span>Spent<small>Across {expenseCount} {expenseCount === 1 ? 'expense' : 'expenses'}</small></span></div>
        <strong>{formatCurrency(total)}</strong>
        <div className="progress"><span style={{ width: `${Math.min(percentage, 100)}%` }} /></div>
        <p>{formatPercent(percentage)} of {formatCurrency(budget)} monthly budget</p>
      </article>
      <article className="summary-card">
        <div className="summary-label"><span className="summary-icon pale">◎</span><span>Daily average<small>{isCurrent ? `Over ${elapsed} days so far` : `Across ${totalDays} days`}</small></span></div>
        <strong>{formatCurrency(dailyAverage)}</strong>
        <span className="trend">{isCurrent ? 'This month to date' : 'Full month'}</span>
      </article>
      <article className="summary-card">
        <div className="summary-label"><span className="summary-icon pale">◫</span><span>{remaining >= 0 ? 'Left to spend' : 'Over budget'}<small>{isCurrent ? 'Until month end' : 'For the month'}</small></span></div>
        <strong>{formatCurrency(Math.abs(remaining))}</strong>
        <span className="trend">{daysLeft > 0 ? <><b>{formatCurrency(remaining / daysLeft)}</b> per day</> : 'Month complete'}</span>
      </article>
    </section>
  )
}
