import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console and potentially to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    })

    // You can also log the error to an error reporting service here
    // logErrorToService(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              
              <h1 className="text-xl font-bold text-center text-gray-900 mb-2">
                Something went wrong
              </h1>
              
              <p className="text-gray-600 text-center mb-6">
                We're sorry, but something unexpected happened. 
                The error has been logged and we'll look into it.
              </p>

              {/* Error Details for Development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
                  <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                    Error Details (Development Only)
                  </summary>
                  <div className="mt-2 text-sm">
                    <p className="font-mono text-red-600 mb-2">
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo && (
                      <pre className="text-xs text-gray-600 overflow-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
                
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Go Home
                </button>
              </div>

              {/* Additional Actions */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 text-center mb-3">
                  If the problem persists, you can:
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded border border-gray-200"
                  >
                    🔄 Refresh the page
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `Error: ${this.state.error?.toString()}\n\n` +
                        `Component Stack: ${this.state.errorInfo?.componentStack || 'N/A'}\n\n` +
                        `URL: ${window.location.href}\n\n` +
                        `User Agent: ${navigator.userAgent}\n\n` +
                        `Timestamp: ${new Date().toISOString()}`
                      )
                      alert('Error details copied to clipboard. You can share this with the development team.')
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded border border-gray-200"
                  >
                    📋 Copy error details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
