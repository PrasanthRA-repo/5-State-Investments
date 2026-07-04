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
      <h2 className="text-base font-semibold text-gray-900 mb-3">Who's holding idle cash</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {rows.map(({ member, amount }) => (
          <div key={member.id} className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 mb-1">{member.name}</p>
            <p className={`text-lg font-semibold ${amount < 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {formatCurrency(amount)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
