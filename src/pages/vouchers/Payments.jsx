import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Search, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { FormInput } from '../../components/ui/form-input'
import { FormSelect } from '../../components/ui/form-select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { DataTable } from '../../components/ui/data-table'
import api from '../../config/api'
import { formatCurrency, formatDate } from '../../utils/formatters'

const Payments = () => {
  const [payments, setPayments] = useState([])
  const [accounts, setAccounts] = useState([])
  const [mazdoors, setMazdoors] = useState([])
  const [customers, setCustomers] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [paymentType, setPaymentType] = useState('payment')
  const [editingPayment, setEditingPayment] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalReceipts: 0,
    cashPayments: 0,
    chequePayments: 0
  })
  const [viewingPayment, setViewingPayment] = useState(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm()
  const paymentMethod = watch('paymentMethod')
  const category = watch('category')

  useEffect(() => {
    fetchPayments()
    fetchAccounts()
    fetchMazdoors()
    fetchCustomers()
    fetchSuppliers()
  }, [searchTerm, filterType])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const params = {
        page: 1,
        limit: 1000,
        search: searchTerm,
      }
      if (filterType !== 'all') {
        params.type = filterType
      }
      const response = await api.get('/payments', { params })
      setPayments(response.data.data || [])
      
      if (response.data.pagination) {
        setStats({
          totalPayments: response.data.pagination.totalPayments || 0,
          totalReceipts: response.data.pagination.totalReceipts || 0,
          cashPayments: response.data.pagination.cashPayments || 0,
          chequePayments: response.data.pagination.chequePayments || 0
        })
      }
    } catch (error) {
      toast.error('Failed to fetch payments')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounts?limit=1000&isActive=true')
      setAccounts(response.data.data || [])
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }

  const fetchMazdoors = async () => {
    try {
      const response = await api.get('/mazdoors?limit=1000')
      setMazdoors(response.data.data || [])
    } catch (error) {
      console.error('Error fetching mazdoors:', error)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers?limit=1000')
      setCustomers(response.data.data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers?limit=1000')
      setSuppliers(response.data.data || [])
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const handleCreate = (type) => {
    setPaymentType(type)
    setEditingPayment(null)
    reset()
    setValue('date', new Date().toISOString().split('T')[0])
    setValue('paymentMethod', 'cash')
    setValue('type', type)
    setIsModalOpen(true)
  }

  const handleView = (payment) => {
    setViewingPayment(payment)
    setIsViewModalOpen(true)
  }

  const handleEdit = (payment) => {
    setEditingPayment(payment)
    setPaymentType(payment.type)
    setValue('type', payment.type)
    setValue('date', payment.date ? new Date(payment.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
    setValue('description', payment.description)
    setValue('amount', payment.amount)
    setValue('paymentMethod', payment.paymentMethod || 'cash')
    setValue('category', payment.category || '')
    setValue('chequeNumber', payment.chequeNumber || '')
    setValue('fromAccount', payment.fromAccount?._id || payment.fromAccount || '')
    setValue('toAccount', payment.toAccount?._id || payment.toAccount || '')
    setValue('paidTo', payment.paidTo || '')
    setValue('receivedFrom', payment.receivedFrom || '')
    setValue('mazdoor', payment.mazdoor?._id || payment.mazdoor || '')
    setValue('customer', payment.customer?._id || payment.customer || '')
    setValue('supplier', payment.supplier?._id || payment.supplier || '')
    setValue('notes', payment.notes || '')
    setIsModalOpen(true)
  }

  const handleDelete = async (payment) => {
    if (!window.confirm('Are you sure you want to delete this payment/receipt?')) {
      return
    }

    try {
      await api.delete(`/payments/${payment._id}`)
      toast.success('Deleted successfully')
      fetchPayments()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete payment')
    }
  }

  const onSubmit = async (data) => {
    try {
      const paymentData = {
        ...data,
        type: paymentType,
        date: data.date || new Date(),
      }

      // Handle references
      if (paymentData.category === 'mazdoor' && data.paidTo) {
        paymentData.mazdoor = data.paidTo
        paymentData.paidTo = mazdoors.find(m => m._id === data.paidTo)?.name || data.paidTo
      } else if (paymentData.category === 'raw_material' && data.paidTo) {
        paymentData.supplier = data.paidTo
        paymentData.paidTo = suppliers.find(s => s._id === data.paidTo)?.name || data.paidTo
      }

      if (paymentType === 'receipt' && data.receivedFrom) {
        paymentData.customer = data.receivedFrom
        paymentData.receivedFrom = customers.find(c => c._id === data.receivedFrom)?.name || data.receivedFrom
      }

      if (editingPayment) {
        await api.put(`/payments/${editingPayment._id}`, paymentData)
        toast.success('Updated successfully')
      } else {
        await api.post('/payments', paymentData)
        toast.success(`${paymentType === 'payment' ? 'Payment' : 'Receipt'} recorded successfully`)
      }
      setIsModalOpen(false)
      reset()
      fetchPayments()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save payment')
    }
  }

  const columns = [
    { 
      key: 'voucherNumber', 
      label: 'Voucher #',
    },
    {
      key: 'type',
      label: 'Type',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          value === 'payment' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}>
          {value === 'payment' ? 'Payment' : 'Receipt'}
        </span>
      ),
    },
    { 
      key: 'description', 
      label: 'Description',
    },
    {
      key: 'paidTo',
      label: 'Paid To / Received From',
      render: (value, row) => row.paidTo || row.receivedFrom || '-',
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => formatCurrency(value || 0),
    },
    {
      key: 'paymentMethod',
      label: 'Method',
      render: (value) => (
        <span className="capitalize">{value?.replace('_', ' ') || 'Cash'}</span>
      ),
    },
    {
      key: 'fromAccount',
      label: 'Account',
      render: (value, row) => {
        const account = row.fromAccount || row.toAccount
        return account?.name || account || '-'
      },
    },
    {
      key: 'date',
      label: 'Date',
      render: (value) => formatDate(value),
    },
    {
      key: 'source',
      label: 'Source',
      render: (value) =>
        value === 'daily_cash_memo' ? (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800" title="Created from Daily Cash Memo">Daily Cash Memo</span>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        ),
    },
  ]

  const accountOptions = accounts.map(acc => ({
    value: acc._id,
    label: `${acc.name} (${acc.code})`
  }))

  const paymentMethodOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'online', label: 'Online Transfer' },
  ]

  const mazdoorOptions = mazdoors.map(m => ({
    value: m._id,
    label: m.name
  }))

  const customerOptions = customers.map(c => ({
    value: c._id,
    label: c.name
  }))

  const supplierOptions = suppliers.map(s => ({
    value: s._id,
    label: s.name
  }))

  const expenseCategories = [
    { value: 'mazdoor', label: 'Mazdoor Salary' },
    { value: 'electricity', label: 'Electricity Bill' },
    { value: 'rent', label: 'Rent' },
    { value: 'transport', label: 'Transport' },
    { value: 'raw_material', label: 'Raw Material Purchase' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'other', label: 'Other Expense' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Payments & Receipts</h1>
          <p className="text-gray-600 mt-1.5">
            Record money going out (payments) and money coming in (receipts). Entries added from Daily Cash Memo appear here with &quot;Daily Cash Memo&quot; in Source.
            <br />
            <span className="text-sm text-primary-600 font-medium">Note: For item sales/purchases use the Transactions page</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="danger" onClick={() => handleCreate('payment')}>
            <ArrowDownCircle className="h-4 w-4 mr-1.5" />
            Payment
          </Button>
          <Button variant="success" onClick={() => handleCreate('receipt')}>
            <ArrowUpCircle className="h-4 w-4 mr-1.5" />
            Receipt
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-center">
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Total Payments</p>
              <p className="text-lg font-semibold text-red-600 mt-0.5">
                {formatCurrency(stats.totalPayments)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-center">
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Total Receipts</p>
              <p className="text-lg font-semibold text-green-600 mt-0.5">
                {formatCurrency(stats.totalReceipts)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-center">
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Cash Payments</p>
              <p className="text-lg font-semibold text-gray-900 mt-0.5">
                {stats.cashPayments}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-center">
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Cheque Payments</p>
              <p className="text-lg font-semibold text-gray-900 mt-0.5">
                {stats.chequePayments}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Payments & Receipts</CardTitle>
          <CardDescription>
            View and manage all your payments and receipts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-200 bg-white rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 bg-white rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">All</option>
              <option value="payment">Payments Only</option>
              <option value="receipt">Receipts Only</option>
            </select>
          </div>
          <DataTable
            columns={columns}
            data={payments}
            loading={loading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPayment 
                ? `Edit ${paymentType === 'payment' ? 'Payment' : 'Receipt'}` 
                : paymentType === 'payment' ? 'Make Payment' : 'Record Receipt'
              }
            </DialogTitle>
            <DialogDescription>
              {paymentType === 'payment' 
                ? 'Record money going out from your account (expenses, salaries, bills, etc.)'
                : 'Record non-sale money coming into your account (loans, refunds, other income). For customer sales, use the Transactions page.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormInput
                label="Date"
                name="date"
                type="date"
                register={register}
                required
                error={errors.date?.message}
              />
              <FormInput
                label="Voucher Number"
                name="voucherNumber"
                defaultValue={editingPayment?.voucherNumber || 'Auto-generated'}
                disabled
              />
            </div>

            {paymentType === 'payment' ? (
              <>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800 mb-1">💰 Money Going Out</p>
                  <p className="text-xs text-red-600">This amount will be deducted from your account</p>
                </div>

                <FormSelect
                  label="Pay From Account *"
                  name="fromAccount"
                  register={register}
                  required
                  options={accountOptions}
                  error={errors.fromAccount?.message}
                  placeholder="Select account (Cash or Bank)"
                />

                <FormSelect
                  label="Payment Method *"
                  name="paymentMethod"
                  register={register}
                  required
                  options={paymentMethodOptions}
                  error={errors.paymentMethod?.message}
                />

                {paymentMethod === 'cheque' && (
                  <FormInput
                    label="Cheque Number *"
                    name="chequeNumber"
                    register={register}
                    required
                    placeholder="e.g., CHQ-12345"
                    error={errors.chequeNumber?.message}
                  />
                )}

                <FormSelect
                  label="What are you paying for? *"
                  name="category"
                  register={register}
                  required
                  options={expenseCategories}
                  error={errors.category?.message}
                  placeholder="Select category"
                />

                {category === 'mazdoor' ? (
                  <FormSelect
                    label="Select Mazdoor *"
                    name="paidTo"
                    register={register}
                    required
                    options={mazdoorOptions}
                    error={errors.paidTo?.message}
                    placeholder="Select mazdoor"
                  />
                ) : category === 'raw_material' ? (
                  <FormSelect
                    label="Select Supplier *"
                    name="paidTo"
                    register={register}
                    required
                    options={supplierOptions}
                    error={errors.paidTo?.message}
                    placeholder="Select supplier"
                  />
                ) : (
                  <FormInput
                    label="Pay To (Name) *"
                    name="paidTo"
                    register={register}
                    required
                    placeholder="Enter name or company"
                    error={errors.paidTo?.message}
                  />
                )}

                <FormInput
                  label="Description *"
                  name="description"
                  register={register}
                  required
                  placeholder="e.g., Mazdoor Salary - Ahmed Khan"
                  error={errors.description?.message}
                />

                <FormInput
                  label="Amount (PKR) *"
                  name="amount"
                  type="number"
                  step="0.01"
                  register={register}
                  required
                  placeholder="0.00"
                  error={errors.amount?.message}
                />
              </>
            ) : (
              <>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800 mb-1">💰 Money Coming In</p>
                  <p className="text-xs text-green-600">This amount will be added to your account</p>
                </div>

                <FormSelect
                  label="Receive To Account *"
                  name="toAccount"
                  register={register}
                  required
                  options={accountOptions}
                  error={errors.toAccount?.message}
                  placeholder="Select account (Cash or Bank)"
                />

                <FormSelect
                  label="Payment Method *"
                  name="paymentMethod"
                  register={register}
                  required
                  options={paymentMethodOptions}
                  error={errors.paymentMethod?.message}
                />

                {paymentMethod === 'cheque' && (
                  <FormInput
                    label="Cheque Number *"
                    name="chequeNumber"
                    register={register}
                    required
                    placeholder="e.g., CHQ-12345"
                    error={errors.chequeNumber?.message}
                  />
                )}

                <FormSelect
                  label="Received From *"
                  name="receivedFrom"
                  register={register}
                  required
                  options={customerOptions}
                  error={errors.receivedFrom?.message}
                  placeholder="Select customer"
                />

                <FormInput
                  label="Description *"
                  name="description"
                  register={register}
                  required
                  placeholder="e.g., Payment from customer"
                  error={errors.description?.message}
                />

                <FormInput
                  label="Amount (PKR) *"
                  name="amount"
                  type="number"
                  step="0.01"
                  register={register}
                  required
                  placeholder="0.00"
                  error={errors.amount?.message}
                />
              </>
            )}

            <FormInput
              label="Notes (Optional)"
              name="notes"
              register={register}
              error={errors.notes?.message}
              placeholder="Additional notes..."
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false)
                  reset()
                  setEditingPayment(null)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant={paymentType === 'payment' ? 'danger' : 'success'}>
                {editingPayment ? 'Update' : 'Record'} {paymentType === 'payment' ? 'Payment' : 'Receipt'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View details: Where did this money go / come from? */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingPayment?.type === 'payment' ? (
                <>Where did this <span className="text-red-600">{formatCurrency(viewingPayment?.amount)}</span> go?</>
              ) : (
                <>Where did this <span className="text-green-600">{formatCurrency(viewingPayment?.amount)}</span> come from?</>
              )}
            </DialogTitle>
            <DialogDescription>
              Full details of this {viewingPayment?.type === 'payment' ? 'payment' : 'receipt'}
            </DialogDescription>
          </DialogHeader>
          {viewingPayment && (
            <div className="space-y-4">
              {/* One-line summary: e.g. "Mazdoor Ahmed received 8,000 from Bank on 15 Jan 2025" */}
              <div className="p-3 rounded-lg bg-primary-50 border border-primary-200">
                <p className="text-sm font-medium text-gray-700">
                  {viewingPayment.type === 'payment' ? (
                    viewingPayment.category === 'mazdoor' && (viewingPayment.paidTo || viewingPayment.mazdoor?.name) ? (
                      <>Mazdoor <span className="font-semibold">{viewingPayment.mazdoor?.name || viewingPayment.paidTo}</span> received {formatCurrency(viewingPayment.amount)} from {(viewingPayment.fromAccount?.name || viewingPayment.fromAccount) || 'account'} on {formatDate(viewingPayment.date)}.</>
                    ) : viewingPayment.category === 'raw_material' && (viewingPayment.paidTo || viewingPayment.supplier?.name) ? (
                      <>Supplier <span className="font-semibold">{viewingPayment.supplier?.name || viewingPayment.paidTo}</span> received {formatCurrency(viewingPayment.amount)} from {(viewingPayment.fromAccount?.name || viewingPayment.fromAccount) || 'account'} on {formatDate(viewingPayment.date)}.</>
                    ) : (
                      <>Payment of {formatCurrency(viewingPayment.amount)} to <span className="font-semibold">{viewingPayment.paidTo || '—'}</span> from {(viewingPayment.fromAccount?.name || viewingPayment.fromAccount) || 'account'} on {formatDate(viewingPayment.date)}.</>
                    )
                  ) : (
                    <>Received {formatCurrency(viewingPayment.amount)} from <span className="font-semibold">{viewingPayment.receivedFrom || '—'}</span> into {(viewingPayment.toAccount?.name || viewingPayment.toAccount) || 'account'} on {formatDate(viewingPayment.date)}.</>
                  )}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-sm font-medium text-gray-500">Amount</p>
                <p className={`text-lg font-semibold ${viewingPayment.type === 'payment' ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(viewingPayment.amount)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 font-medium">Voucher #</p>
                  <p className="text-gray-900">{viewingPayment.voucherNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Date</p>
                  <p className="text-gray-900">{formatDate(viewingPayment.date)}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Type</p>
                  <p className="text-gray-900 capitalize">{viewingPayment.type === 'payment' ? 'Payment (money out)' : 'Receipt (money in)'}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Method</p>
                  <p className="text-gray-900 capitalize">{viewingPayment.paymentMethod?.replace('_', ' ') || '-'}</p>
                </div>
              </div>

              {viewingPayment.type === 'payment' ? (
                <>
                  <div>
                    <p className="text-gray-500 font-medium text-sm">Paid from account</p>
                    <p className="text-gray-900">{(viewingPayment.fromAccount?.name || viewingPayment.fromAccount) || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium text-sm">Paid to</p>
                    <p className="text-gray-900">{viewingPayment.paidTo || '-'}</p>
                  </div>
                  {viewingPayment.category && (
                    <div>
                      <p className="text-gray-500 font-medium text-sm">Category</p>
                      <p className="text-gray-900 capitalize">{viewingPayment.category.replace('_', ' ')}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <p className="text-gray-500 font-medium text-sm">Received to account</p>
                    <p className="text-gray-900">{(viewingPayment.toAccount?.name || viewingPayment.toAccount) || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium text-sm">Received from</p>
                    <p className="text-gray-900">{viewingPayment.receivedFrom || '-'}</p>
                  </div>
                </>
              )}

              <div>
                <p className="text-gray-500 font-medium text-sm">Description</p>
                <p className="text-gray-900">{viewingPayment.description || '-'}</p>
              </div>
              {viewingPayment.chequeNumber && (
                <div>
                  <p className="text-gray-500 font-medium text-sm">Cheque number</p>
                  <p className="text-gray-900">{viewingPayment.chequeNumber}</p>
                </div>
              )}
              {viewingPayment.notes && (
                <div>
                  <p className="text-gray-500 font-medium text-sm">Notes</p>
                  <p className="text-gray-900">{viewingPayment.notes}</p>
                </div>
              )}

              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Recorded by <span className="font-medium text-gray-700">{viewingPayment.createdBy?.name || '—'}</span>
                  {viewingPayment.createdAt && (
                    <> on {formatDate(viewingPayment.createdAt)}</>
                  )}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
            <Button onClick={() => { if (viewingPayment) handleEdit(viewingPayment); setIsViewModalOpen(false); }}>
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Payments
