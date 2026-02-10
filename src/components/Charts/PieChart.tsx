import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import type { WorkOrder, Status } from '../../types'

interface PieChartData {
  name: string
  value: number
}

interface PieChartProps {
  workOrders: WorkOrder[]
}

const STATUS_LABELS: Record<Status, string> = {
  scheduled: 'Programada',
  production: 'En Producción',
  quality: 'Completada',
  hold: 'En Hold',
}

const COLORS = {
  scheduled: '#6366F1',
  production: '#F59E0B',
  quality: '#10B981',
  hold: '#EF4444',
}

export function PieChart({ workOrders }: PieChartProps) {
  const data = (): PieChartData[] => {
    const statusCounts = workOrders.reduce<Record<Status, number>>(
      (acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      },
      {
        scheduled: 0,
        production: 0,
        quality: 0,
        hold: 0,
      }
    )

    return Object.entries(statusCounts)
      .map(([status, value]) => ({
        name: STATUS_LABELS[status as Status],
        value,
      }))
      .filter((item) => item.value > 0)
  }

  const chartData = data()

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No hay datos disponibles
      </div>
    )
  }

  const getColor = (name: string): string => {
    const entry = Object.entries(STATUS_LABELS).find(([, label]) => label === name)
    return entry ? COLORS[entry[0] as Status] : '#6B7280'
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsPieChart>
        <Pie
          data={chartData as unknown as Array<Record<string, string | number>>}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getColor(entry.name)} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#F3F4F6',
          }}
        />
        <Legend 
          wrapperStyle={{ color: '#F3F4F6' }}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}
