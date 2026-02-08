import React from 'react'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

const ErrorBoundaryFallback = ({ 
  error, 
  resetErrorBoundary, 
  componentName = 'Component'
}) => {
  const handleCopyError = () => {
    const errorDetails = {
      component: componentName,
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace available',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }
    
    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
    alert('Error details copied to clipboard')
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        
        <h2 className="text-lg font-bold text-center text-gray-900 mb-2">
          {componentName} Error
        </h2>
        
        <p className="text-gray-600 text-center mb-4">
          Something went wrong while loading this component.
        </p>

        {/* Error Message */}
        {error?.message && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800">
              <strong>Error:</strong> {error.message}
            </p>
          </div>
        )}

        {/* Development Details */}
        {process.env.NODE_ENV === 'development' && error?.stack && (
          <details className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
            <summary className="cursor-pointer font-medium text-gray-700 text-sm">
              Stack Trace (Development)
            </summary>
            <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-32">
              {error.stack}
            </pre>
          </details>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={resetErrorBoundary}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <RefreshCw className="w-3 h-3" />
              Reload
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <Home className="w-3 h-3" />
              Home
            </button>
          </div>
          
          <button
            onClick={handleCopyError}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded border border-gray-200"
          >
            📋 Copy Error Details
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            If this problem persists, please contact the development team
          </p>
        </div>
      </div>
    </div>
  )
}

export default ErrorBoundaryFallback
