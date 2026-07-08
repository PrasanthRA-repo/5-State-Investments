import { CATEGORY_COLORS, CATEGORY_ICONS } from '../constants'
import { formatCurrency } from '../utils/calculations'
import Card from './ui/Card'

function Metric({ label, value, tone }) {
  const toneClass =
    tone === 'positive'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'negative'
      ? 'text-red-600 dark:text-red-400'
      : 'text-slate-900 dark:text-slate-100'
  return (
    <div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`text-sm font-semibold ${toneClass}`}>{value}</p>
    </div>
  )
}

function pctString(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`
}

function toneFor(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return undefined
  return v > 0 ? 'positive' : v < 0 ? 'negative' : undefined
}

export default function CategoryPerformanceCard({ performance }) {
  const { category, invested, current, returnsReceived, absoluteReturns, absoluteReturnsPct, xirr, cagr, positions, hasData } =
    performance
  const color = CATEGORY_COLORS[category] || '#94a3b8'
  const icon = CATEGORY_ICONS[category] || '📊'

  return (
    <Card accentColor={color} hoverable padding="p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg leading-none">{icon}</span>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{category}</h3>
      </div>

      {!hasData ? (
        <p className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">No data yet</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Invested (outstanding)" value={formatCurrency(invested)} />
          <Metric label="Current value" value={formatCurrency(current)} />
          {returnsReceived > 0 && (
            <Metric label="Distributions received" value={formatCurrency(returnsReceived)} tone="positive" />
          )}
          <Metric
            label="Absolute returns"
            value={`${formatCurrency(absoluteReturns)} (${pctString(absoluteReturnsPct)})`}
            tone={toneFor(absoluteReturns)}
          />
          <Metric label="XIRR" value={pctString(xirr)} tone={toneFor(xirr)} />
          <Metric label="CAGR" value={pctString(cagr)} tone={toneFor(cagr)} />
          <Metric label="Positions" value={String(positions)} />
        </div>
      )}
    </Card>
  )
}
