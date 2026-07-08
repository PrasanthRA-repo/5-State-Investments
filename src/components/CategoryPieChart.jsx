import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { CATEGORY_COLORS } from '../constants'
import { formatCurrency } from '../utils/calculations'
import EmptyState from './ui/EmptyState'

export default function CategoryPieChart({ byCategory }) {
  const data = Object.entries(byCategory)
    .map(([name, value]) => ({ name, value: Number(value) || 0 }))
    .filter((d) => d.value > 0)

  if (data.length === 0) {
    return <EmptyState icon="pie_chart" title="No portfolio value yet" subtitle="Add some transactions to see a breakdown." />
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
          {data.map((d) => (
            <Cell key={d.name} fill={CATEGORY_COLORS[d.name] || '#94a3b8'} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatCurrency(value)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
