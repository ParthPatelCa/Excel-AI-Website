// Accessibility utilities and components for DataSense AI
import { useEffect, useRef, useState } from 'react'

// ARIA live region for screen reader announcements
export const LiveRegion = ({ children, politeness = 'polite', className = "" }) => {
  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      className={`sr-only ${className}`}
      role="status"
    >
      {children}
    </div>
  )
}

// Skip navigation link
export const SkipToContent = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-indigo-600 text-white px-4 py-2 rounded-md font-medium transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
    >
      Skip to main content
    </a>
  )
}

// Progress indicator with accessibility
export const AccessibleProgress = ({ 
  value, 
  max = 100, 
  label = "Progress",
  description,
  className = ""
}) => {
  const percentage = Math.round((value / max) * 100)
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm">
        <span id="progress-label">{label}</span>
        <span aria-hidden="true">{percentage}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-labelledby="progress-label"
        aria-describedby={description ? "progress-description" : undefined}
        className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700"
      >
        <div 
          className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {description && (
        <p id="progress-description" className="text-xs text-gray-500">
          {description}
        </p>
      )}
      <LiveRegion>
        {label} {percentage}% complete
      </LiveRegion>
    </div>
  )
}

// Accessible button with loading state
export const AccessibleButton = ({
  children,
  loading = false,
  loadingText = "Loading...",
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  onClick,
  type = "button",
  variant = "primary",
  size = "default",
  className = "",
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
  
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white",
    outline: "border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-indigo-500 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
  }
  
  const sizes = {
    sm: "px-3 py-2 text-sm rounded-md",
    default: "px-4 py-2 text-base rounded-lg",
    lg: "px-6 py-3 text-lg rounded-xl"
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-3 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {loading ? loadingText : children}
    </button>
  )
}

// Focus trap for modals and dropdowns
export const useFocusTrap = (isActive) => {
  const ref = useRef(null)

  useEffect(() => {
    if (!isActive) return

    const element = ref.current
    if (!element) return

    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus()
          e.preventDefault()
        }
      }
    }

    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        // Let parent handle escape
        e.stopPropagation()
      }
    }

    element.addEventListener('keydown', handleTabKey)
    element.addEventListener('keydown', handleEscapeKey)
    
    // Focus first element when trap becomes active
    firstElement?.focus()

    return () => {
      element.removeEventListener('keydown', handleTabKey)
      element.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isActive])

  return ref
}

// Accessible form field wrapper
export const AccessibleField = ({
  label,
  error,
  help,
  required = false,
  children,
  className = ""
}) => {
  const fieldId = `field-${Math.random().toString(36).substr(2, 9)}`
  const errorId = error ? `${fieldId}-error` : undefined
  const helpId = help ? `${fieldId}-help` : undefined

  return (
    <div className={`space-y-2 ${className}`}>
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">*</span>
        )}
      </label>
      
      <div className="relative">
        {children({ 
          id: fieldId, 
          'aria-describedby': [errorId, helpId].filter(Boolean).join(' ') || undefined,
          'aria-invalid': error ? 'true' : undefined,
          'aria-required': required
        })}
      </div>
      
      {help && (
        <p id={helpId} className="text-sm text-gray-500 dark:text-gray-400">
          {help}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// Screen reader only text
export const ScreenReaderOnly = ({ children, className = "" }) => {
  return (
    <span className={`sr-only ${className}`}>
      {children}
    </span>
  )
}

// Accessible modal backdrop
export const AccessibleModal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = ""
}) => {
  const modalRef = useFocusTrap(isOpen)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'auto'
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={description ? "modal-description" : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-auto ${className}`}
      >
        <div className="p-6">
          <h2 id="modal-title" className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {title}
          </h2>
          
          {description && (
            <p id="modal-description" className="text-gray-600 dark:text-gray-300 mb-4">
              {description}
            </p>
          )}
          
          {children}
        </div>
      </div>
    </div>
  )
}

// Accessible tooltip
export const AccessibleTooltip = ({
  content,
  children,
  position = "top",
  className = ""
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-describedby={isVisible ? tooltipId : undefined}
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`
            absolute z-50 px-2 py-1 text-sm bg-gray-900 text-white rounded shadow-lg
            ${position === 'top' ? 'bottom-full left-1/2 transform -translate-x-1/2 mb-2' : ''}
            ${position === 'bottom' ? 'top-full left-1/2 transform -translate-x-1/2 mt-2' : ''}
            ${position === 'left' ? 'right-full top-1/2 transform -translate-y-1/2 mr-2' : ''}
            ${position === 'right' ? 'left-full top-1/2 transform -translate-y-1/2 ml-2' : ''}
            ${className}
          `}
        >
          {content}
        </div>
      )}
    </div>
  )
}
