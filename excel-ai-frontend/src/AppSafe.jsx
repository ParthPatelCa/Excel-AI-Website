import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">We're experiencing technical difficulties.</p>
            <details className="text-left bg-gray-100 p-4 rounded mb-4">
              <summary className="cursor-pointer">Error Details</summary>
              <pre className="text-xs mt-2 overflow-auto">
                {this.state.error?.toString()}
              </pre>
            </details>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Simple Safe App Component
function SafeApp() {
  const [appState, setAppState] = useState('loading')
  const [error, setError] = useState(null)

  useEffect(() => {
    // Test if all imports work
    const testApp = async () => {
      try {
        console.log('Testing app initialization...')
        
        // Test environment variables
        console.log('Environment check:', {
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'Present' : 'Missing',
          supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing'
        })

        // Try to load the main app components
        const { ThemeProvider } = await import('@/contexts/ThemeContext.jsx')
        const { AuthProvider } = await import('@/contexts/AuthContext.jsx')
        
        console.log('Core imports successful')
        setAppState('ready')
      } catch (err) {
        console.error('App initialization failed:', err)
        setError(err.message)
        setAppState('error')
      }
    }

    testApp()
  }, [])

  if (appState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading DataSense AI...</p>
          <p className="text-sm text-gray-400 mt-2">Initializing application...</p>
        </div>
      </div>
    )
  }

  if (appState === 'error') {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">App Failed to Load</h1>
          <p className="text-gray-600 mb-4">There was an error loading the application.</p>
          <div className="bg-gray-100 p-4 rounded mb-4 text-left">
            <h3 className="font-medium mb-2">Error:</h3>
            <p className="text-sm text-red-600">{error}</p>
          </div>
          <div className="space-y-2">
            <Button 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Reload Page
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                // Switch to no-auth mode
                window.location.href = window.location.origin + '?mode=simple'
              }}
              className="w-full"
            >
              Load Simple Version
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // If we get here, try to load the main app
  return <MainApp />
}

// Lazy load the main app
function MainApp() {
  const [MainAppComponent, setMainAppComponent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMainApp = async () => {
      try {
        // Check URL params for simple mode
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get('mode') === 'simple') {
          const { default: AppNoAuth } = await import('./AppNoAuth.jsx')
          setMainAppComponent(() => AppNoAuth)
        } else {
          const { default: App } = await import('./App.jsx')
          setMainAppComponent(() => App)
        }
      } catch (err) {
        console.error('Failed to load main app:', err)
        // Fallback to simple version
        const { default: AppNoAuth } = await import('./AppNoAuth.jsx')
        setMainAppComponent(() => AppNoAuth)
      } finally {
        setLoading(false)
      }
    }

    loadMainApp()
  }, [])

  if (loading || !MainAppComponent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    )
  }

  return <MainAppComponent />
}

export default SafeApp
