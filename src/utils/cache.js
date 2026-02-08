// Simple in-memory cache with TTL support
class Cache {
  constructor() {
    this.cache = new Map()
    this.timers = new Map()
  }

  set(key, value, ttlMs = 5 * 60 * 1000) { // Default 5 minutes
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
    }

    // Set value
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttlMs
    })

    // Set expiration timer
    if (ttlMs > 0) {
      const timer = setTimeout(() => {
        this.delete(key)
      }, ttlMs)
      this.timers.set(key, timer)
    }
  }

  get(key) {
    const item = this.cache.get(key)
    if (!item) return null

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.delete(key)
      return null
    }

    return item.value
  }

  delete(key) {
    this.cache.delete(key)
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
      this.timers.delete(key)
    }
  }

  clear() {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()
    
    // Clear cache
    this.cache.clear()
  }

  has(key) {
    return this.get(key) !== null
  }

  size() {
    return this.cache.size
  }

  // Get cache statistics
  getStats() {
    const items = Array.from(this.cache.entries())
    const now = Date.now()
    
    return {
      total: items.length,
      expired: items.filter(([_, item]) => now - item.timestamp > item.ttl).length,
      valid: items.filter(([_, item]) => now - item.timestamp <= item.ttl).length,
      keys: items.map(([key]) => key)
    }
  }
}

// Create singleton instance
const cache = new Cache()

// Cache keys constants
export const CACHE_KEYS = {
  CUSTOMERS: 'customers_list',
  SUPPLIERS: 'suppliers_list',
  CUSTOMER_TRANSACTIONS: (id) => `customer_transactions_${id}`,
  SUPPLIER_TRANSACTIONS: (id) => `supplier_transactions_${id}`,
  CUSTOMER_DETAILS: (id) => `customer_details_${id}`,
  SUPPLIER_DETAILS: (id) => `supplier_details_${id}`,
  DAILY_CASH_MEMO: (date) => `daily_cash_memo_${date}`,
  ACCOUNTS: 'accounts_list',
  ITEMS: 'items_list'
}

// TTL constants (in milliseconds)
export const CACHE_TTL = {
  SHORT: 2 * 60 * 1000,      // 2 minutes
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 15 * 60 * 1000,      // 15 minutes
  VERY_LONG: 60 * 60 * 1000   // 1 hour
}

// Cache helper functions
export const cacheHelpers = {
  // Cache customers list
  setCustomers: (customers, ttl = CACHE_TTL.MEDIUM) => {
    cache.set(CACHE_KEYS.CUSTOMERS, customers, ttl)
  },

  getCustomers: () => {
    return cache.get(CACHE_KEYS.CUSTOMERS)
  },

  // Cache suppliers list
  setSuppliers: (suppliers, ttl = CACHE_TTL.MEDIUM) => {
    cache.set(CACHE_KEYS.SUPPLIERS, suppliers, ttl)
  },

  getSuppliers: () => {
    return cache.get(CACHE_KEYS.SUPPLIERS)
  },

  // Cache customer transactions
  setCustomerTransactions: (customerId, transactions, ttl = CACHE_TTL.SHORT) => {
    cache.set(CACHE_KEYS.CUSTOMER_TRANSACTIONS(customerId), transactions, ttl)
  },

  getCustomerTransactions: (customerId) => {
    return cache.get(CACHE_KEYS.CUSTOMER_TRANSACTIONS(customerId))
  },

  // Cache supplier transactions
  setSupplierTransactions: (supplierId, transactions, ttl = CACHE_TTL.SHORT) => {
    cache.set(CACHE_KEYS.SUPPLIER_TRANSACTIONS(supplierId), transactions, ttl)
  },

  getSupplierTransactions: (supplierId) => {
    return cache.get(CACHE_KEYS.SUPPLIER_TRANSACTIONS(supplierId))
  },

  // Cache customer details
  setCustomerDetails: (customerId, details, ttl = CACHE_TTL.MEDIUM) => {
    cache.set(CACHE_KEYS.CUSTOMER_DETAILS(customerId), details, ttl)
  },

  getCustomerDetails: (customerId) => {
    return cache.get(CACHE_KEYS.CUSTOMER_DETAILS(customerId))
  },

  // Cache supplier details
  setSupplierDetails: (supplierId, details, ttl = CACHE_TTL.MEDIUM) => {
    cache.set(CACHE_KEYS.SUPPLIER_DETAILS(supplierId), details, ttl)
  },

  getSupplierDetails: (supplierId) => {
    return cache.get(CACHE_KEYS.SUPPLIER_DETAILS(supplierId))
  },

  // Invalidate related caches
  invalidateCustomerCaches: (customerId) => {
    cache.delete(CACHE_KEYS.CUSTOMER_TRANSACTIONS(customerId))
    cache.delete(CACHE_KEYS.CUSTOMER_DETAILS(customerId))
  },

  invalidateSupplierCaches: (supplierId) => {
    cache.delete(CACHE_KEYS.SUPPLIER_TRANSACTIONS(supplierId))
    cache.delete(CACHE_KEYS.SUPPLIER_DETAILS(supplierId))
  },

  invalidateTransactionCaches: () => {
    // Clear all transaction-related caches
    const stats = cache.getStats()
    stats.keys.forEach(key => {
      if (key.includes('transactions')) {
        cache.delete(key)
      }
    })
  },

  // Clear all caches
  clearAll: () => {
    cache.clear()
  },

  // Get cache statistics
  getStats: () => {
    return cache.getStats()
  }
}

// Development helper: log cache operations
if (process.env.NODE_ENV === 'development') {
  window.cacheStats = () => {
    console.table(cacheHelpers.getStats())
  }
  
  window.clearCache = () => {
    cacheHelpers.clearAll()
    console.log('Cache cleared')
  }
}

export default cache
