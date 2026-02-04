import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { WorkOrder } from '../../types'

interface AreaChartData {
  date: string
  progress: number
  quantity: number
}

interface AreaChartProps {
  workOrders: WorkOrder[]
  dateRange?: { start: string; end: string }
}

export function AreaChart({ workOrders, dateRange }: AreaChartProps) {
  const data = (): AreaChartData[] => {
    const progressByDate = workOrders.reduce<Record<string, { total: number; completed: number }>>((acc, order) => {
      const date = new Date(order.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
      
      if (!acc[date]) {
        acc[date] = { total: 0, completed: 0 }
      }
      
      acc[date].total += order.quantity_total || 0
      acc[date].completed += order.quantity_completed || 0
      
      return acc
    }, {})

    let result = Object.entries(progressByDate)
      .map(([date, { total, completed }]) => ({
        date,
        progress: total > 0 ? Math.round((completed / total) * 100) : 0,
        quantity: completed,
      }))
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
      <RechartsAreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="colorQuantity" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
          </linearGradient>
        </defs>
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
        <Area 
          type="monotone" 
          dataKey="progress" 
          stroke="#3B82F6" 
          fillOpacity={1} 
          fill="url(#colorProgress)"
          name="Progreso %"
        />
        <Area 
          type="monotone" 
          dataKey="quantity" 
          stroke="#10B981" 
          fillOpacity={1} 
          fill="url(#colorQuantity)"
          name="Cantidad Completada"
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  )
}
