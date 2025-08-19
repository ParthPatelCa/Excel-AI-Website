import React, { Suspense, lazy } from 'react'

// Lazy load all Recharts components
const BarChart = lazy(() => import('recharts').then(module => ({ default: module.BarChart })))
const LineChart = lazy(() => import('recharts').then(module => ({ default: module.LineChart })))
const PieChart = lazy(() => import('recharts').then(module => ({ default: module.PieChart })))
const ScatterChart = lazy(() => import('recharts').then(module => ({ default: module.ScatterChart })))
const AreaChart = lazy(() => import('recharts').then(module => ({ default: module.AreaChart })))
const XAxis = lazy(() => import('recharts').then(module => ({ default: module.XAxis })))
const YAxis = lazy(() => import('recharts').then(module => ({ default: module.YAxis })))
const CartesianGrid = lazy(() => import('recharts').then(module => ({ default: module.CartesianGrid })))
const Tooltip = lazy(() => import('recharts').then(module => ({ default: module.Tooltip })))
const Legend = lazy(() => import('recharts').then(module => ({ default: module.Legend })))
const Bar = lazy(() => import('recharts').then(module => ({ default: module.Bar })))
const Line = lazy(() => import('recharts').then(module => ({ default: module.Line })))
const Pie = lazy(() => import('recharts').then(module => ({ default: module.Pie })))
const Cell = lazy(() => import('recharts').then(module => ({ default: module.Cell })))
const Scatter = lazy(() => import('recharts').then(module => ({ default: module.Scatter })))
const Area = lazy(() => import('recharts').then(module => ({ default: module.Area })))
const ResponsiveContainer = lazy(() => import('recharts').then(module => ({ default: module.ResponsiveContainer })))

// Loading fallback for charts
const ChartLoadingFallback = () => (
  <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
      <p className="text-sm text-gray-600">Loading chart...</p>
    </div>
  </div>
)

// Error fallback for charts
const ChartErrorFallback = ({ error, retry }) => (
  <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg border-2 border-dashed border-red-300">
    <div className="text-center">
      <div className="text-red-500 mb-2">
        <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.694-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <p className="text-sm text-red-600 mb-2">Failed to load chart</p>
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

// Error boundary for chart components
class ChartErrorBoundary extends React.Component {
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
        <ChartErrorFallback 
          error={this.state.error} 
          retry={() => this.setState({ hasError: false, error: null })}
        />
      )
    }

    return this.props.children
  }
}

// Wrapper component for lazy loaded Recharts
const LazyRechartsWrapper = ({ children, fallback = <ChartLoadingFallback /> }) => {
  return (
    <ChartErrorBoundary>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ChartErrorBoundary>
  )
}

// Export all components with lazy loading wrapper
export {
  LazyRechartsWrapper,
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Bar,
  Line,
  Pie,
  Cell,
  Scatter,
  Area,
  ResponsiveContainer,
  ChartLoadingFallback,
  ChartErrorFallback
}

// Default export with all components
export default {
  Wrapper: LazyRechartsWrapper,
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Bar,
  Line,
  Pie,
  Cell,
  Scatter,
  Area,
  ResponsiveContainer
}
