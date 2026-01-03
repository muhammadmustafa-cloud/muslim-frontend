import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react'
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { FormInput } from '../../components/ui/form-input'
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
import { formatDate } from '../../utils/formatters'

const LabourRates = () => {
  const [labourRates, setLabourRates] = useState([])
  const [labourExpenses, setLabourExpenses] = useState([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLabourRate, setEditingLabourRate] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm()

  useEffect(() => {
    fetchLabourRates()
    fetchLabourExpenses()
  }, [searchTerm])

  const fetchLabourRates = async () => {
    try {
      setLoading(true)
      const response = await api.get('/labour-rates', {
        params: {
          page: 1,
          limit: 1000,
          search: searchTerm,
        },
      })
      setLabourRates(response.data.data || [])
    } catch (error) {
      toast.error('Failed to fetch labour records')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLabourExpenses = async () => {
    try {
      const response = await api.get('/labour-expenses', {
        params: { page: 1, limit: 1000, isActive: true }
      })
      setLabourExpenses(response.data.data || [])
    } catch (error) {
      toast.error('Failed to fetch labour expenses')
      console.error(error)
    }
  }

  const handleAddLabourRate = () => {
    setEditingLabourRate(null)
    reset({
      labourExpense: '',
      bags: ''
    })
    setIsModalOpen(true)
  }

  const handleEditLabourRate = (labourRate) => {
    setEditingLabourRate(labourRate)
    setValue('labourExpense', labourRate.labourExpense?._id || '')
    setValue('bags', labourRate.bags)
    setIsModalOpen(true)
  }

  const handleDeleteLabourRate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this labour record?')) {
      return
    }

    try {
      await api.delete(`/labour-rates/${id}`)
      toast.success('Labour record deleted successfully')
      fetchLabourRates()
    } catch (error) {
      toast.error('Failed to delete labour record')
      console.error(error)
    }
  }

  const onSubmit = async (data) => {
    try {
      // Get the labour expense to calculate rate
      const labourExpense = labourExpenses.find(le => le._id === data.labourExpense)
      const payload = {
        ...data,
        rate: labourExpense ? labourExpense.rate : 0
      }

      if (editingLabourRate) {
        await api.put(`/labour-rates/${editingLabourRate._id}`, payload)
        toast.success('Labour record updated successfully')
      } else {
        await api.post('/labour-rates', payload)
        toast.success('Labour record created successfully')
      }
      setIsModalOpen(false)
      fetchLabourRates()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save labour record')
      console.error(error)
    }
  }

  const columns = [
    {
      key: 'labourExpense.name',
      label: 'Labour Name',
      render: (value, row) => (
        <div className="font-medium text-gray-900">{row.labourExpense?.name || 'Unknown'}</div>
      ),
    },
    {
      key: 'bags',
      label: 'Bags',
      render: (value, row) => (
        <div className="flex items-center">
          <Package className="h-4 w-4 text-gray-500 mr-1" />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: 'rate',
      label: 'Rate',
      render: (value, row) => (
        <div className="flex items-center">
          <span className="text-sm font-bold text-green-600 mr-1">PKR</span>
          <span className="font-medium">{parseFloat(value).toFixed(2)}</span>
        </div>
      ),
    },
    {
      key: 'totalAmount',
      label: 'Total Amount',
      render: (value, row) => {
        const total = (row.bags || 0) * (row.rate || 0)
        return (
          <div className="flex items-center">
            <span className="text-sm font-bold text-green-600 mr-1">PKR</span>
            <span className="font-semibold text-green-600">{total.toFixed(2)}</span>
          </div>
        )
      },
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (value, row) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            value
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (value, row) => formatDate(value),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Labour</h1>
          <p className="text-gray-600">Manage labour work records and bag counts</p>
        </div>
        <Button onClick={handleAddLabourRate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Labour Record
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Labour Records</CardTitle>
          <CardDescription>
            View and manage all labour work records in your system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search labour records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={labourRates}
            loading={loading}
            onEdit={handleEditLabourRate}
            onDelete={handleDeleteLabourRate}
            searchPlaceholder="Search labour records..."
          />
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLabourRate ? 'Edit Labour Record' : 'Add Labour Record'}
            </DialogTitle>
            <DialogDescription>
              {editingLabourRate
                ? 'Update labour record information.'
                : 'Add a new labour record to your system.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Labour Name
                </label>
                <select
                  {...register('labourExpense', { required: 'Labour name is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select Labour</option>
                  {labourExpenses.map((expense) => (
                    <option key={expense._id} value={expense._id}>
                      {expense.name} (PKR {expense.rate})
                    </option>
                  ))}
                </select>
                {errors.labourExpense && (
                  <p className="text-red-500 text-sm mt-1">{errors.labourExpense.message}</p>
                )}
              </div>

              <FormInput
                label="Bags"
                name="bags"
                type="number"
                register={register}
                errors={errors}
                placeholder="Enter number of bags"
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingLabourRate ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default LabourRates
