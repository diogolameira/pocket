import { formatCurrency } from '../formatters'

export type AppView = 'Overview' | 'Transactions'

type SidebarProps = {
  activeView: AppView
  remaining: number
  onViewChange: (view: AppView) => void
}

export function Sidebar({ activeView, remaining, onViewChange }: SidebarProps) {
  const views: AppView[] = ['Overview', 'Transactions']

  return (
    <aside className="sidebar">
      <button className="brand" onClick={() => onViewChange('Overview')} aria-label="Pocket home">
        <span className="brand-mark">P</span><span>Pocket</span>
      </button>
      <nav aria-label="Main navigation">
        {views.map(view => (
          <button key={view} className={activeView === view ? 'nav-item active' : 'nav-item'} onClick={() => onViewChange(view)}>
            <span>{view === 'Overview' ? '⌁' : '≡'}</span>{view}
          </button>
        ))}
      </nav>
      <div className="sidebar-tip">
        <span className="tip-icon">↘</span>
        <strong>Monthly outlook</strong>
        <p>{remaining >= 0 ? `${formatCurrency(remaining)} remains in your budget.` : `${formatCurrency(Math.abs(remaining))} over budget.`}</p>
      </div>
      <div className="profile">
        <span className="avatar">P</span>
        <div><strong>My pocket</strong><small>Personal workspace</small></div>
      </div>
    </aside>
  )
}
