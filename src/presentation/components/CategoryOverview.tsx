import { categoryIcons, type Category } from '../../domain/expense'
import { formatCurrency } from '../formatters'

type CategorySummary = { category: Category; total: number; budget: number }

type CategoryOverviewProps = {
  summaries: CategorySummary[]
  onViewAll: () => void
}

export function CategoryOverview({ summaries, onViewAll }: CategoryOverviewProps) {
  return (
    <section className="section-block">
      <div className="section-heading">
        <div><h2>Spending by category</h2><p>Where your money is going this month.</p></div>
        <button className="text-button" onClick={onViewAll}>View all <span>→</span></button>
      </div>
      <div className="category-grid">
        {summaries.slice(0, 4).map(({ category, total, budget }) => (
          <article className="category-card" key={category}>
            <div className={`category-icon ${category.toLowerCase()}`}>{categoryIcons[category]}</div>
            <div className="category-copy"><span>{category}</span><strong>{formatCurrency(total)}</strong></div>
            <span className="category-meta">of {formatCurrency(budget)}</span>
            <div className="category-bar"><span style={{ width: `${Math.min(total / budget * 100, 100)}%` }} /></div>
          </article>
        ))}
      </div>
    </section>
  )
}
