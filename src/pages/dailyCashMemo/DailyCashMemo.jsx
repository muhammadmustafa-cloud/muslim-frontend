import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, Trash2, Calendar, Save, FileText, Eye, X, Upload, Download, FileSpreadsheet, Copy, Zap, TrendingUp, TrendingDown } from 'lucide-react'
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { FormInput } from '../../components/ui/form-input'
import SelectWrapper, { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import api from '../../config/api'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { exportToPDF, exportToExcel } from '../../utils/exportUtils'

const EXPENSE_CATEGORIES = [
  { value: 'mazdoor', label: 'Mazdoor' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'rent', label: 'Rent' },
  { value: 'transport', label: 'Transport' },
  { value: 'raw_material', label: 'Raw Material' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other', label: 'Other' },
  { value: 'customer_payment', label: 'Customer Payment' },
  { value: 'supplier_payment', label: 'Supplier Payment' }
]

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'online', label: 'Online' }
]

const DailyCashMemo = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [memo, setMemo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [previousBalance, setPreviousBalance] = useState(0)
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [entryType, setEntryType] = useState('credit') // 'credit' or 'debit'
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [bulkEntries, setBulkEntries] = useState([])
  const [bulkEntryType, setBulkEntryType] = useState('credit')
  
  // New state for dropdowns
  const [accounts, setAccounts] = useState([])
  const [mazdoors, setMazdoors] = useState([])
  const [customers, setCustomers] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loadingDropdowns, setLoadingDropdowns] = useState(false)

  // Debug: Log suppliers state changes
  useEffect(() => {
    console.log('Suppliers state updated:', suppliers)
  }, [suppliers])

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch, setError, clearErrors, control } = useForm({
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      amount: '',
      account: '',
      category: '',
      mazdoor: '',
      customer: '',
      supplier: '',
      paymentMethod: 'cash',
      notes: ''
    }
  })

  const watchedValues = watch()
  const selectedCategory = watch('category')
  const notes = watch('notes')

  useEffect(() => {
    fetchMemo()
    fetchPreviousBalance()
    fetchDropdownData()
  }, [selectedDate])

  // Fetch dropdown data
  const fetchDropdownData = async () => {
    try {
      setLoadingDropdowns(true)
      const [accountsRes, mazdoorsRes, customersRes, suppliersRes] = await Promise.all([
        api.get('/daily-cash-memos/accounts'),
        api.get('/mazdoors'),
        api.get('/customers'),
        api.get('/suppliers')
      ])
      
      console.log('Mazdoors response:', mazdoorsRes.data);
      console.log('Customers response:', customersRes.data);
      console.log('Suppliers response:', suppliersRes.data);
      setAccounts(accountsRes.data.data.accounts || [])
      setMazdoors(mazdoorsRes.data.data || mazdoorsRes.data.data.mazdoors || [])
      
      // Handle different response structures for customers
      const customersData = customersRes.data.data || customersRes.data.customers || customersRes.data || []
      console.log('Customers data extracted:', customersData)
      setCustomers(customersData)
      
      // Handle different response structures for suppliers
      const suppliersData = suppliersRes.data.data || suppliersRes.data.suppliers || suppliersRes.data || []
      console.log('Suppliers data extracted:', suppliersData)
      setSuppliers(suppliersData)
      
      console.log('Final customers state:', customersData)
      console.log('Final suppliers state:', suppliersData)
    } catch (error) {
      console.error('Error fetching dropdown data:', error)
      toast.error('Failed to load dropdown data')
    } finally {
      setLoadingDropdowns(false)
    }
  }

  const fetchPreviousBalance = async () => {
    try {
      const response = await api.get('/daily-cash-memos/previous-balance', {
        params: { date: selectedDate }
      })
      setPreviousBalance(response.data.data.previousBalance || 0)
    } catch (error) {
      console.error('Error fetching previous balance:', error)
    }
  }

  const fetchMemo = async () => {
    try {
      setLoading(true)
      console.log('Fetching memo for date:', selectedDate)
      const response = await api.get(`/daily-cash-memos/date/${selectedDate}`)
      console.log('Memo response:', response.data)
      setMemo(response.data.data.memo)
      setValue('notes', response.data.data.memo.notes || '')
    } catch (error) {
      if (error.response?.status === 404) {
        setMemo(null)
        setValue('notes', '')
      } else {
        toast.error('Failed to fetch daily cash memo')
      }
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalCredit = () => {
    if (!memo) return previousBalance
    const entriesTotal = (memo.creditEntries || []).reduce((sum, entry) => sum + (entry.amount || 0), 0)
    return previousBalance + entriesTotal
  }

  const calculateTotalDebit = () => {
    if (!memo) return 0
    return (memo.debitEntries || []).reduce((sum, entry) => sum + (entry.amount || 0), 0)
  }

  const calculateClosingBalance = () => {
    return calculateTotalCredit() - calculateTotalDebit()
  }

  const handleAddEntry = (type) => {
    setEntryType(type)
    setEditingEntry(null)
    reset({
      name: '',
      description: '',
      amount: '',
      account: '',
      category: '',
      mazdoor: '',
      customer: '',
      supplier: '',
      paymentMethod: 'cash',
      notes: memo?.notes || ''
    })
    setImagePreview(null)
    setIsEntryModalOpen(true)
  }

  const handleEditEntry = (entry, type) => {
    setEntryType(type)
    setEditingEntry(entry)
    reset({
      name: entry.name,
      description: entry.description || '',
      amount: entry.amount,
      account: entry.account?._id || entry.account || '',
      category: entry.category || '',
      mazdoor: entry.mazdoor?._id || entry.mazdoor || '',
      customer: entry.customer?._id || entry.customer || '',
      supplier: entry.supplier?._id || entry.supplier || '',
      paymentMethod: entry.paymentMethod || 'cash',
      notes: memo?.notes || ''
    })
    setImagePreview(entry.image || null)
    setIsEntryModalOpen(true)
  }

  const handleDeleteEntry = async (entry, type) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return
    }

    try {
      const updatedMemo = { ...memo }
      if (type === 'credit') {
        updatedMemo.creditEntries = updatedMemo.creditEntries.filter(e => 
          e._id ? e._id !== entry._id : e !== entry
        )
      } else {
        updatedMemo.debitEntries = updatedMemo.debitEntries.filter(e => 
          e._id ? e._id !== entry._id : e !== entry
        )
      }

      if (memo?._id) {
        await api.put(`/daily-cash-memos/${memo._id}`, {
          creditEntries: updatedMemo.creditEntries,
          debitEntries: updatedMemo.debitEntries,
          openingBalance: previousBalance
        })
        toast.success('Entry deleted successfully')
      }
      fetchMemo()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete entry')
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB')
        return
      }
      // Convert to base64
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImagePreview(null)
  }

  const validateEntry = (data) => {
    const errors = {};
    
    if (!data.name || data.name.trim() === '') {
      errors.name = 'Name is required';
    }
    
    if (!data.amount || isNaN(parseFloat(data.amount))) {
      errors.amount = 'Valid amount is required';
    } else if (parseFloat(data.amount) <= 0) {
      errors.amount = 'Amount must be greater than zero';
    }
    
    // Validate date is not in the future
    const selected = new Date(selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selected > today) {
      errors.date = 'Cannot select a future date';
    }
    
    return Object.keys(errors).length === 0 ? null : errors;
  };

  const onEntrySubmit = async (data) => {
    clearErrors()
    
    // Validation
    const validationErrors = {}
    
    if (!data.name || data.name.trim() === '') {
      validationErrors.name = { message: 'Name is required' }
    }
    
    if (!data.amount || isNaN(parseFloat(data.amount)) || parseFloat(data.amount) <= 0) {
      validationErrors.amount = { message: 'Please enter a valid amount greater than zero' }
    }
    
    if (entryType === 'credit' && !data.account) {
      validationErrors.account = { message: 'Account is required for credit entries' }
    }
    
    if (entryType === 'debit' && !data.category) {
      validationErrors.category = { message: 'Category is required for debit entries' }
    }
    
    if (Object.keys(validationErrors).length > 0) {
      Object.entries(validationErrors).forEach(([field, error]) => {
        setError(field, { type: 'manual', message: error.message })
      })
      return
    }

    try {
      const entryData = {
        name: data.name.trim(),
        description: (data.description || '').trim(),
        amount: parseFloat(parseFloat(data.amount).toFixed(2)),
        paymentMethod: data.paymentMethod,
        entryType: entryType, // Add required entryType field
        image: imagePreview || undefined
      }

      // Add type-specific fields
      if (entryType === 'credit') {
        entryData.account = data.account
        entryData.customer = data.customer || null
      } else {
        entryData.category = data.category
        entryData.mazdoor = data.mazdoor || null
        entryData.supplier = data.supplier || null
      }

      // Use new API endpoints for dual-entry functionality
      if (memo?._id) {
        console.log('Adding entry to existing memo:', memo._id, 'Type:', entryType, 'Data:', entryData)
        
        if (entryType === 'credit') {
          const response = await api.post(`/daily-cash-memos/${memo._id}/credit`, entryData)
          console.log('Credit entry response:', response.data)
        } else {
          const response = await api.post(`/daily-cash-memos/${memo._id}/debit`, entryData)
          console.log('Debit entry response:', response.data)
        }
        
        toast.success(`${entryType === 'credit' ? 'Credit' : 'Debit'} entry added successfully`)
      } else {
        // Create memo first, then add entry
        const memoResponse = await api.post('/daily-cash-memos', {
          date: selectedDate,
          openingBalance: previousBalance,
          creditEntries: entryType === 'credit' ? [entryData] : [],
          debitEntries: entryType === 'debit' ? [entryData] : []
        })
        setMemo(memoResponse.data.data.memo)
        toast.success('Entry added successfully')
      }

      setIsEntryModalOpen(false)
      reset()
      setImagePreview(null)
      fetchMemo()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add entry')
    }
  }

  const handleViewImage = (image) => {
    setSelectedImage(image)
    setIsImageModalOpen(true)
  }

  const handleSaveNotes = async (data) => {
    try {
      if (memo?._id) {
        await api.put(`/daily-cash-memos/${memo._id}`, {
          notes: data.notes || '',
          creditEntries: memo.creditEntries,
          debitEntries: memo.debitEntries,
          previousBalance: previousBalance
        })
      } else {
        await api.post('/daily-cash-memos', {
          date: selectedDate,
          creditEntries: memo?.creditEntries || [],
          debitEntries: memo?.debitEntries || [],
          previousBalance: previousBalance,
          notes: data.notes || ''
        })
        fetchMemo()
      }
      setIsNotesModalOpen(false)
      toast.success('Notes saved successfully')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save notes')
    }
  }

  const getDayName = (dateString) => {
    const date = new Date(dateString)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[date.getDay()]
  }

  const handleExport = (format) => {
    const data = {
      date: selectedDate,
      memo: memo,
      previousBalance: previousBalance,
      totalCredit: calculateTotalCredit(),
      totalDebit: calculateTotalDebit(),
      closingBalance: calculateClosingBalance()
    }

    if (format === 'pdf') {
      exportToPDF(memo, selectedDate, previousBalance)
    } else {
      exportToExcel(memo, selectedDate, previousBalance)
    }
  }

  const handlePostMemo = async () => {
    if (!memo?._id) {
      toast.error('No memo to post')
      return
    }

    if (!window.confirm('Are you sure you want to post this memo? This will finalize it for the day.')) {
      return
    }

    try {
      await api.post(`/daily-cash-memos/${memo._id}/post`)
      toast.success('Daily cash memo posted successfully')
      fetchMemo()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post memo')
    }
  }

  const getAccountName = (account) => {
    if (!account) return 'Unknown Account'
    if (typeof account === 'string') {
      // Handle case where account is just an ID string
      const accountObj = accounts.find(acc => acc._id === account)
      return accountObj ? `${accountObj.code} - ${accountObj.name}` : 'Unknown Account'
    }
    // Handle case where account is an object
    return account.name ? `${account.code || ''} - ${account.name}` : 'Unknown Account'
  }

  const getMazdoorName = (mazdoorId) => {
    const mazdoor = mazdoors.find(m => m._id === mazdoorId)
    return mazdoor ? mazdoor.name : 'Unknown Mazdoor'
  }

  const getCustomerName = (customer) => {
    if (!customer) return 'Unknown Customer'
    if (typeof customer === 'string') {
      // Handle case where customer is just an ID string
      const customerObj = customers.find(c => c._id === customer)
      return customerObj ? customerObj.name : 'Unknown Customer'
    }
    // Handle case where customer is an object
    return customer.name || 'Unknown Customer'
  }

  const getSupplierName = (supplierId) => {
    const supplier = suppliers.find(s => s._id === supplierId)
    return supplier ? supplier.name : 'Unknown Supplier'
  }

  const getCategoryLabel = (category) => {
    const cat = EXPENSE_CATEGORIES.find(c => c.value === category)
    return cat ? cat.label : category
  }

  const handleAddBulkEntry = () => {
    const newEntry = {
      id: Date.now(),
      name: '',
      description: '',
      amount: '',
      account: bulkEntryType === 'credit' ? '' : undefined,
      category: bulkEntryType === 'debit' ? '' : undefined,
      customer: '',
      supplier: '',
      mazdoor: '',
      paymentMethod: 'cash'
    }
    setBulkEntries([...bulkEntries, newEntry])
  }

  const handleRemoveBulkEntry = (id) => {
    setBulkEntries(bulkEntries.filter(entry => entry.id !== id))
  }

  const handleBulkEntryChange = (id, field, value) => {
    setBulkEntries(bulkEntries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ))
  }

  const handleBulkSubmit = async () => {
    if (bulkEntries.length === 0) {
      toast.error('Please add at least one entry')
      return
    }

    // Validate entries
    const invalidEntries = bulkEntries.filter(entry => 
      !entry.name.trim() || !entry.amount || parseFloat(entry.amount) <= 0
    )
    
    if (invalidEntries.length > 0) {
      toast.error('Please fill in all required fields with valid amounts')
      return
    }

    if (bulkEntryType === 'credit') {
      const invalidCreditEntries = bulkEntries.filter(entry => !entry.account)
      if (invalidCreditEntries.length > 0) {
        toast.error('Account is required for all credit entries')
        return
      }
    } else {
      const invalidDebitEntries = bulkEntries.filter(entry => !entry.category)
      if (invalidDebitEntries.length > 0) {
        toast.error('Category is required for all debit entries')
        return
      }
    }

    try {
      if (memo?._id) {
        // Add entries to existing memo
        for (const entry of bulkEntries) {
          const entryData = {
            name: entry.name.trim(),
            description: entry.description?.trim() || '',
            amount: parseFloat(parseFloat(entry.amount).toFixed(2)),
            paymentMethod: entry.paymentMethod,
            entryType: bulkEntryType
          }

          if (bulkEntryType === 'credit') {
            entryData.account = entry.account
            entryData.customer = entry.customer || null
            await api.post(`/daily-cash-memos/${memo._id}/credit`, entryData)
          } else {
            entryData.category = entry.category
            entryData.mazdoor = entry.mazdoor || null
            entryData.supplier = entry.supplier || null
            await api.post(`/daily-cash-memos/${memo._id}/debit`, entryData)
          }
        }
      } else {
        // Create new memo with bulk entries
        const creditEntries = bulkEntryType === 'credit' 
          ? bulkEntries.map(entry => ({
              name: entry.name.trim(),
              description: entry.description?.trim() || '',
              amount: parseFloat(parseFloat(entry.amount).toFixed(2)),
              paymentMethod: entry.paymentMethod,
              entryType: 'credit',
              account: entry.account,
              customer: entry.customer || null
            }))
          : []
        
        const debitEntries = bulkEntryType === 'debit'
          ? bulkEntries.map(entry => ({
              name: entry.name.trim(),
              description: entry.description?.trim() || '',
              amount: parseFloat(parseFloat(entry.amount).toFixed(2)),
              paymentMethod: entry.paymentMethod,
              entryType: 'debit',
              category: entry.category,
              mazdoor: entry.mazdoor || null,
              supplier: entry.supplier || null
            }))
          : []

        await api.post('/daily-cash-memos', {
          date: selectedDate,
          openingBalance: previousBalance,
          creditEntries,
          debitEntries
        })
      }

      toast.success(`${bulkEntries.length} ${bulkEntryType} entries added successfully`)
      setIsBulkModalOpen(false)
      setBulkEntries([])
      fetchMemo()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add bulk entries')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Daily Cash Memo</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage daily cash transactions</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 text-sm"
            size="sm"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('excel')}
            className="flex items-center gap-2 text-sm"
            size="sm"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Export Excel</span>
            <span className="sm:hidden">Excel</span>
          </Button>
          {memo?.status !== 'posted' && (
            <Button
              onClick={handlePostMemo}
              className="flex items-center gap-2 text-sm"
              size="sm"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Post Memo</span>
              <span className="sm:hidden">Post</span>
            </Button>
          )}
        </div>
      </div>

      {/* Date Selection and Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {memo && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    memo.status === 'posted' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {memo.status?.toUpperCase() || 'DRAFT'}
                  </span>
                </div>
              )}
              <Button
                variant="outline"
                onClick={() => setIsNotesModalOpen(true)}
                className="flex items-center gap-2 text-sm w-full sm:w-auto"
                size="sm"
              >
                <FileText className="h-4 w-4" />
                Notes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <p className="text-xs font-medium text-gray-600">Opening Balance</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatCurrency(previousBalance)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <p className="text-xs font-medium text-green-600">Total Credit</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600">{formatCurrency(calculateTotalCredit())}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <p className="text-xs font-medium text-red-600">Total Debit</p>
              <p className="text-lg sm:text-2xl font-bold text-red-600">{formatCurrency(calculateTotalDebit())}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <p className="text-xs font-medium text-blue-600">Closing Balance</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-600">{formatCurrency(calculateClosingBalance())}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Entry Buttons */}
      <div className="flex flex-col space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => handleAddEntry('credit')}
            className="flex items-center justify-center gap-2 text-sm"
            disabled={memo?.status === 'posted'}
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Credit Entry
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddEntry('debit')}
            className="flex items-center justify-center gap-2 text-sm"
            disabled={memo?.status === 'posted'}
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Debit Entry
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setBulkEntryType('credit')
              setBulkEntries([])
              setIsBulkModalOpen(true)
            }}
            className="flex items-center justify-center gap-2 text-sm"
            disabled={memo?.status === 'posted'}
            size="sm"
          >
            <Zap className="h-4 w-4" />
            Bulk Credit
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setBulkEntryType('debit')
              setBulkEntries([])
              setIsBulkModalOpen(true)
            }}
            className="flex items-center justify-center gap-2 text-sm"
            disabled={memo?.status === 'posted'}
            size="sm"
          >
            <Zap className="h-4 w-4" />
            Bulk Debit
          </Button>
        </div>
      </div>

      {/* Credit Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-700">Credit Entries (Cash In)</CardTitle>
          <CardDescription>Money received and added to accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : memo?.creditEntries?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Account</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment Method</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {memo.creditEntries.map((entry, index) => (
                    <tr key={entry._id || index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{entry.name}</div>
                        {entry.createdAt && (
                          <div className="text-xs text-gray-500">
                            {new Date(entry.createdAt).toLocaleTimeString()}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {entry.description || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {getAccountName(entry.account) || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {getCustomerName(entry.customer) || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 capitalize">
                        {entry.paymentMethod || entry.paymentMode || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-semibold text-green-600">
                          +{formatCurrency(entry.amount || 0)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {entry.image && (
                            <button
                              onClick={() => {
                                setImagePreview(entry.image)
                                setIsImageModalOpen(true)
                              }}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="View Image"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEditEntry(entry, 'credit')}
                            disabled={memo?.status === 'posted'}
                            className="text-gray-600 hover:text-gray-800 p-1 disabled:opacity-50"
                            title="Edit Entry"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry, 'credit')}
                            disabled={memo?.status === 'posted'}
                            className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50"
                            title="Delete Entry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan="5" className="py-3 px-4 text-right">Total Credit:</td>
                    <td className="py-3 px-4 text-right text-green-600">
                      +{formatCurrency(calculateTotalCredit())}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No credit entries found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debit Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-700">Debit Entries (Cash Out)</CardTitle>
          <CardDescription>Money spent and expenses</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : memo?.debitEntries?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Mazdoor</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Supplier</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment Method</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {memo.debitEntries.map((entry, index) => (
                    <tr key={entry._id || index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{entry.name}</div>
                        {entry.createdAt && (
                          <div className="text-xs text-gray-500">
                            {new Date(entry.createdAt).toLocaleTimeString()}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {entry.description || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          {getCategoryLabel(entry.category)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {getMazdoorName(entry.mazdoor) || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {getSupplierName(entry.supplier) || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 capitalize">
                        {entry.paymentMethod || entry.paymentMode || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-semibold text-red-600">
                          -{formatCurrency(entry.amount || 0)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {entry.image && (
                            <button
                              onClick={() => {
                                setImagePreview(entry.image)
                                setIsImageModalOpen(true)
                              }}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="View Image"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEditEntry(entry, 'debit')}
                            disabled={memo?.status === 'posted'}
                            className="text-gray-600 hover:text-gray-800 p-1 disabled:opacity-50"
                            title="Edit Entry"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry, 'debit')}
                            disabled={memo?.status === 'posted'}
                            className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50"
                            title="Delete Entry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan="6" className="py-3 px-4 text-right">Total Debit:</td>
                    <td className="py-3 px-4 text-right text-red-600">
                      -{formatCurrency(calculateTotalDebit())}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <TrendingDown className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No debit entries found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entry Modal */}
      <Dialog open={isEntryModalOpen} onOpenChange={setIsEntryModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? `Edit ${entryType} Entry` : `Add ${entryType} Entry`}
            </DialogTitle>
            <DialogDescription>
              {entryType === 'credit' 
                ? 'Enter details for money received (credit entry)'
                : 'Enter details for money paid out (debit entry)'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onEntrySubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Name"
                name="name"
                register={register}
                error={errors.name}
                required
                placeholder="Enter entry name"
              />
              
              <FormInput
                label="Amount"
                name="amount"
                type="number"
                step="0.01"
                register={register}
                error={errors.amount}
                required
                placeholder="0.00"
              />
            </div>

            <FormInput
              label="Description"
              name="description"
              register={register}
              error={errors.description}
              placeholder="Enter description (optional)"
            />

            {entryType === 'credit' ? (
              <>
                <SelectWrapper
                  label="Account"
                  name="account"
                  register={register}
                  error={errors.account?.message}
                  required
                  placeholder="Select account"
                  options={accounts.map(acc => ({
                    value: acc._id,
                    label: `${acc.code} - ${acc.name}`
                  }))}
                  loading={loadingDropdowns ? 'true' : undefined}
                />

                <SelectWrapper
                  label="Customer (Optional)"
                  name="customer"
                  register={register}
                  placeholder={customers.length === 0 ? "No customers available" : "Select customer"}
                  options={customers.length === 0 ? [] : customers.map(cust => ({
                    value: cust._id,
                    label: cust.name
                  }))}
                  loading={loadingDropdowns ? 'true' : undefined}
                />
                
                {customers.length === 0 && !loadingDropdowns && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      No customers found. 
                      <a href="/customers" className="text-blue-600 hover:text-blue-800 underline ml-1">
                        Create customers here
                      </a>
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <SelectWrapper
                  label="Category"
                  name="category"
                  register={register}
                  error={errors.category?.message}
                  required
                  placeholder="Select category"
                  options={EXPENSE_CATEGORIES}
                />

                {selectedCategory === 'mazdoor' && (
                  <SelectWrapper
                    label="Mazdoor"
                    name="mazdoor"
                    register={register}
                    placeholder="Select mazdoor"
                    options={mazdoors.map(m => ({
                      value: m._id,
                      label: m.name
                    }))}
                    loading={loadingDropdowns ? 'true' : undefined}
                  />
                )}

                {['supplier_payment', 'raw_material'].includes(selectedCategory) && (
                  <SelectWrapper
                    label="Supplier"
                    name="supplier"
                    register={register}
                    placeholder={suppliers.length === 0 ? "No suppliers available" : "Select supplier"}
                    options={suppliers.length === 0 ? [] : suppliers.map(s => ({
                      value: s._id,
                      label: s.name
                    }))}
                    loading={loadingDropdowns ? 'true' : undefined}
                  />
                )}
                
                {suppliers.length === 0 && !loadingDropdowns && ['supplier_payment', 'raw_material'].includes(selectedCategory) && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      No suppliers found. 
                      <a href="/suppliers" className="text-blue-600 hover:text-blue-800 underline ml-1">
                        Create suppliers here
                      </a>
                    </p>
                  </div>
                )}
              </>
            )}

            <SelectWrapper
                  label="Payment Method"
                  name="paymentMethod"
                  register={register}
                  options={PAYMENT_METHODS}
                />

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supporting Image (Optional)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('image-upload').click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Image
                </Button>
                {imagePreview && (
                  <div className="flex items-center gap-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-10 w-10 object-cover rounded"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEntryModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingEntry ? 'Update Entry' : 'Add Entry'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Notes Modal */}
      <Dialog open={isNotesModalOpen} onOpenChange={setIsNotesModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Daily Notes</DialogTitle>
            <DialogDescription>
              Add notes for daily cash memo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <textarea
              {...register('notes')}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={4}
              placeholder="Enter notes for this day..."
            />
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsNotesModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveNotes}>
                Save Notes
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Entry Modal */}
      <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Bulk {bulkEntryType === 'credit' ? 'Credit' : 'Debit'} Entries
            </DialogTitle>
            <DialogDescription>
              Add multiple {bulkEntryType === 'credit' ? 'credit (cash in)' : 'debit (cash out)'} entries at once
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Add Entry Button */}
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-700">
                {bulkEntries.length} {bulkEntryType} {bulkEntries.length === 1 ? 'entry' : 'entries'}
              </h3>
              <Button
                onClick={handleAddBulkEntry}
                className="flex items-center gap-2"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                Add Entry
              </Button>
            </div>

            {/* Bulk Entries Table */}
            {bulkEntries.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name *</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount *</th>
                        {bulkEntryType === 'credit' ? (
                          <>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account *</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                          </>
                        ) : (
                          <>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category *</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mazdoor</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                          </>
                        )}
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bulkEntries.map((entry, index) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={entry.name}
                              onChange={(e) => handleBulkEntryChange(entry.id, 'name', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="Enter name"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={entry.description}
                              onChange={(e) => handleBulkEntryChange(entry.id, 'description', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="Description (optional)"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={entry.amount}
                              onChange={(e) => handleBulkEntryChange(entry.id, 'amount', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="0.00"
                            />
                          </td>
                          {bulkEntryType === 'credit' ? (
                            <>
                              <td className="px-3 py-2">
                                <select
                                  value={entry.account}
                                  onChange={(e) => handleBulkEntryChange(entry.id, 'account', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                >
                                  <option value="">Select account</option>
                                  {accounts.map(acc => (
                                    <option key={acc._id} value={acc._id}>
                                      {acc.code} - {acc.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-3 py-2">
                                <select
                                  value={entry.customer}
                                  onChange={(e) => handleBulkEntryChange(entry.id, 'customer', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                >
                                  <option value="">Select customer</option>
                                  {customers.map(cust => (
                                    <option key={cust._id} value={cust._id}>
                                      {cust.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-3 py-2">
                                <select
                                  value={entry.category}
                                  onChange={(e) => handleBulkEntryChange(entry.id, 'category', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                >
                                  <option value="">Select category</option>
                                  {EXPENSE_CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>
                                      {cat.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-3 py-2">
                                <select
                                  value={entry.mazdoor}
                                  onChange={(e) => handleBulkEntryChange(entry.id, 'mazdoor', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                >
                                  <option value="">Select mazdoor</option>
                                  {mazdoors.map(m => (
                                    <option key={m._id} value={m._id}>
                                      {m.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-3 py-2">
                                <select
                                  value={entry.supplier}
                                  onChange={(e) => handleBulkEntryChange(entry.id, 'supplier', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                >
                                  <option value="">Select supplier</option>
                                  {suppliers.map(s => (
                                    <option key={s._id} value={s._id}>
                                      {s.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </>
                          )}
                          <td className="px-3 py-2">
                            <select
                              value={entry.paymentMethod}
                              onChange={(e) => handleBulkEntryChange(entry.id, 'paymentMethod', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                            >
                              {PAYMENT_METHODS.map(method => (
                                <option key={method.value} value={method.value}>
                                  {method.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveBulkEntry(entry.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty State */}
            {bulkEntries.length === 0 && (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No entries added yet</p>
                <p className="text-sm">Click "Add Entry" to start adding {bulkEntryType} entries</p>
              </div>
            )}

            {/* Summary */}
            {bulkEntries.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">
                    Total Amount: {formatCurrency(
                      bulkEntries.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0)
                    )}
                  </span>
                  <span className="text-sm text-gray-500">
                    {bulkEntries.length} {bulkEntryType} {bulkEntries.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsBulkModalOpen(false)
                setBulkEntries([])
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBulkSubmit}
              disabled={bulkEntries.length === 0}
            >
              Add {bulkEntries.length} {bulkEntryType} {bulkEntries.length === 1 ? 'Entry' : 'Entries'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Supporting Document</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Supporting document"
                className="max-w-full max-h-[70vh] object-contain"
              />
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsImageModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DailyCashMemo
