import { Loader2, Brain, BarChart3, Upload } from 'lucide-react'

export const LoadingSpinner = ({ 
  message = "Loading...", 
  size = "default",
  variant = "default"
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6", 
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-3 p-8">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-indigo-600`} />
      <p className="text-sm text-gray-600 animate-pulse">{message}</p>
    </div>
  )
}

export const AnalysisLoader = ({ message = "Analyzing your data..." }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
      <div className="relative">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center animate-pulse">
          <Brain className="h-8 w-8 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
          <Loader2 className="h-3 w-3 animate-spin text-indigo-600" />
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">{message}</h3>
        <p className="text-sm text-gray-600">
          This may take a few moments for large datasets...
        </p>
      </div>
      
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
      </div>
    </div>
  )
}

export const UploadLoader = ({ progress = 0, fileName = "file" }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4 border border-gray-100">
      <div className="flex items-center space-x-3">
        <div className="bg-blue-100 p-2 rounded-lg">
          <Upload className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">Uploading {fileName}</h4>
          <p className="text-sm text-gray-600">{progress}% complete</p>
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  )
}

export const VisualizationLoader = ({ message = "Creating visualization..." }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
      <div className="relative">
        <BarChart3 className="h-12 w-12 text-purple-600 animate-pulse" />
        <Loader2 className="h-4 w-4 absolute -top-1 -right-1 animate-spin text-purple-600" />
      </div>
      <div className="text-center">
        <h4 className="font-medium text-gray-900">{message}</h4>
        <p className="text-sm text-gray-600">Generating your chart...</p>
      </div>
    </div>
  )
}

// Progress bar component for multi-step processes
export const ProgressSteps = ({ steps, currentStep }) => {
  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              index < currentStep 
                ? 'bg-green-500 text-white' 
                : index === currentStep 
                ? 'bg-indigo-600 text-white animate-pulse' 
                : 'bg-gray-200 text-gray-500'
            }`}>
              {index < currentStep ? '✓' : index + 1}
            </div>
            {index < steps.length - 1 && (
              <div className={`h-1 w-16 mx-2 rounded ${
                index < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`}></div>
            )}
          </div>
        ))}
      </div>
      
      <div className="text-center">
        <p className="text-sm font-medium text-gray-900">
          {steps[currentStep]}
        </p>
      </div>
    </div>
  )
}
