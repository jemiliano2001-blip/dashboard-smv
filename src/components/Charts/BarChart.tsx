import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { WorkOrder } from '../../types'

interface BarChartData {
  company: string
  total: number
  inProduction: number
  completed: number
  onHold: number
}

interface BarChartProps {
  workOrders: WorkOrder[]
}

export function BarChart({ workOrders }: BarChartProps) {
  const data = (): BarChartData[] => {
    const companyStats = workOrders.reduce<Record<string, { total: number; inProduction: number; completed: number; onHold: number }>>((acc, order) => {
      const company = order.company_name || 'Sin Compañía'
      
      if (!acc[company]) {
        acc[company] = { total: 0, inProduction: 0, completed: 0, onHold: 0 }
      }
      
      acc[company].total++
      if (order.status === 'production') acc[company].inProduction++
      if (order.status === 'quality') acc[company].completed++
      if (order.status === 'hold') acc[company].onHold++
      
      return acc
    }, {})

    return Object.entries(companyStats)
      .map(([company, stats]) => ({ company, ...stats }))
      .sort((a, b) => b.total - a.total)
  }

  const chartData = data()

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No hay datos disponibles
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="company" 
          stroke="#9CA3AF"
          style={{ fontSize: '12px' }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
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
        <Bar dataKey="total" fill="#3B82F6" name="Total" />
        <Bar dataKey="inProduction" fill="#F59E0B" name="En Producción" />
        <Bar dataKey="completed" fill="#10B981" name="Completadas" />
        <Bar dataKey="onHold" fill="#EF4444" name="En Hold" />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}
