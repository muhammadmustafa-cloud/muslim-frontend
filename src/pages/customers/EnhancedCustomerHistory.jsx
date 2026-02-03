import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useTransactionHistory } from '../../hooks/useTransactionHistory'
import { useEntityList } from '../../hooks/useEntityList'
import SharedHistoryComponent from '../../components/history/SharedHistoryComponent'
import { exportTransactionHistoryToPDF, exportTransactionHistoryToExcel } from '../../utils/exportUtils'
import api from '../../config/api'

const EnhancedCustomerHistory = () => {
  const { customerId } = useParams()
  const navigate = useNavigate()
  
  const [customer, setCustomer] = useState(null)
  const [exportFormat, setExportFormat] = useState('pdf')
  const [showExportDialog, setShowExportDialog] = useState(false)

  // Custom hooks
  const {
    transactions,
    loading,
    pagination,
    filters,
    updateFilters,
    applyFilters,
    clearFilters,
    handlePageChange,
    calculateTotals,
    refetch
  } = useTransactionHistory('customer', customerId)

  const {
    filteredEntities,
    loading: entitiesLoading,
    searchQuery,
    setSearchQuery,
    clearSearch
  } = useEntityList('customer')

  // Fetch customer details
  useEffect(() => {
    if (customerId) {
      fetchCustomerDetails()
    }
  }, [customerId])

  const fetchCustomerDetails = async () => {
    try {
      const response = await api.get(`/customers/${customerId}`)
      setCustomer(response.data.data)
    } catch (error) {
      toast.error('Failed to fetch customer details')
      console.error(error)
    }
  }

  const handleEntitySelect = (selectedCustomerId) => {
    navigate(`/customer-history/${selectedCustomerId}`)
  }

  const handleExport = () => {
    if (!customer || transactions.length === 0) {
      toast.error('No data to export')
      return
    }

    try {
      if (exportFormat === 'pdf') {
        exportTransactionHistoryToPDF(transactions, customer.name, 'customer', filters)
      } else {
        exportTransactionHistoryToExcel(transactions, customer.name, 'customer', filters)
      }
      toast.success(`Transaction history exported as ${exportFormat.toUpperCase()}`)
      setShowExportDialog(false)
    } catch (error) {
      toast.error(`Failed to export as ${exportFormat.toUpperCase()}`)
      console.error(error)
    }
  }

  const handleRefresh = () => {
    refetch()
    if (customerId) {
      fetchCustomerDetails()
    }
  }

  return (
    <>
      <SharedHistoryComponent
        entityType="customer"
        entityId={customerId}
        entity={customer}
        transactions={transactions}
        loading={loading}
        pagination={pagination}
        filters={filters}
        filteredEntities={filteredEntities}
        entitiesLoading={entitiesLoading}
        searchQuery={searchQuery}
        onEntitySelect={handleEntitySelect}
        onSearchChange={setSearchQuery}
        onFilterUpdate={updateFilters}
        onApplyFilters={applyFilters}
        onClearFilters={() => {
          clearFilters()
          clearSearch()
        }}
        onPageChange={handlePageChange}
        onRefresh={handleRefresh}
        onExport={() => setShowExportDialog(true)}
        calculateTotals={calculateTotals}
      />

      {/* Export Dialog */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Export Transaction History</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="pdf"
                    checked={exportFormat === 'pdf'}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="mr-2"
                  />
                  <span>PDF Document</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="excel"
                    checked={exportFormat === 'excel'}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="mr-2"
                  />
                  <span>Excel Spreadsheet</span>
                </label>
              </div>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                <strong>Customer:</strong> {customer?.name}<br/>
                <strong>Transactions:</strong> {transactions.length}<br/>
                <strong>Period:</strong> {
                  filters.startDate || filters.endDate 
                    ? `${filters.startDate || 'Start'} to ${filters.endDate || 'End'}`
                    : 'All time'
                }
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowExportDialog(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Export {exportFormat.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default EnhancedCustomerHistory
