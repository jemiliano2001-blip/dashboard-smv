import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { WorkOrder } from '../../types'

interface LineChartData {
  date: string
  created: number
  completed: number
}

interface LineChartProps {
  workOrders: WorkOrder[]
  dateRange?: { start: string; end: string }
}

export function LineChart({ workOrders, dateRange }: LineChartProps) {
  const data = (): LineChartData[] => {
    const ordersByDate = workOrders.reduce<Record<string, { created: number; completed: number }>>((acc, order) => {
      const date = new Date(order.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
      
      if (!acc[date]) {
        acc[date] = { created: 0, completed: 0 }
      }
      
      acc[date].created++
      if (order.status === 'quality') {
        acc[date].completed++
      }
      
      return acc
    }, {})

    let result = Object.entries(ordersByDate)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (dateRange?.start && dateRange?.end) {
      const start = new Date(dateRange.start)
      const end = new Date(dateRange.end)
      result = result.filter((item) => {
        const itemDate = new Date(item.date)
        return itemDate >= start && itemDate <= end
      })
    }

    return result
  }

  const chartData = data()

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No hay datos disponibles para el rango de fechas seleccionado
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsLineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="date" 
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
        <Line 
          type="monotone" 
          dataKey="created" 
          stroke="#3B82F6" 
          strokeWidth={2}
          name="Creadas"
          dot={{ fill: '#3B82F6', r: 4 }}
        />
        <Line 
          type="monotone" 
          dataKey="completed" 
          stroke="#10B981" 
          strokeWidth={2}
          name="Completadas"
          dot={{ fill: '#10B981', r: 4 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}
