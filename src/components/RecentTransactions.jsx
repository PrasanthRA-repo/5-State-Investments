import { useData } from '../context/DataContext'
import { recentTransactions, formatCurrency } from '../utils/calculations'

export default function RecentTransactions({ count = 8 }) {
  const { members, transactions } = useData()
  const recent = recentTransactions(transactions, count)
  const memberName = (id) => members.find((m) => m.id === id)?.name || '—'

  if (recent.length === 0) {
    return <div className="text-sm text-gray-400 text-center py-8">No transactions yet.</div>
  }

  return (
    <ul className="divide-y divide-gray-100">
      {recent.map((t) => (
        <li key={t.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">
              {t.type} <span className="text-gray-400 font-normal">· {t.category}</span>
            </p>
            <p className="text-xs text-gray-500 truncate">
              {t.date} · {memberName(t.member_id)}
              {t.linked_asset ? ` · ${t.linked_asset}` : ''}
            </p>
          </div>
          <span className="font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(t.amount)}</span>
        </li>
      ))}
    </ul>
  )
}
