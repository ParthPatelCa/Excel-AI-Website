import { lazy } from 'react'

// Lazy load heavy components to improve initial load time
export const LazyDataVisualization = lazy(() => import('@/components/DataVisualization.jsx'))
export const LazyChartBuilder = lazy(() => import('@/components/ChartBuilder.jsx'))
export const LazyPredictiveAnalytics = lazy(() => import('@/components/PredictiveAnalytics.jsx'))
export const LazyDataCleaning = lazy(() => import('@/components/DataCleaning.jsx'))
export const LazyTemplateLibrary = lazy(() => import('@/components/TemplateLibrary.jsx'))
export const LazyMacroGenerator = lazy(() => import('@/components/MacroGenerator.jsx'))
export const LazyUIShowcase = lazy(() => import('@/components/UIShowcase.jsx'))

// Preload critical components during idle time
export const preloadComponents = () => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      import('@/components/DataVisualization.jsx')
      import('@/components/ChartBuilder.jsx')
    })
  }
}

// Component loading fallback
export const ComponentLoader = ({ message = "Loading component..." }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
)
