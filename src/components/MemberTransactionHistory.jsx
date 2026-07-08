import { useData } from '../context/DataContext'
import { memberTransactions, formatCurrency } from '../utils/calculations'
import EmptyState from './ui/EmptyState'
import Chip from './ui/Chip'

export default function MemberTransactionHistory({ memberId }) {
  const { transactions } = useData()
  const rows = memberTransactions(transactions, memberId)

  if (rows.length === 0) {
    return <EmptyState icon="receipt_long" title="No transactions logged by this member yet" />
  }

  return (
    <div>
      {/* Mobile: stacked cards. Desktop/tablet: table. */}
      <div className="space-y-2 sm:hidden">
        {rows.map((t) => (
          <div key={t.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {t.type} <span className="font-normal text-slate-400 dark:text-slate-500">· {t.category}</span>
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t.date}</p>
              </div>
              <span className="whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(t.amount)}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <Chip tone="neutral">{t.status}</Chip>
              {t.linked_asset && <span>{t.linked_asset}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <th className="py-2 px-2">Date</th>
              <th className="py-2 px-2">Type</th>
              <th className="py-2 px-2">Category</th>
              <th className="py-2 px-2 text-right">Amount</th>
              <th className="py-2 px-2">Status</th>
              <th className="py-2 px-2">Linked asset</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr
                key={t.id}
                className="border-b border-slate-100 transition-colors duration-150 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-700/40"
              >
                <td className="py-2 px-2 whitespace-nowrap text-slate-700 dark:text-slate-300">{t.date}</td>
                <td className="py-2 px-2 whitespace-nowrap text-slate-700 dark:text-slate-300">{t.type}</td>
                <td className="py-2 px-2 whitespace-nowrap text-slate-700 dark:text-slate-300">{t.category}</td>
                <td className="py-2 px-2 text-right whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">
                  {formatCurrency(t.amount)}
                </td>
                <td className="py-2 px-2 whitespace-nowrap text-slate-700 dark:text-slate-300">{t.status}</td>
                <td className="py-2 px-2 whitespace-nowrap text-slate-500 dark:text-slate-400">
                  {t.linked_asset || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
