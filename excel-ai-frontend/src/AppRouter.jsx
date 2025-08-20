import React from 'react'

// Lazy load components outside the router function to avoid re-creation
const SimpleApp = React.lazy(() => import('./AppNoAuth.jsx'))
const DiagnosticApp = React.lazy(() => import('./AppDiagnostic.jsx'))
const GradualApp = React.lazy(() => import('./AppGradual.jsx'))
const DebuggerApp = React.lazy(() => import('./AppDebugger.jsx'))
const MainApp = React.lazy(() => import('./App.jsx'))

function AppRouter() {
  // Check URL parameters to determine which app to load
  const urlParams = new URLSearchParams(window.location.search)
  const mode = urlParams.get('mode')

  const LoadingSpinner = ({ message = "Loading..." }) => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )

  // Route to different app versions based on URL parameter
  switch (mode) {
    case 'simple':
      return (
        <React.Suspense fallback={<LoadingSpinner message="Loading Simple Mode..." />}>
          <SimpleApp />
        </React.Suspense>
      )

    case 'diagnostic':
      return (
        <React.Suspense fallback={<LoadingSpinner message="Loading Diagnostic Mode..." />}>
          <DiagnosticApp />
        </React.Suspense>
      )

    case 'gradual':
      return (
        <React.Suspense fallback={<LoadingSpinner message="Loading Gradual Mode..." />}>
          <GradualApp />
        </React.Suspense>
      )

    case 'debug':
      return (
        <React.Suspense fallback={<LoadingSpinner message="Loading Debugger..." />}>
          <DebuggerApp />
        </React.Suspense>
      )

    default:
      // Default: try to load the main app, with fallback
      return (
        <React.Suspense fallback={<LoadingSpinner message="Loading DataSense AI..." />}>
          <ErrorBoundary>
            <MainApp />
          </ErrorBoundary>
        </React.Suspense>
      )
  }
}

// Error boundary to catch any rendering errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Main App Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">App Crashed</h1>
            <p className="text-gray-600 mb-4">The main application encountered an error.</p>
            <div className="bg-red-100 p-4 rounded mb-4 text-left">
              <pre className="text-sm text-red-600 overflow-auto">
                {this.state.error?.message}
              </pre>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => window.location.href = window.location.origin + '?mode=debug'}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700"
              >
                Open Debugger
              </button>
              <button
                onClick={() => window.location.href = window.location.origin + '?mode=simple'}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Switch to Simple Mode
              </button>
              <button
                onClick={() => window.location.href = window.location.origin + '?mode=gradual'}
                className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
              >
                Try Gradual Loading
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default AppRouter
