import { categoryIcons, categorySlug, type CategorySummary } from '../../domain/expense'
import { formatCurrency } from '../formatters'

type CategoryOverviewProps = {
  summaries: CategorySummary[]
  onViewAll: () => void
}

export function CategoryOverview({ summaries, onViewAll }: CategoryOverviewProps) {
  return (
    <section className="section-block">
      <div className="section-heading">
        <div><h2>Budget progress</h2><p>How each category tracks against its limit.</p></div>
        <button className="text-button" onClick={onViewAll}>Manage budgets <span>→</span></button>
      </div>
      <div className="category-grid">
        {summaries.slice(0, 4).map(({ category, total, budget }) => {
          const ratio = budget > 0 ? Math.min((total / budget) * 100, 100) : 0
          return (
            <article className="category-card" key={category}>
              <div className={`category-icon ${categorySlug(category)}`}>{categoryIcons[category]}</div>
              <div className="category-copy"><span>{category}</span><strong>{formatCurrency(total)}</strong></div>
              <span className="category-meta">of {formatCurrency(budget)}</span>
              <div className="category-bar"><span style={{ width: `${ratio}%` }} /></div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
