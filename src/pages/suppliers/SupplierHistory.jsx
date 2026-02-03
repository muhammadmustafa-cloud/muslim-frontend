import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, DollarSign, FileText, TrendingUp, TrendingDown, Building2, Search, Filter, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import api from '../../config/api'
import { formatCurrency, formatDate } from '../../utils/formatters'

const SupplierHistory = () => {
  const { supplierId } = useParams()
  const navigate = useNavigate()
  
  const [supplier, setSupplier] = useState(null)
  const [suppliers, setSuppliers] = useState([])
  const [filteredSuppliers, setFilteredSuppliers] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' })

  useEffect(() => {
    if (supplierId) {
      fetchSupplierDetails()
      fetchTransactionHistory()
    }
    fetchSuppliers()
  }, [supplierId, pagination.page])

  useEffect(() => {
    filterSuppliers()
  }, [suppliers, searchQuery])

  const fetchSuppliers = async () => {
    try {
      setLoadingSuppliers(true)
      const response = await api.get('/suppliers?limit=1000')
      setSuppliers(response.data.data || [])
    } catch (error) {
      toast.error('Failed to fetch suppliers')
      console.error(error)
    } finally {
      setLoadingSuppliers(false)
    }
  }

  const fetchSupplierDetails = async () => {
    if (!supplierId) return
    
    try {
      const response = await api.get(`/suppliers/${supplierId}`)
      setSupplier(response.data.data)
    } catch (error) {
      toast.error('Failed to fetch supplier details')
      console.error(error)
    }
  }

  const fetchTransactionHistory = async () => {
    if (!supplierId) return
    
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
      
      const response = await api.get(`/suppliers/${supplierId}/transactions`, { params })
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

  const handleSupplierSelect = (selectedSupplierId) => {
    navigate(`/supplier-history/${selectedSupplierId}`)
  }

  const filterSuppliers = () => {
    if (!searchQuery.trim()) {
      setFilteredSuppliers(suppliers)
      return
    }
    
    const filtered = suppliers.filter(supplier => 
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (supplier.phone && supplier.phone.includes(searchQuery)) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (supplier.gstNumber && supplier.gstNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    setFilteredSuppliers(filtered)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setDateRange({ startDate: '', endDate: '' })
  }

  const applyDateFilter = () => {
    if (supplierId) {
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
    
    return { totalCredit, totalDebit, balance: totalDebit - totalCredit }
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
          {row?.supplier?.name || row?.name || 'N/A'}
        </span>
      )
    },
    {
      key: 'type',
      label: 'Type',
      accessor: 'type',
      render: (row) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          row?.type === 'debit' 
            ? 'bg-red-100 text-red-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {row?.type === 'debit' ? (
            <>
              <TrendingUp className="w-3 h-3 mr-1" />
              Debit
            </>
          ) : (
            <>
              <TrendingDown className="w-3 h-3 mr-1" />
              Credit
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
          {row?.category && (
            <div className="text-sm text-gray-500">Category: {row.category}</div>
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
          row?.type === 'debit' ? 'text-red-600' : 'text-green-600'
        }`}>
          {row?.type === 'debit' ? '-' : '+'}{formatCurrency(row?.amount || 0)}
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

  // If no supplierId selected, show supplier selection
  if (!supplierId) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/suppliers')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Suppliers
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Supplier Transaction History</h1>
            <p className="text-gray-600">Select a supplier to view their complete transaction record</p>
          </div>
        </div>

        {/* Supplier Selection */}
        <Card>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Select Supplier
              </h2>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search suppliers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </Button>
                {(searchQuery || dateRange.startDate || dateRange.endDate) && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
            
            {showFilters && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Date Range Filter</h3>
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
                <div className="mt-3">
                  <Button
                    onClick={applyDateFilter}
                    className="flex items-center gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    Apply Date Filter
                  </Button>
                </div>
              </div>
            )}
            
            {loadingSuppliers ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredSuppliers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSuppliers.map(supp => (
                  <div
                    key={supp._id}
                    onClick={() => handleSupplierSelect(supp._id)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all cursor-pointer bg-white"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{supp.name}</h3>
                        {supp.phone && (
                          <p className="text-sm text-gray-600">{supp.phone}</p>
                        )}
                        {supp.email && (
                          <p className="text-sm text-gray-500">{supp.email}</p>
                        )}
                        {supp.gstNumber && (
                          <p className="text-sm text-gray-500">GST: {supp.gstNumber}</p>
                        )}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        supp.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {supp.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>{searchQuery ? 'No suppliers found matching your search' : 'No suppliers found'}</p>
                <Button
                  onClick={() => navigate('/suppliers')}
                  className="mt-4"
                >
                  Create Supplier
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    )
  }

  if (loading && !supplier) {
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
        <h1 className="text-2xl font-bold text-gray-900">Supplier Transaction History</h1>
        <p className="text-gray-600">
          {supplier?.name} - Complete transaction record
        </p>
      </div>

      {/* Payment Summary */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">-{formatCurrency(totalDebit)}</div>
            <div className="text-sm text-gray-500">Total Paid</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">+{formatCurrency(totalCredit)}</div>
            <div className="text-sm text-gray-500">Total Received</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {balance >= 0 ? '-' : '+'}{formatCurrency(Math.abs(balance))}
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
                    if (supplierId) {
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
            <p>No transactions found for this supplier</p>
          </div>
        )}
      </Card>
    </div>
  )
}

export default SupplierHistory
