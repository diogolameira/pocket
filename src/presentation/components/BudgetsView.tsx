import { useState } from 'react'
import {
  categories,
  categoryIcons,
  totalBudget,
  type Budgets,
  type CategorySummary,
} from '../../domain/expense'
import { formatCurrency } from '../formatters'

type BudgetsViewProps = {
  budgets: Budgets
  summaries: CategorySummary[]
  monthLabel: string
  saving: boolean
  error: string | null
  onSave: (budgets: Budgets) => Promise<boolean>
}

export function BudgetsView({ budgets, summaries, monthLabel, saving, error, onSave }: BudgetsViewProps) {
  // Seeded once from `budgets`; the parent remounts this view (keyed on its
  // budgets revision) whenever a fresh set arrives from the server.
  const [draft, setDraft] = useState<Budgets>(budgets)
  const [justSaved, setJustSaved] = useState(false)

  const isDirty = categories.some(category => draft[category] !== budgets[category])
  const spentByCategory = new Map(summaries.map(summary => [summary.category, summary.total]))

  function setBudget(category: (typeof categories)[number], value: string) {
    setJustSaved(false)
    setDraft(current => ({ ...current, [category]: Math.max(0, Number(value) || 0) }))
  }

  async function handleSave() {
    const ok = await onSave(draft)
    if (ok) setJustSaved(true)
  }

  return (
    <section className="section-block">
      <div className="section-heading">
        <div>
          <h2>Monthly budgets</h2>
          <p>Applied to every month. Spending shown for {monthLabel}.</p>
        </div>
        <strong className="budget-total">{formatCurrency(totalBudget(draft))} / month</strong>
      </div>

      <div className="budget-list">
        {categories.map(category => {
          const limit = draft[category]
          const spent = spentByCategory.get(category) ?? 0
          const ratio = limit > 0 ? Math.min(spent / limit, 1) : 0
          const over = limit > 0 && spent > limit
          return (
            <div className="budget-row" key={category}>
              <div className={`category-icon ${category.toLowerCase()}`}>{categoryIcons[category]}</div>
              <div className="budget-row-main">
                <div className="budget-row-top">
                  <span>{category}</span>
                  <span className={over ? 'budget-spent over' : 'budget-spent'}>
                    {formatCurrency(spent)} spent
                  </span>
                </div>
                <div className="category-bar">
                  <span style={{ width: `${ratio * 100}%`, background: over ? '#b4574f' : undefined }} />
                </div>
              </div>
              <label className="budget-input">
                <span className="budget-currency">€</span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={limit}
                  onChange={event => setBudget(category, event.target.value)}
                  aria-label={`${category} monthly budget`}
                />
              </label>
            </div>
          )
        })}
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="budget-actions">
        {justSaved && !isDirty && <span className="budget-saved">Saved</span>}
        <button className="secondary-button" onClick={() => setDraft(budgets)} disabled={!isDirty || saving}>
          Reset
        </button>
        <button className="primary-button" onClick={handleSave} disabled={!isDirty || saving}>
          {saving ? 'Saving…' : 'Save budgets'}
        </button>
      </div>
    </section>
  )
}
