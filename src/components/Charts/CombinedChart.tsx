import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { WorkOrder } from '../../types'

interface CombinedChartData {
  company: string
  quantityTotal: number
  quantityCompleted: number
  progress: number
}

interface CombinedChartProps {
  workOrders: WorkOrder[]
}

export function CombinedChart({ workOrders }: CombinedChartProps) {
  const data = (): CombinedChartData[] => {
    const companyStats = workOrders.reduce<Record<string, { total: number; completed: number }>>((acc, order) => {
      const company = order.company_name || 'Sin Compañía'
      
      if (!acc[company]) {
        acc[company] = { total: 0, completed: 0 }
      }
      
      acc[company].total += order.quantity_total || 0
      acc[company].completed += order.quantity_completed || 0
      
      return acc
    }, {})

    return Object.entries(companyStats)
      .map(([company, { total, completed }]) => ({
        company,
        quantityTotal: total,
        quantityCompleted: completed,
        progress: total > 0 ? Math.round((completed / total) * 100) : 0,
      }))
      .sort((a, b) => b.quantityTotal - a.quantityTotal)
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
      <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="company" 
          stroke="#9CA3AF"
          style={{ fontSize: '12px' }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          yAxisId="left"
          stroke="#9CA3AF" 
          style={{ fontSize: '12px' }}
          label={{ value: 'Cantidad', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
        />
        <YAxis 
          yAxisId="right"
          orientation="right"
          stroke="#9CA3AF" 
          style={{ fontSize: '12px' }}
          label={{ value: 'Progreso %', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
        />
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
        <Bar 
          yAxisId="left"
          dataKey="quantityTotal" 
          fill="#3B82F6" 
          name="Cantidad Total"
          opacity={0.7}
        />
        <Bar 
          yAxisId="left"
          dataKey="quantityCompleted" 
          fill="#10B981" 
          name="Cantidad Completada"
          opacity={0.7}
        />
        <Line 
          yAxisId="right"
          type="monotone" 
          dataKey="progress" 
          stroke="#F59E0B" 
          strokeWidth={3}
          name="Progreso %"
          dot={{ fill: '#F59E0B', r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
