import Icon from './ui/Icon'

const TONE_TEXT = {
  positive: 'text-emerald-600 dark:text-emerald-400',
  negative: 'text-red-600 dark:text-red-400',
  neutral: 'text-slate-900 dark:text-slate-50',
}

const TONE_ICON_BG = {
  positive: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300',
  negative: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',
  neutral: 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300',
}

// KPI-style stat card for dashboard headline numbers.
export default function StatCard({ label, value, sub, tone, icon = 'insights', className = '' }) {
  const toneKey = tone === 'positive' ? 'positive' : tone === 'negative' ? 'negative' : 'neutral'

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-e1 transition-all duration-250 hover:shadow-e2 dark:border-slate-700 dark:bg-slate-800 ${className}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${TONE_ICON_BG[toneKey]}`}>
          <Icon name={icon} className="text-[16px]" />
        </span>
      </div>
      <p className={`break-words text-lg font-semibold sm:text-xl ${TONE_TEXT[toneKey]}`}>{value}</p>
      {sub && <p className="mt-0.5 break-words text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
    </div>
  )
}
