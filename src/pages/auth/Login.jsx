import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await login(data.email, data.password)
      toast.success('Login successful!')
      navigate('/')
    } catch (error) {
      // Handle 401 errors gracefully without page refresh
      if (error.response?.status === 401) {
        toast.error('Invalid credentials. Please check your email and password.')
      } else {
        toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const formData = new FormData(e.target)
    const data = {
      email: formData.get('email'),
      password: formData.get('password')
    }
    
    await onSubmit(data)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-xs bg-white rounded-lg border border-gray-100 p-4">
        <div className="text-center mb-4">
          <h1 className="text-base font-semibold text-gray-900">Muslim Daal Mill</h1>
          <p className="text-[10px] text-gray-500 mt-0.5">Sign in</p>
        </div>

        <form onSubmit={handleFormSubmit}>
          <div className="mb-2.5">
            <label htmlFor="email" className="block text-[10px] font-medium text-gray-600 mb-0.5">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="Email"
              className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="block text-[10px] font-medium text-gray-600 mb-0.5">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Password"
              className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white hover:bg-primary-700 rounded-md text-xs font-medium h-8 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing In...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login

