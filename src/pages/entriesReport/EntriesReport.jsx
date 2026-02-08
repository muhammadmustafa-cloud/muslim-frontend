import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { Calendar, FileText, FileSpreadsheet, Printer, Search, Filter } from 'lucide-react'
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import api from '../../config/api'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { exportEntriesReportToPDF, exportEntriesReportToExcel } from '../../utils/exportUtils'

const CATEGORY_OPTIONS = [
  { value: '', label: 'All categories' },
  { value: 'credit', label: 'Credit (all)' },
  { value: 'customer_payment', label: 'Credit: Customer Payment' },
  { value: 'sale', label: 'Credit: Sale / Item Sold' },
  { value: 'other_income', label: 'Credit: Other Income' },
  { value: 'general', label: 'Credit: General Receipt' },
  { value: 'mazdoor', label: 'Debit: Mazdoor' },
  { value: 'electricity', label: 'Debit: Electricity' },
  { value: 'rent', label: 'Debit: Rent' },
  { value: 'transport', label: 'Debit: Transport' },
  { value: 'raw_material', label: 'Debit: Raw Material' },
  { value: 'maintenance', label: 'Debit: Maintenance' },
  { value: 'other', label: 'Debit: Other' },
  { value: 'supplier_payment', label: 'Debit: Supplier Payment' }
]

const CREDIT_WITH_CUSTOMER = ['customer_payment', 'sale']

const EntriesReport = () => {
  const printRef = useRef(null)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [category, setCategory] = useState('')
  const [mazdoorId, setMazdoorId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [descriptionSearch, setDescriptionSearch] = useState('')
  const [entries, setEntries] = useState([])
  const [summary, setSummary] = useState({ totalCredit: 0, totalDebit: 0, closingBalance: 0, count: 0 })
  const [loading, setLoading] = useState(false)
  const [mazdoors, setMazdoors] = useState([])
  const [customers, setCustomers] = useState([])
  const [suppliers, setSuppliers] = useState([])

  const fetchEntities = async () => {
    try {
      const [mRes, cRes, sRes] = await Promise.all([
        api.get('/mazdoors'),
        api.get('/customers'),
        api.get('/suppliers')
      ])
      setMazdoors(mRes.data?.data || mRes.data?.mazdoors || [])
      const cData = cRes.data?.data || cRes.data?.customers || cRes.data || []
      setCustomers(Array.isArray(cData) ? cData : [])
      const sData = sRes.data?.data || sRes.data?.suppliers || sRes.data || []
      setSuppliers(Array.isArray(sData) ? sData : [])
    } catch {
      setMazdoors([])
      setCustomers([])
      setSuppliers([])
    }
  }

  useEffect(() => {
    fetchEntities()
  }, [])

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select start and end date')
      return
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Start date must be before end date')
      return
    }
    try {
      setLoading(true)
      const params = { startDate, endDate }
      if (category) params.category = category
      if (mazdoorId) params.mazdoorId = mazdoorId
      if (customerId) params.customerId = customerId
      if (supplierId) params.supplierId = supplierId
      if (descriptionSearch.trim()) params.description = descriptionSearch.trim()
      const response = await api.get('/daily-cash-memos/entries', { params })
      setEntries(response.data.data?.entries || [])
      setSummary(response.data.data?.summary || { totalCredit: 0, totalDebit: 0, closingBalance: 0, count: 0 })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load entries report')
      setEntries([])
      setSummary({ totalCredit: 0, totalDebit: 0, closingBalance: 0, count: 0 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [])

  useEffect(() => {
    setMazdoorId('')
    setCustomerId('')
    setSupplierId('')
  }, [category])

  const handleApplyFilter = () => {
    fetchReport()
  }

  const handlePrint = () => {
    if (!printRef.current) return
    const printContent = printRef.current.innerHTML
    const win = window.open('', '_blank')
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>Entries Report - ${startDate} to ${endDate}</title>
        <style>
          body { font-family: sans-serif; padding: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
          th { background: #f5f5f5; font-weight: 600; }
          .credit { color: #059669; }
          .debit { color: #dc2626; }
          .summary { margin-bottom: 16px; font-size: 14px; }
        </style>
        </head>
        <body>
          <h1>Entries Report</h1>
          <p>From: ${startDate} &nbsp; To: ${endDate}${category ? ` &nbsp; | &nbsp; Category: ${CATEGORY_OPTIONS.find(c => c.value === category)?.label || category}` : ''}${mazdoorId ? ` &nbsp; | &nbsp; Mazdoor: ${mazdoors.find(m => m._id === mazdoorId)?.name || mazdoorId}` : ''}${customerId ? ` &nbsp; | &nbsp; Customer: ${customers.find(c => c._id === customerId)?.name || customerId}` : ''}${supplierId ? ` &nbsp; | &nbsp; Supplier: ${suppliers.find(s => s._id === supplierId)?.name || supplierId}` : ''}${descriptionSearch ? ` &nbsp; | &nbsp; Description: "${descriptionSearch}"` : ''}</p>
          <div class="summary">
            <strong>Total Credit:</strong> ${formatCurrency(summary.totalCredit)} &nbsp; | &nbsp;
            <strong>Total Debit:</strong> ${formatCurrency(summary.totalDebit)} &nbsp; | &nbsp;
            <strong>Balance:</strong> ${formatCurrency(summary.closingBalance)} &nbsp; | &nbsp;
            <strong>Records:</strong> ${summary.count}
          </div>
          ${printContent}
        </body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 250)
  }

  const handleDownloadPDF = () => {
    const categoryLabel = category ? (CATEGORY_OPTIONS.find(c => c.value === category)?.label || category) : ''
    exportEntriesReportToPDF(entries, summary, startDate, endDate, categoryLabel)
    toast.success('PDF downloaded')
  }

  const handleDownloadExcel = () => {
    exportEntriesReportToExcel(entries, summary, startDate, endDate)
    toast.success('Excel downloaded')
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-base font-semibold text-gray-900">Entries Report</h1>
        <p className="text-[10px] text-gray-500 mt-0.5">View credit & debit entries by date range and category. Print and download.</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              >
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description contains</label>
              <input
                type="text"
                value={descriptionSearch}
                onChange={(e) => setDescriptionSearch(e.target.value)}
                placeholder="e.g. gaari kiraya"
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {category === 'mazdoor' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Which Mazdoor</label>
                <select
                  value={mazdoorId}
                  onChange={(e) => setMazdoorId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All mazdoors</option>
                  {mazdoors.map(m => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}
            {CREDIT_WITH_CUSTOMER.includes(category) && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Which Customer</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All customers</option>
                  {customers.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            {['supplier_payment', 'raw_material'].includes(category) && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Which Supplier</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All suppliers</option>
                  {suppliers.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-end">
              <Button onClick={handleApplyFilter} variant="primary" size="sm" className="w-full">
                <Search className="h-4 w-4 mr-1.5" />
                Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handlePrint} disabled={loading || entries.length === 0}>
          <Printer className="h-4 w-4 mr-1.5" />
          Print
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={loading || entries.length === 0}>
          <FileText className="h-4 w-4 mr-1.5" />
          Download PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadExcel} disabled={loading || entries.length === 0}>
          <FileSpreadsheet className="h-4 w-4 mr-1.5" />
          Download Excel
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Credit</p>
              <p className="text-sm font-semibold text-green-600">{formatCurrency(summary.totalCredit)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Debit</p>
              <p className="text-sm font-semibold text-red-600">{formatCurrency(summary.totalDebit)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Balance</p>
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(summary.closingBalance)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Records</p>
              <p className="text-sm font-semibold text-gray-900">{summary.count}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" />
            </div>
          ) : (
            <div ref={printRef} className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-2 px-2 font-medium text-gray-700">Date</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-700">Type</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-700">Category</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-700">Name</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-700">Description</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-700">Account / Customer</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-700">Mazdoor / Supplier</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-700">Payment</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-700">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-500">No entries in this range. Adjust dates or category.</td>
                    </tr>
                  ) : (
                    entries.map((entry, index) => (
                      <tr key={entry.entryId || index} className="border-b border-gray-100 hover:bg-gray-50/80">
                        <td className="py-2 px-2">{entry.date}</td>
                        <td className="py-2 px-2">
                          <span className={`font-medium ${entry.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                            {entry.type === 'credit' ? 'Credit' : 'Debit'}
                          </span>
                        </td>
                        <td className="py-2 px-2">{entry.category || '-'}</td>
                        <td className="py-2 px-2 font-medium">{entry.name}</td>
                        <td className="py-2 px-2 max-w-[180px] truncate" title={entry.description}>{entry.description || '-'}</td>
                        <td className="py-2 px-2">{entry.type === 'credit' ? (entry.account || entry.customer || '-') : '-'}</td>
                        <td className="py-2 px-2">{entry.type === 'debit' ? (entry.mazdoor || entry.supplier || '-') : '-'}</td>
                        <td className="py-2 px-2 capitalize">{entry.paymentMethod || '-'}</td>
                        <td className={`py-2 px-2 text-right font-medium ${entry.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {entry.type === 'credit' ? '+' : '-'}{formatCurrency(entry.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default EntriesReport
