import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, Info, XCircle, Loader2, Brain, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card.jsx'

export const LoadingSpinner = ({ message = "Loading...", variant = "default" }) => {
  const variants = {
    default: {
      icon: <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>,
      color: "text-blue-600"
    },
    ai: {
      icon: <Brain className="h-16 w-16 text-purple-600 mx-auto mb-4 animate-pulse" />,
      color: "text-purple-600"
    },
    processing: {
      icon: <Loader2 className="h-16 w-16 text-green-600 mx-auto mb-4 animate-spin" />,
      color: "text-green-600"
    },
    analysis: {
      icon: <Zap className="h-16 w-16 text-orange-600 mx-auto mb-4 animate-bounce" />,
      color: "text-orange-600"
    }
  }

  const currentVariant = variants[variant] || variants.default

  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center animate-fade-in">
        {currentVariant.icon}
        <h3 className={`text-lg font-semibold ${currentVariant.color} mb-2`}>{message}</h3>
        <p className="text-gray-600">Please wait while we process your request...</p>
        <div className="flex justify-center mt-4">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

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

// Toast Notification System
export const Toast = ({ type = 'info', message, onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Allow fade-out animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const typeStyles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-500 text-white'
  }

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  }

  const Icon = icons[type]

  return (
    <div className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className={`${typeStyles[type]} px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 max-w-sm`}>
        <Icon className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(onClose, 300)
          }}
          className="ml-auto text-white hover:text-gray-200 transition-colors"
        >
          <XCircle className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// Toast Container for managing multiple toasts
export const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed top-4 right-4 z-50 space-y-2">
    {toasts.map((toast) => (
      <Toast
        key={toast.id}
        type={toast.type}
        message={toast.message}
        onClose={() => removeToast(toast.id)}
        duration={toast.duration}
      />
    ))}
  </div>
)

// Enhanced Loading States
export const SkeletonLoader = ({ lines = 3, className = "" }) => (
  <div className={`animate-pulse ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="h-4 bg-gray-200 rounded mb-2 last:mb-0" style={{
        width: `${Math.random() * 40 + 60}%`
      }}></div>
    ))}
  </div>
)

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="animate-pulse">
    <div className="grid grid-cols-4 gap-4 mb-4">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="h-6 bg-gray-300 rounded"></div>
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="grid grid-cols-4 gap-4 mb-2">
        {Array.from({ length: cols }).map((_, j) => (
          <div key={j} className="h-4 bg-gray-200 rounded"></div>
        ))}
      </div>
    ))}
  </div>
)

export const ChartSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-64 bg-gray-200 rounded mb-4"></div>
    <div className="flex justify-center space-x-4">
      <div className="h-4 w-16 bg-gray-200 rounded"></div>
      <div className="h-4 w-16 bg-gray-200 rounded"></div>
      <div className="h-4 w-16 bg-gray-200 rounded"></div>
    </div>
  </div>
)
