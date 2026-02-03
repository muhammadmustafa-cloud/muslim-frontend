import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { formatCurrency, formatDate } from '../../utils/formatters'

const BalanceTrendChart = ({ 
  transactions, 
  entityType, 
  height = 300,
  showAreaChart = false 
}) => {
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) return []

    // Sort transactions by date
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt)
    )

    // Calculate cumulative balance over time
    let runningBalance = 0
    const data = []

    sortedTransactions.forEach((transaction, index) => {
      const amount = transaction.amount || 0
      
      if (entityType === 'customer') {
        runningBalance += transaction.type === 'credit' ? amount : -amount
      } else {
        runningBalance += transaction.type === 'debit' ? -amount : amount
      }

      data.push({
        index: index + 1,
        date: formatDate(transaction.date || transaction.createdAt),
        fullDate: transaction.date || transaction.createdAt,
        amount: amount,
        type: transaction.type,
        balance: runningBalance,
        credit: transaction.type === 'credit' ? amount : 0,
        debit: transaction.type === 'debit' ? amount : 0
      })
    })

    return data
  }, [transactions, entityType])

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-semibold">{data.date}</p>
          <p className="text-sm text-gray-600">
            Type: <span className={`font-medium ${data.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
              {data.type?.toUpperCase()}
            </span>
          </p>
          <p className="text-sm text-gray-600">
            Amount: <span className="font-medium">{formatCurrency(data.amount)}</span>
          </p>
          <p className="text-sm font-semibold text-blue-600">
            Balance: {formatCurrency(data.balance)}
          </p>
        </div>
      )
    }
    return null
  }

  const CustomizedDot = (props) => {
    const { cx, cy, payload } = props
    const fill = payload.type === 'credit' ? '#10b981' : '#ef4444'
    
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={fill}
        stroke="#fff"
        strokeWidth={2}
      />
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>No transaction data available</p>
          <p className="text-sm">Add transactions to see balance trends</p>
        </div>
      </div>
    )
  }

  const ChartComponent = showAreaChart ? AreaChart : LineChart

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Balance Trend Analysis
        </h3>
        <p className="text-sm text-gray-600">
          {entityType === 'customer' ? 'Customer' : 'Supplier'} balance over time
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="index" 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `T${value}`}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {showAreaChart ? (
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#3b82f6"
              fill="#93bbfc"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          ) : (
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={<CustomizedDot />}
            />
          )}
          
          {/* Additional lines for credit/debit if needed */}
          {!showAreaChart && (
            <>
              <Line
                type="monotone"
                dataKey="credit"
                stroke="#10b981"
                strokeWidth={1}
                dot={false}
                strokeDasharray="5 5"
              />
              <Line
                type="monotone"
                dataKey="debit"
                stroke="#ef4444"
                strokeWidth={1}
                dot={false}
                strokeDasharray="5 5"
              />
            </>
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  )
}

export default BalanceTrendChart
