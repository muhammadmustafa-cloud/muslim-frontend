import { useState, useEffect } from 'react'
import { Calendar, TrendingUp, TrendingDown, DollarSign, Users, Building2, FileText, Download, Filter, BarChart3, PieChart, Activity } from 'lucide-react'
import toast from 'react-hot-toast'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import SelectWrapper from '../components/ui/Select'
import api from '../config/api'
import { formatCurrency, formatDate } from '../utils/formatters'
import { exportToPDF, exportToExcel } from '../utils/exportUtils'

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [analytics, setAnalytics] = useState(null)
  const [topCustomers, setTopCustomers] = useState([])
  const [topSuppliers, setTopSuppliers] = useState([])
  const [categoryBreakdown, setCategoryBreakdown] = useState([])
  const [monthlyTrend, setMonthlyTrend] = useState([])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      }
      
      const [analyticsRes, customersRes, suppliersRes, categoriesRes, trendRes] = await Promise.all([
        api.get('/analytics/summary', { params }),
        api.get('/analytics/top-customers', { params }),
        api.get('/analytics/top-suppliers', { params }),
        api.get('/analytics/category-breakdown', { params }),
        api.get('/analytics/monthly-trend', { params })
      ])
      
      setAnalytics(analyticsRes.data.data)
      setTopCustomers(customersRes.data.data)
      setTopSuppliers(suppliersRes.data.data)
      setCategoryBreakdown(categoriesRes.data.data)
      setMonthlyTrend(trendRes.data.data)
    } catch (error) {
      toast.error('Failed to fetch analytics data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = (format) => {
    const data = {
      analytics,
      topCustomers,
      topSuppliers,
      categoryBreakdown,
      monthlyTrend,
      dateRange
    }

    if (format === 'pdf') {
      exportToPDF(data, 'analytics-report', dateRange)
    } else {
      exportToExcel(data, 'analytics-report', dateRange)
    }
  }

  const getCategoryColor = (index) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ]
    return colors[index % colors.length]
  }

  if (loading && !analytics) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive business insights and reports</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('excel')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      {showFilters && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Date Range Filter
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="sm:col-span-2 flex items-end">
                <Button
                  onClick={fetchAnalytics}
                  className="flex items-center gap-2"
                >
                  <Activity className="h-4 w-4" />
                  Update Analytics
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(analytics?.totalRevenue || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {analytics?.revenueChange >= 0 ? '+' : ''}{analytics?.revenueChange?.toFixed(1)}% from last period
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(analytics?.totalExpenses || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {analytics?.expenseChange >= 0 ? '+' : ''}{analytics?.expenseChange?.toFixed(1)}% from last period
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(analytics?.netProfit || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {analytics?.profitChange >= 0 ? '+' : ''}{analytics?.profitChange?.toFixed(1)}% from last period
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-purple-600">
                  {analytics?.totalTransactions || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Across all categories
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top Customers
            </h3>
            {topCustomers.length > 0 ? (
              <div className="space-y-3">
                {topCustomers.map((customer, index) => (
                  <div key={customer._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${getCategoryColor(index)}`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-sm text-gray-500">{customer.transactionCount} transactions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{formatCurrency(customer.totalAmount)}</p>
                      <p className="text-xs text-gray-500">Total revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No customer data available</p>
              </div>
            )}
          </div>
        </Card>

        {/* Top Suppliers */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Top Suppliers
            </h3>
            {topSuppliers.length > 0 ? (
              <div className="space-y-3">
                {topSuppliers.map((supplier, index) => (
                  <div key={supplier._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${getCategoryColor(index)}`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{supplier.name}</p>
                        <p className="text-sm text-gray-500">{supplier.transactionCount} transactions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">{formatCurrency(supplier.totalAmount)}</p>
                      <p className="text-xs text-gray-500">Total payments</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No supplier data available</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Expense Categories
            </h3>
            {categoryBreakdown.length > 0 ? (
              <div className="space-y-3">
                {categoryBreakdown.map((category, index) => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{category.label}</span>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(category.total)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getCategoryColor(index)}`}
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500">{category.percentage.toFixed(1)}% of total expenses</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <PieChart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No category data available</p>
              </div>
            )}
          </div>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Monthly Trend
            </h3>
            {monthlyTrend.length > 0 ? (
              <div className="space-y-3">
                {monthlyTrend.map((month) => (
                  <div key={month.month} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">{month.month}</span>
                      <span className={`font-semibold ${month.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(month.net)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Revenue: </span>
                        <span className="text-green-600 font-medium">{formatCurrency(month.revenue)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Expenses: </span>
                        <span className="text-red-600 font-medium">{formatCurrency(month.expenses)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No trend data available</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AnalyticsDashboard
