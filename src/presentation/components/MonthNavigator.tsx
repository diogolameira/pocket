type MonthNavigatorProps = {
  label: string
  canGoNext: boolean
  isCurrent: boolean
  onPrevious: () => void
  onNext: () => void
  onReset: () => void
}

export function MonthNavigator({
  label,
  canGoNext,
  isCurrent,
  onPrevious,
  onNext,
  onReset,
}: MonthNavigatorProps) {
  return (
    <div className="month-nav">
      <button className="month-step" onClick={onPrevious} aria-label="Previous month">‹</button>
      <span className="month-label">{label}</span>
      <button
        className="month-step"
        onClick={onNext}
        disabled={!canGoNext}
        aria-label="Next month"
      >
        ›
      </button>
      {!isCurrent && (
        <button className="text-button" onClick={onReset}>This month</button>
      )}
    </div>
  )
}
