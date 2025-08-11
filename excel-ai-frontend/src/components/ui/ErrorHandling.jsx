import { useState, useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home, X, Info, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.jsx'

export const ErrorAlert = ({ 
  error, 
  onRetry = null, 
  onDismiss = null,
  onGoHome = null,
  variant = "destructive"
}) => {
  return (
    <Alert variant={variant} className="border-red-200 bg-red-50">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertTitle className="text-red-800">Something went wrong</AlertTitle>
      <AlertDescription className="text-red-700 mt-2">
        {error || "An unexpected error occurred. Please try again."}
      </AlertDescription>
      
      {(onRetry || onDismiss || onGoHome) && (
        <div className="flex space-x-2 mt-4">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Try Again
            </Button>
          )}
          
          {onGoHome && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGoHome}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <Home className="h-4 w-4 mr-1" />
              Go Home
            </Button>
          )}
          
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-red-700 hover:bg-red-100"
            >
              <X className="h-4 w-4 mr-1" />
              Dismiss
            </Button>
          )}
        </div>
      )}
    </Alert>
  )
}

export const WarningAlert = ({ 
  title = "Warning", 
  message, 
  onConfirm = null,
  onCancel = null 
}) => {
  return (
    <Alert variant="default" className="border-yellow-200 bg-yellow-50">
      <Info className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-800">{title}</AlertTitle>
      <AlertDescription className="text-yellow-700 mt-2">
        {message}
      </AlertDescription>
      
      {(onConfirm || onCancel) && (
        <div className="flex space-x-2 mt-4">
          {onConfirm && (
            <Button
              variant="outline"
              size="sm"
              onClick={onConfirm}
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              Continue
            </Button>
          )}
          
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-yellow-700 hover:bg-yellow-100"
            >
              Cancel
            </Button>
          )}
        </div>
      )}
    </Alert>
  )
}

export const SuccessAlert = ({ 
  title = "Success!", 
  message, 
  onDismiss = null,
  autoHide = false,
  autoHideDelay = 5000
}) => {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setVisible(false)
        if (onDismiss) onDismiss()
      }, autoHideDelay)
      
      return () => clearTimeout(timer)
    }
  }, [autoHide, autoHideDelay, onDismiss])

  if (!visible) return null

  return (
    <Alert variant="default" className="border-green-200 bg-green-50">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertTitle className="text-green-800">{title}</AlertTitle>
      <AlertDescription className="text-green-700 mt-2">
        {message}
      </AlertDescription>
      
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setVisible(false)
            onDismiss()
          }}
          className="mt-4 text-green-700 hover:bg-green-100"
        >
          <X className="h-4 w-4 mr-1" />
          Dismiss
        </Button>
      )}
    </Alert>
  )
}

// File upload specific errors
export const FileUploadError = ({ error, onRetry, onDismiss }) => {
  const getFileErrorMessage = (error) => {
    if (error.includes('size')) {
      return {
        title: "File too large",
        message: "Please upload a file smaller than 16MB. Consider compressing your data or splitting it into smaller files.",
        icon: AlertTriangle
      }
    }
    
    if (error.includes('type') || error.includes('format')) {
      return {
        title: "Unsupported file type",
        message: "Please upload an Excel file (.xlsx, .xls) or CSV file. Other formats are not currently supported.",
        icon: XCircle
      }
    }
    
    if (error.includes('empty')) {
      return {
        title: "Empty file",
        message: "The uploaded file appears to be empty. Please check your file and try again.",
        icon: AlertTriangle
      }
    }
    
    return {
      title: "Upload failed",
      message: error || "There was a problem uploading your file. Please check your internet connection and try again.",
      icon: XCircle
    }
  }

  const errorInfo = getFileErrorMessage(error)
  const Icon = errorInfo.icon

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 space-y-4">
      <div className="flex items-start space-x-3">
        <Icon className="h-6 w-6 text-red-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-800">{errorInfo.title}</h3>
          <p className="text-red-700 mt-1">{errorInfo.message}</p>
        </div>
      </div>
      
      <div className="flex space-x-3">
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Try Again
          </Button>
        )}
        
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="text-red-700 hover:bg-red-100"
          >
            Dismiss
          </Button>
        )}
      </div>
    </div>
  )
}

// API error handler
export const APIErrorHandler = ({ error, operation = "operation", onRetry }) => {
  const getErrorDetails = (error) => {
    if (error.includes('network') || error.includes('fetch')) {
      return {
        title: "Connection Error",
        message: "Unable to connect to our servers. Please check your internet connection and try again.",
        canRetry: true
      }
    }
    
    if (error.includes('timeout')) {
      return {
        title: "Request Timeout",
        message: "The request is taking longer than expected. This might happen with large files or slow connections.",
        canRetry: true
      }
    }
    
    if (error.includes('500') || error.includes('server')) {
      return {
        title: "Server Error",
        message: "Our servers are experiencing issues. Please try again in a few moments.",
        canRetry: true
      }
    }
    
    if (error.includes('401') || error.includes('unauthorized')) {
      return {
        title: "Authentication Error",
        message: "Your session has expired. Please refresh the page and try again.",
        canRetry: false
      }
    }
    
    return {
      title: "Unexpected Error",
      message: `Failed to complete ${operation}. Please try again or contact support if the problem persists.`,
      canRetry: true
    }
  }

  const errorDetails = getErrorDetails(error)

  return (
    <ErrorAlert
      error={`${errorDetails.title}: ${errorDetails.message}`}
      onRetry={errorDetails.canRetry ? onRetry : null}
    />
  )
}
