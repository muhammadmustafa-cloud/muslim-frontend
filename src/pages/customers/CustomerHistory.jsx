import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, DollarSign, FileText, TrendingUp, TrendingDown, Users, Search, Filter, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import api from '../../config/api'
import { formatCurrency, formatDate } from '../../utils/formatters'

const CustomerHistory = () => {
  const { customerId } = useParams()
  const navigate = useNavigate()
  
  const [customer, setCustomer] = useState(null)
  const [customers, setCustomers] = useState([])
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' })

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetails()
      fetchTransactionHistory()
    }
    fetchCustomers()
  }, [customerId, pagination.page])

  useEffect(() => {
    filterCustomers()
  }, [customers, searchQuery])

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true)
      const response = await api.get('/customers?limit=1000')
      setCustomers(response.data.data || [])
    } catch (error) {
      toast.error('Failed to fetch customers')
      console.error(error)
    } finally {
      setLoadingCustomers(false)
    }
  }

  const fetchCustomerDetails = async () => {
    if (!customerId) return
    
    try {
      const response = await api.get(`/customers/${customerId}`)
      setCustomer(response.data.data)
    } catch (error) {
      toast.error('Failed to fetch customer details')
      console.error(error)
    }
  }

  const fetchTransactionHistory = async () => {
    if (!customerId) return
    
    try {
      setLoading(true)
      const params = {
        page: pagination.page,
        limit: pagination.limit
      }
      
      if (dateRange.startDate) {
        params.startDate = dateRange.startDate
      }
      if (dateRange.endDate) {
        params.endDate = dateRange.endDate
      }
      
      const response = await api.get(`/customers/${customerId}/transactions`, { params })
      setTransactions(response.data.data || [])
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0
      }))
    } catch (error) {
      toast.error('Failed to fetch transaction history')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCustomerSelect = (selectedCustomerId) => {
    navigate(`/customer-history/${selectedCustomerId}`)
  }

  const filterCustomers = () => {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers)
      return
    }
    
    const filtered = customers.filter(customer => 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchQuery)) ||
      (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    setFilteredCustomers(filtered)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setDateRange({ startDate: '', endDate: '' })
  }

  const applyDateFilter = () => {
    if (customerId) {
      fetchTransactionHistory()
    }
  }

  const calculateTotals = () => {
    const totalCredit = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + (t.amount || 0), 0)
    
    const totalDebit = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + (t.amount || 0), 0)
    
    return { totalCredit, totalDebit, balance: totalCredit - totalDebit }
  }

  const { totalCredit, totalDebit, balance } = calculateTotals()

  const columns = [
    {
      key: 'date',
      label: 'Date',
      accessor: 'date',
      render: (row) => formatDate(row?.date || row?.createdAt || new Date())
    },
    {
      key: 'name',
      label: 'Name',
      accessor: 'name',
      render: (row) => (
        <span className="font-medium text-gray-900">
          {row?.customer?.name || row?.name || 'N/A'}
        </span>
      )
    },
    {
      key: 'type',
      label: 'Type',
      accessor: 'type',
      render: (row) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          row?.type === 'credit' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {row?.type === 'credit' ? (
            <>
              <TrendingDown className="w-3 h-3 mr-1" />
              Credit
            </>
          ) : (
            <>
              <TrendingUp className="w-3 h-3 mr-1" />
              Debit
            </>
          )}
        </span>
      )
    },
    {
      key: 'description',
      label: 'Description',
      accessor: 'description',
      render: (row) => (
        <div>
          <div className="font-medium">{row?.description || 'No description'}</div>
          {row?.reference && (
            <div className="text-sm text-gray-500">Ref: {row.reference}</div>
          )}
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      accessor: 'amount',
      render: (row) => (
        <span className={`font-semibold ${
          row?.type === 'credit' ? 'text-green-600' : 'text-red-600'
        }`}>
          {row?.type === 'credit' ? '+' : '-'}{formatCurrency(row?.amount || 0)}
        </span>
      )
    },
    {
      key: 'paymentMethod',
      label: 'Payment Method',
      accessor: 'paymentMethod',
      render: (row) => (
        <span className="text-sm text-gray-600 capitalize">
          {row?.paymentMethod || row?.paymentMode || 'N/A'}
        </span>
      )
    },
    {
      key: 'source',
      label: 'Source',
      accessor: 'source',
      render: (row) => (
        <span className="text-sm text-gray-600">
          {row?.source || 'Manual Entry'}
        </span>
      )
    }
  ]

  // If no customerId selected, show customer selection
  if (!customerId) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/customers')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Customers
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Transaction History</h1>
            <p className="text-gray-600">Select a customer to view their complete transaction record</p>
          </div>
        </div>

      {/* Customer Selection */}
        <Card>
          <div className="p-4 sm:p-6">
            <div className="flex flex-col space-y-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Select Customer
              </h2>
              <div className="flex flex-col space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 text-sm"
                    size="sm"
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                  </Button>
                  {(searchQuery || dateRange.startDate || dateRange.endDate) && (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="flex items-center gap-2 text-sm"
                      size="sm"
                    >
                      <X className="w-4 h-4" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            {showFilters && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Date Range Filter</h3>
                <div className="grid grid-cols-1 gap-3">
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
                </div>
                <div className="mt-3">
                  <Button
                    onClick={applyDateFilter}
                    className="flex items-center gap-2 w-full sm:w-auto"
                    size="sm"
                  >
                    <Filter className="w-4 h-4" />
                    Apply Date Filter
                  </Button>
                </div>
              </div>
            )}
            
            {loadingCustomers ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredCustomers.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {filteredCustomers.map(cust => (
                  <div
                    key={cust._id}
                    onClick={() => handleCustomerSelect(cust._id)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all cursor-pointer bg-white active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{cust.name}</h3>
                        {cust.phone && (
                          <p className="text-sm text-gray-600">{cust.phone}</p>
                        )}
                        {cust.email && (
                          <p className="text-sm text-gray-500 truncate">{cust.email}</p>
                        )}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${
                        cust.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {cust.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>{searchQuery ? 'No customers found matching your search' : 'No customers found'}</p>
                <Button
                  onClick={() => navigate('/customers')}
                  className="mt-4"
                  size="sm"
                >
                  Create Customer
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    )
  }

  if (loading && !customer) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Customer Transaction History</h1>
        <p className="text-gray-600">
          {customer?.name} - Complete transaction record
        </p>
      </div>

      {/* Transaction Summary */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">+{formatCurrency(totalCredit)}</div>
            <div className="text-sm text-gray-500">Total Credit</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">-{formatCurrency(totalDebit)}</div>
            <div className="text-sm text-gray-500">Total Debit</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
            </div>
            <div className="text-sm text-gray-500">Net Balance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{pagination.total}</div>
            <div className="text-sm text-gray-500">Total Transactions</div>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Date Filter
            </Button>
            <Button
              variant="outline"
              onClick={fetchTransactionHistory}
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>
        
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Filter Transactions by Date Range</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                onClick={applyDateFilter}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Apply Filter
              </Button>
              {(dateRange.startDate || dateRange.endDate) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setDateRange({ startDate: '', endDate: '' })
                    if (customerId) {
                      fetchTransactionHistory()
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear Date Filter
                </Button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : transactions.length > 0 ? (
          <>
            <Table
              columns={columns}
              data={transactions}
              pagination={pagination}
              onPaginationChange={setPagination}
            />
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No transactions found for this customer</p>
          </div>
        )}
      </Card>
    </div>
  )
}

export default CustomerHistory
