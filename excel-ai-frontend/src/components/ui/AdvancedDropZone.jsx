import { useState, useRef, useCallback } from 'react'
import { Upload, X, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { LoadingSpinner } from '@/components/ui/alerts.jsx'
import { useToast } from '@/hooks/useToast.js'

export function AdvancedDropZone({ 
  onFileUpload, 
  accept = '.xlsx,.xls,.csv',
  maxSize = 16 * 1024 * 1024, // 16MB
  multiple = false,
  disabled = false 
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const fileInputRef = useRef(null)
  const { showSuccess, showError } = useToast()

  const validateFile = useCallback((file) => {
    const errors = []
    
    // Check file type
    const extension = file.name.toLowerCase().split('.').pop()
    const allowedExtensions = accept.split(',').map(ext => ext.trim().replace('.', ''))
    if (!allowedExtensions.includes(extension)) {
      errors.push(`File type .${extension} is not supported`)
    }

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds limit of ${maxSize / 1024 / 1024}MB`)
    }

    return errors
  }, [accept, maxSize])

  const processFiles = useCallback(async (files) => {
    const fileList = Array.from(files)
    const validFiles = []
    const errors = []

    // Validate each file
    fileList.forEach(file => {
      const fileErrors = validateFile(file)
      if (fileErrors.length > 0) {
        errors.push(`${file.name}: ${fileErrors.join(', ')}`)
      } else {
        validFiles.push(file)
      }
    })

    // Show validation errors
    if (errors.length > 0) {
      showError(`Upload failed: ${errors.join('; ')}`)
      return
    }

    // Process valid files
    setIsUploading(true)
    setUploadProgress(0)

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]
        
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const newProgress = prev + Math.random() * 10
            return newProgress > 90 ? 90 : newProgress
          })
        }, 100)

        try {
          await onFileUpload(file, (progress) => {
            setUploadProgress(progress)
          })

          clearInterval(progressInterval)
          setUploadProgress(100)

          setUploadedFiles(prev => [...prev, {
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date()
          }])

          showSuccess(`${file.name} uploaded successfully!`)
        } catch (error) {
          clearInterval(progressInterval)
          throw error
        }
      }
    } catch (error) {
      showError(`Upload failed: ${error.message}`)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [validateFile, onFileUpload, showSuccess, showError])

  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !isUploading) {
      setIsDragging(true)
    }
  }, [disabled, isUploading])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled || isUploading) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFiles(files)
    }
  }, [disabled, isUploading, processFiles])

  const handleFileSelect = useCallback((e) => {
    const files = e.target.files
    if (files.length > 0) {
      processFiles(files)
    }
    // Reset input value to allow re-uploading same file
    e.target.value = ''
  }, [processFiles])

  const removeFile = useCallback((index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card 
        className={`
          relative border-2 border-dashed transition-all duration-200 cursor-pointer
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
          }
          ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
      >
        <CardContent className="p-12">
          <div className="text-center space-y-4">
            {isUploading ? (
              <>
                <LoadingSpinner variant="processing" size="lg" className="mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Uploading Files...</h3>
                  <Progress value={uploadProgress} className="w-full max-w-md mx-auto" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {uploadProgress}% complete
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className={`
                  p-4 rounded-full w-fit mx-auto transition-colors
                  ${isDragging 
                    ? 'bg-blue-100 dark:bg-blue-900/40' 
                    : 'bg-gray-100 dark:bg-gray-800'
                  }
                `}>
                  <Upload className={`h-12 w-12 ${
                    isDragging ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'
                  }`} />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {isDragging ? 'Drop files here' : 'Upload your files'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Drag and drop files here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Supports: {accept.split(',').join(', ')} • Max size: {formatFileSize(maxSize)}
                  </p>
                </div>

                <Button 
                  variant="outline" 
                  disabled={disabled}
                  className="mt-4"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
              </>
            )}
          </div>
        </CardContent>

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading}
        />
      </Card>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">
              Uploaded Files ({uploadedFiles.length})
            </h4>
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatFileSize(file.size)} • {file.uploadedAt.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(index)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default AdvancedDropZone
