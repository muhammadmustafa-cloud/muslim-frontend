import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  ShoppingBag, 
  Package, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  AlertCircle
} from 'lucide-react'
import Card from '../components/ui/Card'
import api from '../config/api'
import toast from 'react-hot-toast'
import { formatCurrency } from '../utils/formatters'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalSuppliers: 0,
    totalItems: 0,
    totalExpenses: 0,
    totalRevenue: 0,
    lowStockItems: 0,
  })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const [customersRes, suppliersRes, itemsRes, expensesRes, transactionsRes] = await Promise.all([
        api.get('/customers?limit=1'),
        api.get('/suppliers?limit=1'),
        api.get('/items?limit=1'),
        api.get('/expenses?limit=1'),
        api.get('/transactions?limit=1'),
      ])

      const itemsData = await api.get('/items?limit=1000')
      const lowStockCount = itemsData.data.data.filter(item => 
        item.minStockLevel > 0 && item.currentStock <= item.minStockLevel
      ).length

      const expensesData = await api.get('/expenses?limit=1000')
      const totalExpenses = expensesData.data.data.reduce((sum, exp) => sum + (exp.amount || 0), 0)

      const transactionsData = await api.get('/transactions?limit=1000')
      const totalRevenue = transactionsData.data.data
        .filter(t => t.type === 'sale')
        .reduce((sum, t) => sum + (t.totalAmount || 0), 0)

      setStats({
        totalCustomers: customersRes.data.pagination?.total || 0,
        totalSuppliers: suppliersRes.data.pagination?.total || 0,
        totalItems: itemsRes.data.pagination?.total || 0,
        totalExpenses,
        totalRevenue,
        lowStockItems: lowStockCount,
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      onClick: () => navigate('/customers'),
    },
    {
      title: 'Total Suppliers',
      value: stats.totalSuppliers,
      icon: ShoppingBag,
      gradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-green-100',
      onClick: () => navigate('/suppliers'),
    },
    {
      title: 'Total Items',
      value: stats.totalItems,
      icon: Package,
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
      onClick: () => navigate('/items'),
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-50 to-emerald-100',
      onClick: () => navigate('/transactions'),
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(stats.totalExpenses),
      icon: TrendingDown,
      gradient: 'from-red-500 to-red-600',
      bgGradient: 'from-red-50 to-red-100',
      onClick: () => navigate('/expenses'),
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems,
      icon: AlertCircle,
      gradient: 'from-orange-500 to-orange-600',
      bgGradient: 'from-orange-50 to-orange-100',
      onClick: () => navigate('/inventory'),
    },
  ]

  const quickActions = [
    {
      title: 'Add Customer',
      icon: Users,
      path: '/customers',
      color: 'text-blue-600 bg-blue-50 hover:bg-blue-100',
    },
    {
      title: 'Add Supplier',
      icon: ShoppingBag,
      path: '/suppliers',
      color: 'text-green-600 bg-green-50 hover:bg-green-100',
    },
    {
      title: 'Stock Entry',
      icon: Package,
      path: '/inventory',
      color: 'text-purple-600 bg-purple-50 hover:bg-purple-100',
    },
    {
      title: 'Add Expense',
      icon: DollarSign,
      path: '/expenses',
      color: 'text-red-600 bg-red-50 hover:bg-red-100',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-base font-semibold text-gray-900">Dashboard</h1>
        <p className="text-[10px] text-gray-500 mt-0.5">Muslim Daal Mill</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card
              key={index}
              className="cursor-pointer hover:bg-gray-50/80 transition-colors"
              onClick={stat.onClick}
            >
              <div className="flex items-center justify-between p-3">
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-500 truncate uppercase tracking-wider">{stat.title}</p>
                  <p className="text-sm font-semibold text-gray-900 truncate mt-0.5">{stat.value}</p>
                </div>
                <div className={`flex-shrink-0 w-8 h-8 rounded flex items-center justify-center bg-gray-100 ${stat.title.includes('Revenue') ? 'text-green-600' : stat.title.includes('Expense') ? 'text-red-600' : 'text-gray-600'}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Card>
        <div className="p-3">
          <h2 className="text-xs font-medium text-gray-700 mb-2">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <button
                  key={index}
                  onClick={() => navigate(action.path)}
                  className={`flex items-center gap-1.5 p-2 rounded border border-gray-100 ${action.color} transition-colors hover:border-gray-200 text-left`}
                >
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="text-[10px] font-medium truncate">{action.title}</span>
                </button>
              )
            })}
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Dashboard
