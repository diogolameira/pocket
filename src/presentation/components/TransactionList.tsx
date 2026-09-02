import { categories, categoryIcons, type Category, type Expense } from '../../domain/expense'
import type { ExpenseFilter } from '../../application/useExpenseTracker'
import type { AppView } from './Sidebar'
import { formatCurrency, formatShortDate } from '../formatters'

type TransactionListProps = {
  view: AppView
  expenses: Expense[]
  search: string
  filter: ExpenseFilter
  onSearchChange: (value: string) => void
  onFilterChange: (value: ExpenseFilter) => void
  onRemove: (id: string) => void
  onAdd: () => void
}

export function TransactionList(props: TransactionListProps) {
  const displayedExpenses = props.view === 'Overview' ? props.expenses.slice(0, 5) : props.expenses

  return (
    <section className="section-block transactions">
      <div className="section-heading transaction-heading">
        <div><h2>{props.view === 'Overview' ? 'Recent transactions' : 'All transactions'}</h2><p>{props.expenses.length} expenses found.</p></div>
        <div className="table-tools">
          <label className="search"><span>⌕</span><input value={props.search} onChange={event => props.onSearchChange(event.target.value)} placeholder="Search expenses" /></label>
          <select value={props.filter} onChange={event => props.onFilterChange(event.target.value as 'All' | Category)} aria-label="Filter by category">
            <option>All</option>{categories.map(category => <option key={category}>{category}</option>)}
          </select>
        </div>
      </div>
      <div className="table-wrap">
        {displayedExpenses.length > 0 ? (
          <table>
            <thead><tr><th>Merchant</th><th>Category</th><th>Date</th><th>Amount</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {displayedExpenses.map(expense => (
                <tr key={expense.id}>
                  <td><div className="merchant"><span className={`merchant-icon ${expense.category.toLowerCase()}`}>{categoryIcons[expense.category]}</span><span><strong>{expense.merchant}</strong>{expense.note && <small>{expense.note}</small>}</span></div></td>
                  <td><span className="tag">{expense.category}</span></td>
                  <td>{formatShortDate(new Date(`${expense.date}T12:00:00`))}</td>
                  <td className="amount">−{formatCurrency(expense.amount)}</td>
                  <td><button className="delete-button" onClick={() => props.onRemove(expense.id)} aria-label={`Delete ${expense.merchant}`}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <strong>{props.search || props.filter !== 'All' ? 'No expenses found' : 'No expenses yet'}</strong>
            <span>{props.search || props.filter !== 'All' ? 'Try a different search or category.' : 'Add your first expense to start tracking.'}</span>
            {!props.search && props.filter === 'All' && <button className="primary-button" onClick={props.onAdd}>Add first expense</button>}
          </div>
        )}
      </div>
    </section>
  )
}
