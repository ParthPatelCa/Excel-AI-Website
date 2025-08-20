import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'

// This version will gradually load the app and catch runtime errors
function GradualApp() {
  const [stage, setStage] = useState('init')
  const [error, setError] = useState(null)
  const [AppComponent, setAppComponent] = useState(null)

  useEffect(() => {
    const loadApp = async () => {
      try {
        console.log('🚀 Starting gradual app load...')
        
        // Stage 1: Load contexts
        setStage('loading-contexts')
        const { ThemeProvider } = await import('@/contexts/ThemeContext.jsx')
        const { AuthProvider } = await import('@/contexts/AuthContext.jsx')
        console.log('✅ Contexts loaded')

        // Stage 2: Test context initialization
        setStage('testing-contexts')
        // Create a simple test component wrapped in contexts
        const TestContexts = () => (
          <ThemeProvider>
            <AuthProvider>
              <div className="p-4 bg-green-100 text-green-800 rounded">
                Contexts initialized successfully!
              </div>
            </AuthProvider>
          </ThemeProvider>
        )
        setAppComponent(() => TestContexts)
        
        // Wait a moment to ensure contexts work
        await new Promise(resolve => setTimeout(resolve, 2000))
        console.log('✅ Contexts working')

        // Stage 3: Load main app
        setStage('loading-main-app')
        const { default: MainApp } = await import('./App.jsx')
        console.log('✅ Main app loaded')

        // Stage 4: Initialize main app
        setStage('initializing-app')
        setAppComponent(() => MainApp)
        console.log('✅ App initialized')

        setStage('complete')
      } catch (err) {
        console.error('❌ Error during app load:', err)
        setError(err)
        setStage('error')
      }
    }

    loadApp()
  }, [])

  // Loading states
  if (stage === 'init') {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Initializing DataSense AI...</p>
        </div>
      </div>
    )
  }

  if (stage === 'loading-contexts') {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Loading application contexts...</p>
        </div>
      </div>
    )
  }

  if (stage === 'testing-contexts') {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="animate-pulse bg-yellow-100 p-6 rounded-lg mb-4">
            <p className="text-yellow-800 font-medium">Testing context providers...</p>
          </div>
          {AppComponent && <AppComponent />}
        </div>
      </div>
    )
  }

  if (stage === 'loading-main-app') {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600 font-medium">Loading main application...</p>
        </div>
      </div>
    )
  }

  if (stage === 'initializing-app') {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-600 font-medium">Initializing application...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (stage === 'error') {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Runtime Error Detected</h1>
          <p className="text-gray-600 mb-4">
            The app failed during stage: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{stage}</span>
          </p>
          
          <div className="bg-red-100 border border-red-300 rounded p-4 mb-4">
            <h3 className="font-medium text-red-800 mb-2">Error Details:</h3>
            <pre className="text-sm text-red-700 overflow-auto whitespace-pre-wrap">
              {error?.message || 'Unknown error'}
            </pre>
            {error?.stack && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm">Stack Trace</summary>
                <pre className="text-xs mt-1 text-red-600 overflow-auto">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>

          <div className="space-y-2">
            <Button onClick={() => window.location.reload()} className="w-full">
              Reload Page
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.href = window.location.origin + '?mode=simple'}
              className="w-full"
            >
              Switch to Simple Mode
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.href = window.location.origin + '?mode=diagnostic'}
              className="w-full"
            >
              Return to Diagnostics
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Success - render the main app
  if (stage === 'complete' && AppComponent) {
    return (
      <div>
        <AppComponent />
      </div>
    )
  }

  // Fallback
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Something unexpected happened...</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Reload Page
        </Button>
      </div>
    </div>
  )
}

export default GradualApp
