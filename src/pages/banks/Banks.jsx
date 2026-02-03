import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { FormInput } from '../../components/ui/form-input'
import Modal from '../../components/ui/Modal'
import Table from '../../components/ui/Table'
import api from '../../config/api'

const Banks = () => {
  const [banks, setBanks] = useState([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBank, setEditingBank] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 })

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm()

  useEffect(() => {
    fetchBanks()
  }, [pagination.page, searchTerm])

  const fetchBanks = async () => {
    try {
      setLoading(true)
      const response = await api.get('/banks', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm,
        },
      })
      setBanks(response.data.data || [])
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0,
      }))
    } catch (error) {
      toast.error('Failed to fetch banks')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingBank(null)
    reset()
    setIsModalOpen(true)
  }

  const handleEdit = (bank) => {
    setEditingBank(bank)
    setValue('name', bank.name)
    setValue('accountNumber', bank.accountNumber)
    setValue('branch', bank.branch)
    setValue('accountTitle', bank.accountTitle || '')
    setValue('iban', bank.iban || '')
    setIsModalOpen(true)
  }

  const handleDelete = async (bank) => {
    if (!window.confirm(`Are you sure you want to delete ${bank.name}?`)) {
      return
    }

    try {
      await api.delete(`/banks/${bank._id}`)
      toast.success('Bank deleted successfully')
      fetchBanks()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete bank')
    }
  }

  const onSubmit = async (data) => {
    try {
      const payload = {
        name: data.name,
        accountNumber: data.accountNumber,
        branch: data.branch,
        accountTitle: data.accountTitle || undefined,
        iban: data.iban || undefined,
      }
      if (editingBank) {
        await api.put(`/banks/${editingBank._id}`, payload)
        toast.success('Bank updated successfully')
      } else {
        await api.post('/banks', payload)
        toast.success('Bank added successfully')
      }
      setIsModalOpen(false)
      reset()
      fetchBanks()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save bank')
    }
  }

  const columns = [
    { key: 'name', label: 'Bank Name' },
    { key: 'accountNumber', label: 'Account Number' },
    { key: 'branch', label: 'Branch' },
    { key: 'accountTitle', label: 'Account Title', render: (value) => value || '-' },
    { key: 'iban', label: 'IBAN', render: (value) => value || '-' },
    {
      key: 'isActive',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ]

  const actions = [
    { key: 'edit', label: 'Edit', variant: 'primary' },
    { key: 'delete', label: 'Delete', variant: 'danger' },
  ]

  const handleAction = (action, bank) => {
    if (action === 'edit') {
      handleEdit(bank)
    } else if (action === 'delete') {
      handleDelete(bank)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Banks</h1>
          <p className="text-[10px] text-gray-500 mt-0.5">Manage bank accounts (Pakistan)</p>
        </div>
        <Button onClick={handleCreate} variant="primary">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Bank
        </Button>
      </div>

      <Card>
        <div className="mb-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by bank name, account number, branch..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className="w-full pl-8 pr-3 py-1.5 border border-gray-200 bg-white rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : (
          <Table
            columns={columns}
            data={banks}
            actions={actions}
            onAction={handleAction}
          />
        )}

        {pagination.total > pagination.limit && (
          <div className="mt-3 flex justify-between items-center">
            <p className="text-xs text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} banks
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page * pagination.limit >= pagination.total}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          reset()
        }}
        title={editingBank ? 'Edit Bank' : 'Add Bank'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-3">
            <FormInput
              label="Bank Name"
              name="name"
              register={register}
              required
              error={errors.name?.message}
              placeholder="e.g. HBL, UBL, MCB"
            />
            <FormInput
              label="Account Number"
              name="accountNumber"
              register={register}
              required
              error={errors.accountNumber?.message}
              placeholder="Bank account number"
            />
            <FormInput
              label="Branch"
              name="branch"
              register={register}
              required
              error={errors.branch?.message}
              placeholder="Branch name & city"
            />
            <FormInput
              label="Account Title (optional)"
              name="accountTitle"
              register={register}
              error={errors.accountTitle?.message}
              placeholder="As per bank record"
            />
            <FormInput
              label="IBAN (optional)"
              name="iban"
              register={register}
              error={errors.iban?.message}
              placeholder="PK00 XXXX XXXX XXXX XXXX XXXX XXXX"
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false)
                reset()
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingBank ? 'Update' : 'Add'} Bank
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Banks
