import { APP_NAME } from '../../config'
import { formatCurrency } from '../formatters'

export type AppView = 'Overview' | 'Transactions' | 'Budgets' | 'Import'

const views: AppView[] = ['Overview', 'Transactions', 'Budgets', 'Import']
const viewIcons: Record<AppView, string> = {
  Overview: '⌁',
  Transactions: '≡',
  Budgets: '◧',
  Import: '⇧',
}

type SidebarProps = {
  activeView: AppView
  remaining: number
  onViewChange: (view: AppView) => void
}

export function Sidebar({ activeView, remaining, onViewChange }: SidebarProps) {
  return (
    <aside className="sidebar">
      <button className="brand" onClick={() => onViewChange('Overview')} aria-label={`${APP_NAME} home`}>
        <span className="brand-mark">{APP_NAME.charAt(0)}</span><span>{APP_NAME}</span>
      </button>
      <nav aria-label="Main navigation">
        {views.map(view => (
          <button key={view} className={activeView === view ? 'nav-item active' : 'nav-item'} onClick={() => onViewChange(view)}>
            <span>{viewIcons[view]}</span>{view}
          </button>
        ))}
      </nav>
      <div className="sidebar-tip">
        <span className="tip-icon">↘</span>
        <strong>Monthly outlook</strong>
        <p>{remaining >= 0 ? `${formatCurrency(remaining)} remains in your budget.` : `${formatCurrency(Math.abs(remaining))} over budget.`}</p>
      </div>
      <div className="profile">
        <span className="avatar">{APP_NAME.charAt(0)}</span>
        <div><strong>My {APP_NAME.toLowerCase()}</strong><small>Personal workspace</small></div>
      </div>
    </aside>
  )
}
