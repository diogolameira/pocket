import { categoryColors, type CategorySummary } from '../../domain/expense'
import { formatCurrency, formatCurrencyRounded, formatPercent } from '../formatters'

type CategoryDonutProps = {
  summaries: CategorySummary[]
  total: number
}

const RADIUS = 48
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function CategoryDonut({ summaries, total }: CategoryDonutProps) {
  const spent = summaries.filter(summary => summary.total > 0).sort((a, b) => b.total - a.total)

  const segments = spent.map((summary, index) => {
    const precedingTotal = spent.slice(0, index).reduce((sum, item) => sum + item.total, 0)
    const fraction = summary.total / total
    return {
      category: summary.category,
      dash: fraction * CIRCUMFERENCE,
      offset: -(precedingTotal / total) * CIRCUMFERENCE,
      share: fraction,
      amount: summary.total,
    }
  })

  return (
    <section className="chart-card">
      <div className="section-heading">
        <div>
          <h2>By category</h2>
          <p>How this month's spending splits up.</p>
        </div>
      </div>
      <div className="donut-layout">
        <svg className="donut" viewBox="0 0 120 120" role="img" aria-label="Spending by category">
          <circle cx="60" cy="60" r={RADIUS} className="donut-track" />
          {segments.map(segment => (
            <circle
              key={segment.category}
              cx="60"
              cy="60"
              r={RADIUS}
              className="donut-segment"
              stroke={categoryColors[segment.category]}
              strokeDasharray={`${segment.dash} ${CIRCUMFERENCE - segment.dash}`}
              strokeDashoffset={segment.offset}
            />
          ))}
          <text x="60" y="56" className="donut-total">{formatCurrencyRounded(total)}</text>
          <text x="60" y="72" className="donut-caption">spent</text>
        </svg>

        {segments.length > 0 ? (
          <ul className="donut-legend">
            {segments.map(segment => (
              <li key={segment.category}>
                <span className="legend-swatch" style={{ background: categoryColors[segment.category] }} />
                <span className="legend-name">{segment.category}</span>
                <span className="legend-share">{formatPercent(segment.share * 100)}</span>
                <span className="legend-amount">{formatCurrency(segment.amount)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="donut-empty">No spending recorded this month.</p>
        )}
      </div>
    </section>
  )
}
