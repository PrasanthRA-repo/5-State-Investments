import { useData } from '../context/DataContext'
import { recentTransactions, formatCurrency } from '../utils/calculations'
import EmptyState from './ui/EmptyState'
import Icon from './ui/Icon'

const TYPE_ICONS = {
  Contribution: 'add_circle',
  Lending: 'handshake',
  'Stock Investment': 'trending_up',
  'Real Estate Investment': 'home_work',
  Withdrawal: 'remove_circle',
  Expense: 'receipt_long',
  'Loan Repayment Received': 'payments',
  'Dividend/Return': 'redeem',
  Transfer: 'swap_horiz',
}

// Recent activity rendered as a timeline -- a connecting line down the left
// with an icon dot per entry, MD3-style.
export default function RecentTransactions({ count = 8 }) {
  const { members, transactions } = useData()
  const recent = recentTransactions(transactions, count)
  const memberName = (id) => members.find((m) => m.id === id)?.name || '—'

  if (recent.length === 0) {
    return <EmptyState icon="history" title="No transactions yet" />
  }

  return (
    <ul className="relative">
      {recent.map((t, i) => (
        <li key={t.id} className="relative flex gap-3 pb-4 last:pb-0">
          {i < recent.length - 1 && (
            <span className="absolute left-[15px] top-8 h-[calc(100%-1.25rem)] w-px bg-slate-200 dark:bg-slate-700" />
          )}
          <span className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
            <Icon name={TYPE_ICONS[t.type] || 'receipt_long'} className="text-[17px]" />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                {t.type} <span className="font-normal text-slate-400 dark:text-slate-500">· {t.category}</span>
              </p>
              <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(t.amount)}
              </span>
            </div>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {t.date} · {memberName(t.member_id)}
              {t.linked_asset ? ` · ${t.linked_asset}` : ''}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
