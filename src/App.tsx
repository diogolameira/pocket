import { useState } from 'react'
import { useBudgets } from './application/useBudgets'
import { useExpenseTracker } from './application/useExpenseTracker'
import { BudgetsView } from './presentation/components/BudgetsView'
import { CategoryDonut } from './presentation/components/CategoryDonut'
import { CategoryOverview } from './presentation/components/CategoryOverview'
import { ExpenseModal } from './presentation/components/ExpenseModal'
import { MonthNavigator } from './presentation/components/MonthNavigator'
import { Sidebar, type AppView } from './presentation/components/Sidebar'
import { SummaryCards } from './presentation/components/SummaryCards'
import { TransactionList } from './presentation/components/TransactionList'
import { TrendChart } from './presentation/components/TrendChart'
import type { Expense, NewExpense } from './domain/expense'
import './App.css'

type ModalState = { mode: 'add' } | { mode: 'edit'; expense: Expense } | null

const viewTitles: Record<AppView, string> = {
  Overview: 'Your spending overview',
  Transactions: 'Transactions',
  Budgets: 'Budgets',
}

function App() {
  const budgets = useBudgets()
  const tracker = useExpenseTracker(budgets.budgets)
  const [view, setView] = useState<AppView>('Overview')
  const [modal, setModal] = useState<ModalState>(null)

  const loading = tracker.status === 'loading' || budgets.status === 'loading'
  const errored = tracker.status === 'error' || budgets.status === 'error'
  const ready = !loading && !errored
  const editingExpense = modal?.mode === 'edit' ? modal.expense : null

  function retry() {
    if (tracker.status === 'error') void tracker.reload()
    if (budgets.status === 'error') void budgets.reload()
  }

  async function submitExpense(expense: NewExpense) {
    if (editingExpense) {
      await tracker.updateExpense(editingExpense.id, expense)
    } else {
      await tracker.addExpense(expense)
    }
  }

  const transactionListProps = {
    expenses: tracker.visibleExpenses,
    search: tracker.search,
    filter: tracker.filter,
    onSearchChange: tracker.setSearch,
    onFilterChange: tracker.setFilter,
    onRemove: tracker.removeExpense,
    onEdit: (expense: Expense) => setModal({ mode: 'edit', expense }),
    onAdd: () => setModal({ mode: 'add' }),
  }

  return (
    <div className="app-shell">
      <Sidebar activeView={view} remaining={tracker.remaining} onViewChange={setView} />
      <main className="main-content">
        <header className="topbar">
          <div>
            <MonthNavigator
              label={tracker.monthLabel}
              canGoNext={tracker.canGoToNextMonth}
              isCurrent={tracker.isViewingCurrentMonth}
              onPrevious={tracker.goToPreviousMonth}
              onNext={tracker.goToNextMonth}
              onReset={tracker.resetToCurrentMonth}
            />
            <h1>{viewTitles[view]}</h1>
          </div>
          <button className="primary-button" onClick={() => setModal({ mode: 'add' })} disabled={!ready}><span>＋</span> Add expense</button>
        </header>

        {tracker.actionError && (
          <div className="banner error" role="alert">
            <span>{tracker.actionError}</span>
            <button className="text-button" onClick={tracker.dismissActionError}>Dismiss</button>
          </div>
        )}

        {loading && <div className="state-message">Loading your expenses…</div>}

        {errored && (
          <div className="state-message error">
            <p>{tracker.loadError ?? budgets.error}</p>
            <button className="secondary-button" onClick={retry}>Try again</button>
          </div>
        )}

        {ready && view === 'Overview' && (
          <>
            <SummaryCards
              expenseCount={tracker.monthExpenses.length}
              total={tracker.total}
              budget={tracker.monthBudget}
              remaining={tracker.remaining}
              selectedMonth={tracker.selectedMonth}
            />
            <div className="charts-row">
              <TrendChart data={tracker.trend} selectedMonth={tracker.selectedMonth} onSelectMonth={tracker.goToMonth} />
              <CategoryDonut summaries={tracker.categorySummaries} total={tracker.total} />
            </div>
            <CategoryOverview summaries={tracker.categorySummaries} onViewAll={() => setView('Budgets')} />
            <TransactionList view="Overview" {...transactionListProps} />
          </>
        )}

        {ready && view === 'Transactions' && (
          <TransactionList view="Transactions" {...transactionListProps} />
        )}

        {ready && view === 'Budgets' && (
          <BudgetsView
            key={budgets.revision}
            budgets={budgets.budgets}
            summaries={tracker.categorySummaries}
            monthLabel={tracker.monthLabel}
            saving={budgets.saving}
            error={budgets.error}
            onSave={budgets.save}
          />
        )}
      </main>

      {modal && (
        <ExpenseModal
          expense={editingExpense}
          onSubmit={submitExpense}
          onDelete={editingExpense ? () => { void tracker.removeExpense(editingExpense.id); setModal(null) } : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

export default App
