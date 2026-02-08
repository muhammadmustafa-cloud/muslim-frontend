import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import api from '../config/api'
import cacheHelpers, { CACHE_TTL } from '../utils/cache'

export const useTransactionHistory = (entityType, entityId) => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    transactionType: '',
    source: '',
    minAmount: '',
    maxAmount: '',
    sortBy: 'date',
    sortOrder: 'desc'
  })

  const fetchTransactions = useCallback(async (page = 1, newFilters = {}) => {
    if (!entityId) return

    try {
      setLoading(true)
      const params = {
        page,
        limit: pagination.limit,
        ...filters,
        ...newFilters
      }

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key]
        }
      })

      // Create cache key based on params
      const cacheKey = JSON.stringify({ entityId, params })
      
      // Try to get from cache first (only for page 1)
      let cachedData = null
      if (page === 1) {
        cachedData = entityType === 'customer' 
          ? cacheHelpers.getCustomerTransactions(entityId)
          : cacheHelpers.getSupplierTransactions(entityId)
      }

      if (cachedData && !newFilters.startDate && !newFilters.endDate) {
        setTransactions(cachedData.transactions || [])
        setPagination(cachedData.pagination || pagination)
        return
      }

      // Fetch from API
      const endpoint = entityType === 'customer' 
        ? `/customers/${entityId}/transactions`
        : `/suppliers/${entityId}/transactions`

      const response = await api.get(endpoint, { params })
      const transactionsData = response.data.data || []
      const paginationData = {
        page: response.data.pagination?.page || page,
        total: response.data.pagination?.total || 0,
        totalPages: response.data.pagination?.totalPages || 0
      }
      
      setTransactions(transactionsData)
      setPagination(prev => ({
        ...prev,
        ...paginationData
      }))

      // Cache only page 1 results
      if (page === 1 && !newFilters.startDate && !newFilters.endDate) {
        if (entityType === 'customer') {
          cacheHelpers.setCustomerTransactions(entityId, { 
            transactions: transactionsData, 
            pagination: paginationData 
          }, CACHE_TTL.SHORT)
        } else {
          cacheHelpers.setSupplierTransactions(entityId, { 
            transactions: transactionsData, 
            pagination: paginationData 
          }, CACHE_TTL.SHORT)
        }
      }
    } catch (error) {
      toast.error(`Failed to fetch ${entityType} transaction history`)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [entityId, entityType, filters, pagination.limit])

  useEffect(() => {
    if (entityId) {
      fetchTransactions()
    }
  }, [entityId, fetchTransactions])

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const applyFilters = useCallback(() => {
    fetchTransactions(1, filters)
  }, [fetchTransactions, filters])

  const clearFilters = useCallback(() => {
    const defaultFilters = {
      startDate: '',
      endDate: '',
      transactionType: '',
      source: '',
      minAmount: '',
      maxAmount: '',
      sortBy: 'date',
      sortOrder: 'desc'
    }
    setFilters(defaultFilters)
    fetchTransactions(1, defaultFilters)
  }, [fetchTransactions])

  const handlePageChange = useCallback((newPage) => {
    fetchTransactions(newPage)
  }, [fetchTransactions])

  const calculateTotals = useCallback(() => {
    const totalCredit = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + (t.amount || 0), 0)
    
    const totalDebit = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + (t.amount || 0), 0)
    
    if (entityType === 'customer') {
      return { totalCredit, totalDebit, balance: totalCredit - totalDebit }
    } else {
      return { totalCredit, totalDebit, balance: totalDebit - totalCredit }
    }
  }, [transactions, entityType])

  const invalidateCache = useCallback(() => {
    if (entityType === 'customer') {
      cacheHelpers.invalidateCustomerCaches(entityId)
    } else {
      cacheHelpers.invalidateSupplierCaches(entityId)
    }
  }, [entityType, entityId])

  return {
    transactions,
    loading,
    pagination,
    filters,
    updateFilters,
    applyFilters,
    clearFilters,
    handlePageChange,
    calculateTotals,
    refetch: () => fetchTransactions(pagination.page),
    invalidateCache
  }
}
