import { useState } from 'react'
import { useExpenseTracker } from './application/useExpenseTracker'
import { AddExpenseModal } from './presentation/components/AddExpenseModal'
import { CategoryOverview } from './presentation/components/CategoryOverview'
import { Sidebar, type AppView } from './presentation/components/Sidebar'
import { SummaryCards } from './presentation/components/SummaryCards'
import { TransactionList } from './presentation/components/TransactionList'
import { currentMonthLabel } from './presentation/formatters'
import './App.css'

function App() {
  const tracker = useExpenseTracker()
  const [view, setView] = useState<AppView>('Overview')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  return (
    <div className="app-shell">
      <Sidebar activeView={view} remaining={tracker.remaining} onViewChange={setView} />
      <main className="main-content">
        <header className="topbar">
          <div><p className="eyebrow">{currentMonthLabel}</p><h1>{view === 'Overview' ? 'Your spending overview' : 'Transactions'}</h1></div>
          <button className="primary-button" onClick={() => setIsAddModalOpen(true)} disabled={tracker.status !== 'ready'}><span>＋</span> Add expense</button>
        </header>

        {tracker.actionError && (
          <div className="banner error" role="alert">
            <span>{tracker.actionError}</span>
            <button className="text-button" onClick={tracker.dismissActionError}>Dismiss</button>
          </div>
        )}

        {tracker.status === 'loading' && <div className="state-message">Loading your expenses…</div>}

        {tracker.status === 'error' && (
          <div className="state-message error">
            <p>{tracker.loadError}</p>
            <button className="secondary-button" onClick={tracker.reload}>Try again</button>
          </div>
        )}

        {tracker.status === 'ready' && (
          <>
            {view === 'Overview' && (
              <>
                <SummaryCards expenseCount={tracker.expenses.length} total={tracker.total} budget={tracker.monthBudget} remaining={tracker.remaining} />
                <CategoryOverview summaries={tracker.categorySummaries} onViewAll={() => setView('Transactions')} />
              </>
            )}

            <TransactionList
              view={view}
              expenses={tracker.visibleExpenses}
              search={tracker.search}
              filter={tracker.filter}
              onSearchChange={tracker.setSearch}
              onFilterChange={tracker.setFilter}
              onRemove={tracker.removeExpense}
              onAdd={() => setIsAddModalOpen(true)}
            />
          </>
        )}
      </main>
      {isAddModalOpen && <AddExpenseModal onAdd={tracker.addExpense} onClose={() => setIsAddModalOpen(false)} />}
    </div>
  )
}

export default App
