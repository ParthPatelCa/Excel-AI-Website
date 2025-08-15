import { useState, useRef } from 'react'
import { Upload, X, CheckCircle, AlertCircle, FileSpreadsheet, Info } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { validateFile } from '@/utils/validation.js'
import { FileUploadError } from '@/components/ui/ErrorHandling.jsx'

export const EnhancedFileUpload = ({
  onFileSelect,
  onFileRemove,
  accept = ".xlsx,.xls,.csv",
  maxSize = 16,
  className = "",
  disabled = false
}) => {
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null)
  const [validation, setValidation] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef(null)

  const handleFiles = (files) => {
    if (files && files[0]) {
      const file = files[0]
      const validationResult = validateFile(file)
      
      setValidation(validationResult)
      setSelectedFile(file)
      
      if (validationResult.isValid) {
        simulateUpload(file)
      }
    }
  }

  const simulateUpload = async (file) => {
    setIsUploading(true)
    setUploadProgress(0)
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          if (onFileSelect) onFileSelect(file)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setValidation(null)
    setUploadProgress(0)
    setIsUploading(false)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    if (onFileRemove) onFileRemove()
  }

  const getFileIcon = (file) => {
    if (!file) return FileSpreadsheet
    
    const extension = file.name.toLowerCase().split('.').pop()
    switch (extension) {
      case 'xlsx':
      case 'xls':
        return FileSpreadsheet
      case 'csv':
        return FileSpreadsheet
      default:
        return FileSpreadsheet
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Zone */}
      {!selectedFile && (
        <div
          className={`
            relative border-2 border-dashed rounded-xl p-8 transition-all duration-200
            ${dragActive 
              ? 'border-indigo-400 bg-indigo-50' 
              : 'border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/30'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
            disabled={disabled}
            data-testid="file-input"
          />
          
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full flex items-center justify-center">
              <Upload className="h-8 w-8 text-indigo-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {dragActive ? 'Drop your file here' : 'Upload your data file'}
              </h3>
              <p className="text-gray-600 mb-4">
                Drag and drop your file here, or click to browse
              </p>
              
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                <Badge variant="outline" className="bg-white">Excel (.xlsx, .xls)</Badge>
                <Badge variant="outline" className="bg-white">CSV (.csv)</Badge>
              </div>
              
              <p className="text-sm text-gray-500">
                Maximum file size: {maxSize}MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Selected File Display */}
      {selectedFile && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {selectedFile.name}
                </h4>
                <p className="text-sm text-gray-500">
                  {validation?.fileInfo?.sizeFormatted}
                </p>
              </div>
            </div>
            
            {!isUploading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2" data-testid="upload-progress">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Uploading...</span>
                <span className="text-gray-600">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Validation Results */}
          {validation && !isUploading && (
            <div className="space-y-3">
              {/* Success State */}
              {validation.isValid && (
                <div className="flex items-center space-x-2 text-green-600" data-testid="upload-success">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">File validated successfully</span>
                </div>
              )}

              {/* Errors */}
              {validation.errors.length > 0 && (
                <div className="space-y-2" data-testid="file-error">
                  {validation.errors.map((error, index) => (
                    <div key={index} className="flex items-start space-x-2 text-red-600">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Warnings */}
              {validation.warnings?.length > 0 && (
                <div className="space-y-2">
                  {validation.warnings.map((warning, index) => (
                    <div key={index} className="flex items-start space-x-2 text-yellow-600">
                      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{warning}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              {validation.suggestions?.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h5 className="text-sm font-medium text-blue-800 mb-2">Suggestions:</h5>
                  <ul className="space-y-1">
                    {validation.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-blue-700">
                        • {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {validation && !validation.isValid && (
        <FileUploadError
          error={validation.errors.join('. ')}
          onRetry={() => inputRef.current?.click()}
          onDismiss={handleRemoveFile}
        />
      )}
    </div>
  )
}

// Enhanced Text Input with validation
export const EnhancedTextInput = ({
  value,
  onChange,
  placeholder = "Enter your text...",
  validator,
  minLength = 5,
  maxLength = 1000,
  className = "",
  label,
  description,
  showCharCount = true
}) => {
  const [focused, setFocused] = useState(false)
  const [validation, setValidation] = useState(null)

  const handleChange = (e) => {
    const newValue = e.target.value
    onChange(newValue)
    
    if (validator) {
      const result = validator(newValue)
      setValidation(result)
    }
  }

  const characterCount = value?.length || 0
  const isNearLimit = characterCount > maxLength * 0.8

  return (
    <div className={`space-y-3 ${className}`}>
      {(label || description) && (
        <div>
          {label && (
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
          )}
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      )}

      <div className="relative">
        <textarea
          value={value}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className={`
            w-full px-4 py-3 border rounded-lg resize-none transition-all duration-200
            ${focused 
              ? 'border-indigo-400 ring-2 ring-indigo-100' 
              : validation?.isValid === false 
              ? 'border-red-300' 
              : 'border-gray-300'
            }
            ${validation?.isValid === true ? 'border-green-300' : ''}
            focus:outline-none
          `}
          rows={4}
          maxLength={maxLength}
        />
        
        {/* Character Count */}
        {showCharCount && (
          <div className={`
            absolute bottom-2 right-2 text-xs px-2 py-1 rounded
            ${isNearLimit ? 'text-orange-600 bg-orange-50' : 'text-gray-500 bg-gray-50'}
          `}>
            {characterCount}/{maxLength}
          </div>
        )}
      </div>

      {/* Validation Display */}
      {validation && (
        <div className="space-y-2">
          {/* Errors */}
          {validation.errors?.length > 0 && (
            <div className="space-y-1">
              {validation.errors.map((error, index) => (
                <div key={index} className="flex items-start space-x-2 text-red-600">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              ))}
            </div>
          )}

          {/* Success */}
          {validation.isValid && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Looking good!</span>
            </div>
          )}

          {/* Suggestions */}
          {validation.suggestions?.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <h5 className="text-sm font-medium text-blue-800 mb-1">Tips:</h5>
              <ul className="space-y-1">
                {validation.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-blue-700">
                    • {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
