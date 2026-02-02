import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building2, 
  Search, 
  Filter, 
  X,
  Download,
  RefreshCw
} from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Table from '../ui/Table'
import { formatCurrency, formatDate } from '../../utils/formatters'

const SharedHistoryComponent = ({
  entityType,
  entityId,
  entity,
  transactions,
  loading,
  pagination,
  filters,
  filteredEntities,
  entitiesLoading,
  searchQuery,
  onEntitySelect,
  onSearchChange,
  onFilterUpdate,
  onApplyFilters,
  onClearFilters,
  onPageChange,
  onRefresh,
  onExport,
  calculateTotals,
  showFilters: initialShowFilters = false
}) => {
  const navigate = useNavigate()
  const [showFilters, setShowFilters] = useState(initialShowFilters)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const { totalCredit, totalDebit, balance } = calculateTotals()

  const isCustomer = entityType === 'customer'
  const EntityIcon = isCustomer ? Users : Building2

  // Transaction columns
  const columns = [
    {
      key: 'date',
      label: 'Date',
      accessor: 'date',
      render: (row) => formatDate(row?.date || row?.createdAt || new Date())
    },
    {
      key: 'name',
      label: isCustomer ? 'Customer' : 'Supplier',
      accessor: 'name',
      render: (row) => (
        <span className="font-medium text-gray-900">
          {row?.[isCustomer ? 'customer' : 'supplier']?.name || row?.name || 'N/A'}
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

  // Entity selection view
  if (!entityId) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(`/${entityType}s`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {isCustomer ? 'Customers' : 'Suppliers'}
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isCustomer ? 'Customer' : 'Supplier'} Transaction History
            </h1>
            <p className="text-gray-600">
              Select a {isCustomer ? 'customer' : 'supplier'} to view their complete transaction record
            </p>
          </div>
        </div>

        {/* Entity Selection */}
        <Card>
          <div className="p-4 sm:p-6">
            <div className="flex flex-col space-y-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <EntityIcon className="w-5 h-5" />
                Select {isCustomer ? 'Customer' : 'Supplier'}
              </h2>
              <div className="flex flex-col space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder={`Search ${isCustomer ? 'customers' : 'suppliers'}...`}
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
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
                  {(searchQuery || filters.startDate || filters.endDate) && (
                    <Button
                      variant="outline"
                      onClick={onClearFilters}
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
                      value={filters.startDate}
                      onChange={(e) => onFilterUpdate('startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => onFilterUpdate('endDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <Button
                    onClick={onApplyFilters}
                    className="flex items-center gap-2 w-full sm:w-auto"
                    size="sm"
                  >
                    <Filter className="w-4 h-4" />
                    Apply Date Filter
                  </Button>
                </div>
              </div>
            )}
            
            {entitiesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredEntities.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {filteredEntities.map(entity => (
                  <div
                    key={entity._id}
                    onClick={() => onEntitySelect(entity._id)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all cursor-pointer bg-white active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{entity.name}</h3>
                        {entity.phone && (
                          <p className="text-sm text-gray-600">{entity.phone}</p>
                        )}
                        {entity.email && (
                          <p className="text-sm text-gray-500 truncate">{entity.email}</p>
                        )}
                        {!isCustomer && entity.gstNumber && (
                          <p className="text-sm text-gray-500">GST: {entity.gstNumber}</p>
                        )}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${
                        entity.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {entity.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <EntityIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>
                  {searchQuery 
                    ? `No ${isCustomer ? 'customers' : 'suppliers'} found matching your search` 
                    : `No ${isCustomer ? 'customers' : 'suppliers'} found`
                  }
                </p>
                <Button
                  onClick={() => navigate(`/${entityType}s`)}
                  className="mt-4"
                  size="sm"
                >
                  Create {isCustomer ? 'Customer' : 'Supplier'}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    )
  }

  // Transaction history view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {isCustomer ? 'Customer' : 'Supplier'} Transaction History
        </h1>
        <p className="text-gray-600">
          {entity?.name} - Complete transaction record
        </p>
      </div>

      {/* Transaction Summary */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              +{formatCurrency(totalCredit)}
            </div>
            <div className="text-sm text-gray-500">
              {isCustomer ? 'Total Credit' : 'Total Received'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              -{formatCurrency(totalDebit)}
            </div>
            <div className="text-sm text-gray-500">
              {isCustomer ? 'Total Debit' : 'Total Paid'}
            </div>
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
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Advanced Filters
            </Button>
            <Button
              variant="outline"
              onClick={onRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={onExport}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
        
        {showAdvancedFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Advanced Filters</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => onFilterUpdate('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => onFilterUpdate('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                <select
                  value={filters.transactionType}
                  onChange={(e) => onFilterUpdate('transactionType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Types</option>
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <select
                  value={filters.source}
                  onChange={(e) => onFilterUpdate('source', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Sources</option>
                  <option value="Daily Cash Memo">Daily Cash Memo</option>
                  <option value="Payment">Payment</option>
                  <option value="Expense">Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minAmount}
                  onChange={(e) => onFilterUpdate('minAmount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.maxAmount}
                  onChange={(e) => onFilterUpdate('maxAmount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                onClick={onApplyFilters}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Apply Filters
              </Button>
              {(filters.startDate || filters.endDate || filters.transactionType || filters.source || filters.minAmount || filters.maxAmount) && (
                <Button
                  variant="outline"
                  onClick={onClearFilters}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
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
              onPaginationChange={onPageChange}
            />
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No transactions found for this {isCustomer ? 'customer' : 'supplier'}</p>
          </div>
        )}
      </Card>
    </div>
  )
}

export default SharedHistoryComponent
