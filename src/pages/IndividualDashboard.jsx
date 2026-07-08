import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import MemberSelector from '../components/MemberSelector'
import MemberTransactionHistory from '../components/MemberTransactionHistory'
import StatCard from '../components/StatCard'
import CategoryPieChart from '../components/CategoryPieChart'
import IdleCashCards from '../components/IdleCashCards'
import Card from '../components/ui/Card'
import { memberContribution, memberOwnershipPct, memberHoldingsShare, formatCurrency } from '../utils/calculations'

export default function IndividualDashboard() {
  const { members, transactions, holdings } = useData()
  const { currentMemberId } = useAuth()
  const [selectedId, setSelectedId] = useState(currentMemberId || members[0]?.id || '')

  const memberId = selectedId || currentMemberId
  const member = members.find((m) => m.id === memberId)

  if (!member) {
    return (
      <Card className="text-center text-slate-500 dark:text-slate-400">No members yet.</Card>
    )
  }

  const contribution = memberContribution(transactions, memberId)
  const ownershipPct = memberOwnershipPct(transactions, memberId)
  const holdingsShare = memberHoldingsShare(transactions, holdings, memberId)
  const totalShareValue = Object.values(holdingsShare).reduce((sum, v) => sum + v, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Viewing: {member.name}</h2>
        <MemberSelector value={memberId} onChange={setSelectedId} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard icon="paid" label="Total contribution (all-time)" value={formatCurrency(contribution)} />
        <StatCard
          icon="percent"
          label="Ownership % of group"
          value={`${ownershipPct.toFixed(1)}%`}
          sub="Contribution ÷ total pool"
        />
        <StatCard
          icon="account_balance_wallet"
          label="Share of current holdings"
          value={formatCurrency(totalShareValue)}
          sub="At their ownership %"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            Their holdings share by category
          </h2>
          <CategoryPieChart byCategory={holdingsShare} />
        </Card>

        <Card>
          <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">Personal transaction history</h2>
          <MemberTransactionHistory memberId={memberId} />
        </Card>
      </div>

      <IdleCashCards />
    </div>
  )
}
