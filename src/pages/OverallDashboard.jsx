import { useData } from '../context/DataContext'
import StatCard from '../components/StatCard'
import CategoryPieChart from '../components/CategoryPieChart'
import RecentTransactions from '../components/RecentTransactions'
import HoldingsEditor from '../components/HoldingsEditor'
import CategoryPerformanceCard from '../components/CategoryPerformanceCard'
import { INVESTMENT_CATEGORIES } from '../constants'
import {
  totalPooledFund,
  cashAvailable,
  currentValueByCategory,
  totalPortfolioValue,
  investedVsCurrent,
  categoryPerformance,
  formatCurrency,
} from '../utils/calculations'

export default function OverallDashboard() {
  const { transactions, holdings } = useData()

  const pooledFund = totalPooledFund(transactions)
  const cash = cashAvailable(transactions)
  const byCategory = currentValueByCategory(transactions, holdings)
  const portfolioValue = totalPortfolioValue(transactions, holdings)
  const { invested, current, gainLoss, gainLossPct } = investedVsCurrent(transactions, holdings)

  const gainTone = gainLoss > 0 ? 'positive' : gainLoss < 0 ? 'negative' : undefined

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total pooled fund" value={formatCurrency(pooledFund)} sub="Contributions − withdrawals" />
        <StatCard label="Total portfolio value" value={formatCurrency(portfolioValue)} sub="All categories, current value" />
        <StatCard label="Cash available" value={formatCurrency(cash)} sub="Uninvested, sitting in the pool" />
        <StatCard
          label="Invested vs current"
          value={`${gainLoss >= 0 ? '+' : ''}${formatCurrency(gainLoss)}`}
          sub={`${formatCurrency(invested)} invested → ${formatCurrency(current)} now (${gainLossPct >= 0 ? '+' : ''}${gainLossPct.toFixed(1)}%)`}
          tone={gainTone}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Category performance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {INVESTMENT_CATEGORIES.map((category) => (
            <CategoryPerformanceCard
              key={category}
              performance={categoryPerformance(transactions, holdings, category)}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-2">Breakdown by category</h2>
          <CategoryPieChart byCategory={byCategory} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-2">Recent transactions</h2>
          <RecentTransactions count={8} />
        </div>
      </div>

      <HoldingsEditor />
    </div>
  )
}
