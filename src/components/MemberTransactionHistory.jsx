import { useData } from '../context/DataContext'
import { memberTransactions, formatCurrency } from '../utils/calculations'

export default function MemberTransactionHistory({ memberId }) {
  const { transactions } = useData()
  const rows = memberTransactions(transactions, memberId)

  if (rows.length === 0) {
    return <div className="text-sm text-gray-400 text-center py-8">No transactions logged by this member yet.</div>
  }

  return (
    <div>
      {/* Mobile: stacked cards. Desktop/tablet: table. */}
      <div className="sm:hidden space-y-2">
        {rows.map((t) => (
          <div key={t.id} className="border border-gray-200 rounded-xl p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {t.type} <span className="text-gray-400 font-normal">· {t.category}</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{t.date}</p>
              </div>
              <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(t.amount)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
              <span>Status: {t.status}</span>
              {t.linked_asset && <span>{t.linked_asset}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
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
              <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-2 whitespace-nowrap">{t.date}</td>
                <td className="py-2 px-2 whitespace-nowrap">{t.type}</td>
                <td className="py-2 px-2 whitespace-nowrap">{t.category}</td>
                <td className="py-2 px-2 text-right whitespace-nowrap">{formatCurrency(t.amount)}</td>
                <td className="py-2 px-2 whitespace-nowrap">{t.status}</td>
                <td className="py-2 px-2 whitespace-nowrap text-gray-500">{t.linked_asset || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
