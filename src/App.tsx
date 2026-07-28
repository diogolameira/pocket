import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Category = 'Food' | 'Transport' | 'Shopping' | 'Home' | 'Subscriptions' | 'Health'

type Expense = {
  id: number
  merchant: string
  category: Category
  amount: number
  date: string
  note?: string
}

const categories: Category[] = ['Food', 'Transport', 'Shopping', 'Home', 'Subscriptions', 'Health']
const categoryIcons: Record<Category, string> = {
  Food: '◒',
  Transport: '↗',
  Shopping: '◇',
  Home: '⌂',
  Subscriptions: '▣',
  Health: '✚',
}
const budgets: Record<Category, number> = {
  Food: 450,
  Transport: 180,
  Shopping: 300,
  Home: 650,
  Subscriptions: 120,
  Health: 160,
}

const initialExpenses: Expense[] = [
  { id: 1, merchant: 'Manteigaria', category: 'Food', amount: 7.8, date: '2026-07-28', note: 'Coffee & pastries' },
  { id: 2, merchant: 'Continente', category: 'Food', amount: 54.32, date: '2026-07-27', note: 'Weekly groceries' },
  { id: 3, merchant: 'Metro Lisboa', category: 'Transport', amount: 40, date: '2026-07-26', note: 'Monthly pass' },
  { id: 4, merchant: 'IKEA', category: 'Home', amount: 86.5, date: '2026-07-24', note: 'Desk lamp' },
  { id: 5, merchant: 'Spotify', category: 'Subscriptions', amount: 7.99, date: '2026-07-22' },
  { id: 6, merchant: 'Farmácia Central', category: 'Health', amount: 18.45, date: '2026-07-20' },
  { id: 7, merchant: 'Zara', category: 'Shopping', amount: 42.95, date: '2026-07-18' },
]

const euro = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' })
const shortDate = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' })

function loadExpenses() {
  try {
    const saved = localStorage.getItem('pocket-expenses')
    return saved ? (JSON.parse(saved) as Expense[]) : initialExpenses
  } catch {
    return initialExpenses
  }
}

function App() {
  const [expenses, setExpenses] = useState<Expense[]>(loadExpenses)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'All' | Category>('All')
  const [isAdding, setIsAdding] = useState(false)
  const [view, setView] = useState<'Overview' | 'Transactions'>('Overview')

  useEffect(() => {
    localStorage.setItem('pocket-expenses', JSON.stringify(expenses))
  }, [expenses])

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const monthBudget = Object.values(budgets).reduce((sum, amount) => sum + amount, 0)
  const remaining = monthBudget - total

  const categoryTotals = useMemo(() => categories.map(category => ({
    category,
    total: expenses.filter(expense => expense.category === category).reduce((sum, expense) => sum + expense.amount, 0),
    budget: budgets[category],
  })).sort((a, b) => b.total - a.total), [expenses])

  const visibleExpenses = expenses.filter(expense => {
    const matchesFilter = filter === 'All' || expense.category === filter
    const matchesSearch = `${expense.merchant} ${expense.note ?? ''}`.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const amount = Number(form.get('amount'))
    if (!amount || amount <= 0) return
    const expense: Expense = {
      id: Date.now(),
      merchant: String(form.get('merchant')).trim(),
      amount,
      category: form.get('category') as Category,
      date: String(form.get('date')),
      note: String(form.get('note')).trim(),
    }
    setExpenses(current => [expense, ...current])
    setIsAdding(false)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setView('Overview')} aria-label="Pocket home">
          <span className="brand-mark">P</span>
          <span>Pocket</span>
        </button>

        <nav aria-label="Main navigation">
          {(['Overview', 'Transactions'] as const).map(item => (
            <button key={item} className={view === item ? 'nav-item active' : 'nav-item'} onClick={() => setView(item)}>
              <span>{item === 'Overview' ? '⌁' : '≡'}</span>{item}
            </button>
          ))}
        </nav>

        <div className="sidebar-tip">
          <span className="tip-icon">↘</span>
          <strong>Nice work</strong>
          <p>You’re on track to save {euro.format(Math.max(remaining, 0))} this month.</p>
        </div>

        <div className="profile">
          <span className="avatar">DL</span>
          <div><strong>My pocket</strong><small>Personal workspace</small></div>
          <span className="more">•••</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">JULY 2026</p>
            <h1>{view === 'Overview' ? 'Good morning, Diogo' : 'Transactions'}</h1>
          </div>
          <button className="primary-button" onClick={() => setIsAdding(true)}><span>＋</span> Add expense</button>
        </header>

        {view === 'Overview' && (
          <>
            <section className="summary-grid" aria-label="Monthly summary">
              <article className="summary-card featured">
                <div className="summary-label"><span className="summary-icon">↗</span><span>Spent this month<small>Across {expenses.length} expenses</small></span></div>
                <strong>{euro.format(total)}</strong>
                <div className="progress"><span style={{ width: `${Math.min((total / monthBudget) * 100, 100)}%` }} /></div>
                <p>{Math.round((total / monthBudget) * 100)}% of {euro.format(monthBudget)} monthly budget</p>
              </article>
              <article className="summary-card">
                <div className="summary-label"><span className="summary-icon pale">◎</span><span>Daily average<small>Based on this month</small></span></div>
                <strong>{euro.format(total / 28)}</strong>
                <span className="trend down">↓ 12% <em>vs last month</em></span>
              </article>
              <article className="summary-card">
                <div className="summary-label"><span className="summary-icon pale">◫</span><span>Left to spend<small>Until 31 July</small></span></div>
                <strong>{euro.format(remaining)}</strong>
                <span className="trend"><b>{euro.format(remaining / 4)}</b> per day</span>
              </article>
            </section>

            <section className="section-block">
              <div className="section-heading">
                <div><h2>Spending by category</h2><p>Where your money is going this month.</p></div>
                <button className="text-button" onClick={() => setView('Transactions')}>View all <span>→</span></button>
              </div>
              <div className="category-grid">
                {categoryTotals.slice(0, 4).map(({ category, total: categoryTotal, budget }) => (
                  <article className="category-card" key={category}>
                    <div className={`category-icon ${category.toLowerCase()}`}>{categoryIcons[category]}</div>
                    <div className="category-copy"><span>{category}</span><strong>{euro.format(categoryTotal)}</strong></div>
                    <span className="category-meta">of {euro.format(budget)}</span>
                    <div className="category-bar"><span style={{ width: `${Math.min(categoryTotal / budget * 100, 100)}%` }} /></div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        <section className="section-block transactions">
          <div className="section-heading transaction-heading">
            <div><h2>{view === 'Overview' ? 'Recent transactions' : 'All transactions'}</h2><p>{visibleExpenses.length} expenses this month.</p></div>
            <div className="table-tools">
              <label className="search"><span>⌕</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search expenses" /></label>
              <select value={filter} onChange={event => setFilter(event.target.value as 'All' | Category)} aria-label="Filter by category">
                <option>All</option>{categories.map(category => <option key={category}>{category}</option>)}
              </select>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Merchant</th><th>Category</th><th>Date</th><th>Amount</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {visibleExpenses.slice(0, view === 'Overview' ? 5 : undefined).map(expense => (
                  <tr key={expense.id}>
                    <td><div className="merchant"><span className={`merchant-icon ${expense.category.toLowerCase()}`}>{categoryIcons[expense.category]}</span><span><strong>{expense.merchant}</strong><small>{expense.note || 'Personal expense'}</small></span></div></td>
                    <td><span className="tag">{expense.category}</span></td>
                    <td>{shortDate.format(new Date(`${expense.date}T12:00:00`))}</td>
                    <td className="amount">−{euro.format(expense.amount)}</td>
                    <td><button className="delete-button" onClick={() => setExpenses(current => current.filter(item => item.id !== expense.id))} aria-label={`Delete ${expense.merchant}`}>×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visibleExpenses.length === 0 && <div className="empty-state"><strong>No expenses found</strong><span>Try a different search or category.</span></div>}
          </div>
        </section>
      </main>

      {isAdding && (
        <div className="modal-backdrop" onMouseDown={() => setIsAdding(false)}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="add-title" onMouseDown={event => event.stopPropagation()}>
            <div className="modal-header"><div><p className="eyebrow">NEW TRANSACTION</p><h2 id="add-title">Add an expense</h2></div><button onClick={() => setIsAdding(false)} aria-label="Close">×</button></div>
            <form onSubmit={addExpense}>
              <label>Merchant<input name="merchant" placeholder="e.g. Local market" required autoFocus /></label>
              <div className="form-row">
                <label>Amount (€)<input name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" required /></label>
                <label>Date<input name="date" type="date" defaultValue="2026-07-28" required /></label>
              </div>
              <label>Category<select name="category">{categories.map(category => <option key={category}>{category}</option>)}</select></label>
              <label>Note <span>(optional)</span><input name="note" placeholder="What was it for?" /></label>
              <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setIsAdding(false)}>Cancel</button><button className="primary-button" type="submit">Add expense</button></div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
