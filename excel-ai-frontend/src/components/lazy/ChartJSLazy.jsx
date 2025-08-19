import React, { Suspense, lazy } from 'react'

// Lazy load Chart.js components
const Chart = lazy(() => import('chart.js/auto').then(module => ({ default: module.Chart })))

// Loading fallback for Chart.js components
const ChartJSLoadingFallback = () => (
  <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
      <p className="text-sm text-gray-600">Loading Chart.js...</p>
    </div>
  </div>
)

// Error fallback for Chart.js components
const ChartJSErrorFallback = ({ error, retry }) => (
  <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg border-2 border-dashed border-red-300">
    <div className="text-center">
      <div className="text-red-500 mb-2">
        <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.694-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <p className="text-sm text-red-600 mb-2">Failed to load Chart.js</p>
      {retry && (
        <button 
          onClick={retry}
          className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
        >
          Retry
        </button>
      )}
    </div>
  </div>
)

// Error boundary for Chart.js components
class ChartJSErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ChartJSErrorFallback 
          error={this.state.error} 
          retry={() => this.setState({ hasError: false, error: null })}
        />
      )
    }

    return this.props.children
  }
}

// Wrapper component for lazy loaded Chart.js
const LazyChartJSWrapper = ({ children, fallback = <ChartJSLoadingFallback /> }) => {
  return (
    <ChartJSErrorBoundary>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ChartJSErrorBoundary>
  )
}

// Lazy Chart.js component that can be used as a drop-in replacement
const LazyChart = lazy(() => 
  import('chart.js/auto').then(ChartModule => {
    const Chart = ChartModule.Chart
    
    // Return a React component that uses Chart.js
    return {
      default: React.forwardRef(({ config, ...props }, ref) => {
        const canvasRef = React.useRef(null)
        const chartRef = React.useRef(null)
        
        React.useImperativeHandle(ref, () => ({
          getChart: () => chartRef.current,
          update: (...args) => chartRef.current?.update(...args),
          destroy: () => {
            if (chartRef.current) {
              chartRef.current.destroy()
              chartRef.current = null
            }
          }
        }))
        
        React.useEffect(() => {
          if (canvasRef.current && config) {
            // Destroy existing chart if it exists
            if (chartRef.current) {
              chartRef.current.destroy()
            }
            
            // Create new chart
            chartRef.current = new Chart(canvasRef.current, config)
          }
          
          return () => {
            if (chartRef.current) {
              chartRef.current.destroy()
              chartRef.current = null
            }
          }
        }, [config])
        
        return <canvas ref={canvasRef} {...props} />
      })
    }
  })
)

export {
  LazyChartJSWrapper,
  LazyChart,
  Chart,
  ChartJSLoadingFallback,
  ChartJSErrorFallback
}

export default {
  Wrapper: LazyChartJSWrapper,
  Chart: LazyChart,
  LoadingFallback: ChartJSLoadingFallback,
  ErrorFallback: ChartJSErrorFallback
}
