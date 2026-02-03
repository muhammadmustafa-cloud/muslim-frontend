import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import api from '../config/api'
import cacheHelpers, { CACHE_TTL } from '../utils/cache'

export const useEntityList = (entityType) => {
  const [entities, setEntities] = useState([])
  const [filteredEntities, setFilteredEntities] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchEntities = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      
      // Try to get from cache first
      if (!forceRefresh) {
        const cachedData = entityType === 'customer' 
          ? cacheHelpers.getCustomers()
          : cacheHelpers.getSuppliers()
        
        if (cachedData) {
          setEntities(cachedData)
          return
        }
      }

      // Fetch from API
      const endpoint = entityType === 'customer' ? '/customers' : '/suppliers'
      const response = await api.get(`${endpoint}?limit=1000`)
      const data = response.data.data || []
      
      // Update state
      setEntities(data)
      
      // Cache the data
      if (entityType === 'customer') {
        cacheHelpers.setCustomers(data, CACHE_TTL.MEDIUM)
      } else {
        cacheHelpers.setSuppliers(data, CACHE_TTL.MEDIUM)
      }
    } catch (error) {
      toast.error(`Failed to fetch ${entityType}s`)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [entityType])

  useEffect(() => {
    fetchEntities()
  }, [fetchEntities])

  useEffect(() => {
    filterEntities()
  }, [entities, searchQuery])

  const filterEntities = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredEntities(entities)
      return
    }
    
    const filtered = entities.filter(entity => {
      const searchLower = searchQuery.toLowerCase()
      return (
        entity.name.toLowerCase().includes(searchLower) ||
        (entity.phone && entity.phone.includes(searchQuery)) ||
        (entity.email && entity.email.toLowerCase().includes(searchLower)) ||
        (entityType === 'supplier' && entity.gstNumber && 
         entity.gstNumber.toLowerCase().includes(searchLower))
      )
    })
    setFilteredEntities(filtered)
  }, [entities, searchQuery, entityType])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  const invalidateCache = useCallback(() => {
    if (entityType === 'customer') {
      cacheHelpers.setCustomers([], 0) // Expire immediately
    } else {
      cacheHelpers.setSuppliers([], 0) // Expire immediately
    }
  }, [entityType])

  return {
    entities,
    filteredEntities,
    loading,
    searchQuery,
    setSearchQuery,
    clearSearch,
    refetch: () => fetchEntities(true),
    invalidateCache
  }
}
