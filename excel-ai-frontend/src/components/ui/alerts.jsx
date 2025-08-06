import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card.jsx'

export const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center py-20">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{message}</h3>
      <p className="text-gray-600">Please wait while we process your request...</p>
    </div>
  </div>
)

export const ErrorAlert = ({ error, onRetry, onDismiss }) => (
  <Card className="border-red-200 bg-red-50">
    <CardContent className="p-6">
      <div className="flex items-start space-x-3">
        <XCircle className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Something went wrong
          </h3>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="flex space-x-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-100 transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)

export const SuccessAlert = ({ message, onDismiss }) => (
  <Card className="border-green-200 bg-green-50">
    <CardContent className="p-6">
      <div className="flex items-start space-x-3">
        <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Success!
          </h3>
          <p className="text-green-700 mb-4">{message}</p>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
)

export const InfoAlert = ({ message, onDismiss }) => (
  <Card className="border-blue-200 bg-blue-50">
    <CardContent className="p-6">
      <div className="flex items-start space-x-3">
        <Info className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-blue-700 mb-4">{message}</p>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Got it
            </button>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
)

export const ProgressBar = ({ progress, message }) => (
  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
    <div 
      className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
      style={{ width: `${progress}%` }}
    ></div>
    {message && (
      <p className="text-sm text-gray-600 mt-2 text-center">{message}</p>
    )}
  </div>
)
