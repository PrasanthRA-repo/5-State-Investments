import { useData } from '../context/DataContext'
import { idleCashByMember, formatCurrency } from '../utils/calculations'

// Shows how much idle (uninvested) cash each of the 5 members is currently
// holding. Every member's amount should add up to the group's total "Cash
// available" figure on the Overall Dashboard -- Transfers move it between
// members without changing that total.
export default function IdleCashCards() {
  const { members, transactions } = useData()
  const rows = idleCashByMember(transactions, members)

  return (
    <div>
      <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">Who's holding idle cash</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {rows.map(({ member, amount }) => (
          <div
            key={member.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-e1 transition-all duration-250 hover:shadow-e2 dark:border-slate-700 dark:bg-slate-800"
          >
            <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">{member.name}</p>
            <p
              className={`text-lg font-semibold ${
                amount < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {formatCurrency(amount)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
