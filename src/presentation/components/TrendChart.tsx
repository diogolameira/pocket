import type { TrendPoint } from '../../application/useExpenseTracker'
import { formatMonthShort, type MonthKey } from '../../domain/month'
import { formatCurrency, formatCurrencyRounded } from '../formatters'

type TrendChartProps = {
  data: TrendPoint[]
  selectedMonth: MonthKey
  onSelectMonth: (month: MonthKey) => void
}

const WIDTH = 640
const HEIGHT = 220
const PAD_X = 12
const PAD_TOP = 26
const PAD_BOTTOM = 30
const PLOT_HEIGHT = HEIGHT - PAD_TOP - PAD_BOTTOM

export function TrendChart({ data, selectedMonth, onSelectMonth }: TrendChartProps) {
  const max = Math.max(...data.map(point => point.total), 1)
  const slot = (WIDTH - PAD_X * 2) / Math.max(data.length, 1)
  const barWidth = Math.min(slot * 0.5, 54)
  const baseY = PAD_TOP + PLOT_HEIGHT
  const average = data.reduce((sum, point) => sum + point.total, 0) / Math.max(data.length, 1)

  return (
    <section className="chart-card">
      <div className="section-heading">
        <div>
          <h2>Spending trend</h2>
          <p>Last {data.length} months · {formatCurrency(average)} / month on average</p>
        </div>
      </div>
      <svg
        className="trend-chart"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Monthly spending for the last months"
      >
        <line x1={PAD_X} y1={baseY} x2={WIDTH - PAD_X} y2={baseY} className="axis-line" />
        {data.map((point, index) => {
          const height = (point.total / max) * PLOT_HEIGHT
          const x = PAD_X + slot * index + (slot - barWidth) / 2
          const y = baseY - height
          const isSelected = point.month === selectedMonth
          return (
            <g
              key={point.month}
              className={isSelected ? 'trend-bar selected' : 'trend-bar'}
              onClick={() => onSelectMonth(point.month)}
              role="button"
              aria-label={`${formatMonthShort(point.month)}: ${formatCurrency(point.total)}`}
            >
              <title>{`${formatMonthShort(point.month)} — ${formatCurrency(point.total)}`}</title>
              <rect x={PAD_X + slot * index} y={PAD_TOP} width={slot} height={PLOT_HEIGHT} fill="transparent" />
              <rect x={x} y={y} width={barWidth} height={Math.max(height, 2)} rx={5} className="trend-bar-fill" />
              {point.total > 0 && (
                <text x={x + barWidth / 2} y={y - 7} className="trend-value">
                  {formatCurrencyRounded(point.total)}
                </text>
              )}
              <text x={x + barWidth / 2} y={baseY + 20} className="trend-month">
                {formatMonthShort(point.month)}
              </text>
            </g>
          )
        })}
      </svg>
    </section>
  )
}
