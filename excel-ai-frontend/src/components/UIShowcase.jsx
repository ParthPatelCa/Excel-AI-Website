import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { LoadingSpinner, Toast, SkeletonLoader, TableSkeleton, ChartSkeleton } from '@/components/ui/alerts.jsx'
import { useToast } from '@/hooks/useToast.js'

export function UIShowcase() {
  const [showSpinner, setShowSpinner] = useState(false)
  const [showTableSkeleton, setShowTableSkeleton] = useState(false)
  const [showChartSkeleton, setShowChartSkeleton] = useState(false)
  const { showSuccess, showError, showWarning, showInfo } = useToast()

  const simulateLoading = (type, duration = 3000) => {
    if (type === 'spinner') setShowSpinner(true)
    if (type === 'table') setShowTableSkeleton(true)
    if (type === 'chart') setShowChartSkeleton(true)
    
    setTimeout(() => {
      if (type === 'spinner') setShowSpinner(false)
      if (type === 'table') setShowTableSkeleton(false)
      if (type === 'chart') setShowChartSkeleton(false)
    }, duration)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">UI Components Showcase</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Testing our enhanced loading states, toast notifications, and skeleton loaders
        </p>
      </div>

      {/* Loading Spinners */}
      <Card>
        <CardHeader>
          <CardTitle>Loading Spinners</CardTitle>
          <CardDescription>Different variants for various use cases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <LoadingSpinner variant="default" size="md" className="mx-auto mb-2" />
              <p className="text-sm">Default</p>
            </div>
            <div className="text-center">
              <LoadingSpinner variant="ai" size="md" className="mx-auto mb-2" />
              <p className="text-sm">AI Processing</p>
            </div>
            <div className="text-center">
              <LoadingSpinner variant="processing" size="md" className="mx-auto mb-2" />
              <p className="text-sm">Data Processing</p>
            </div>
            <div className="text-center">
              <LoadingSpinner variant="analysis" size="md" className="mx-auto mb-2" />
              <p className="text-sm">Analysis</p>
            </div>
          </div>
          
          <div className="mt-6">
            <Button 
              onClick={() => simulateLoading('spinner')}
              disabled={showSpinner}
            >
              {showSpinner ? (
                <>
                  <LoadingSpinner variant="ai" size="sm" className="mr-2" />
                  Processing...
                </>
              ) : (
                'Test Loading Button'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Toast Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Toast Notifications</CardTitle>
          <CardDescription>User feedback system with different severity levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="default"
              onClick={() => showSuccess('Operation completed successfully!')}
            >
              Success Toast
            </Button>
            <Button 
              variant="destructive"
              onClick={() => showError('Something went wrong. Please try again.')}
            >
              Error Toast
            </Button>
            <Button 
              variant="secondary"
              onClick={() => showWarning('This action cannot be undone.')}
            >
              Warning Toast
            </Button>
            <Button 
              variant="outline"
              onClick={() => showInfo('New features are now available!')}
            >
              Info Toast
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Skeleton Loaders */}
      <Card>
        <CardHeader>
          <CardTitle>Skeleton Loaders</CardTitle>
          <CardDescription>Placeholder loading states for better UX</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Skeleton */}
          <div>
            <h4 className="font-semibold mb-3">Basic Skeleton Loader</h4>
            <SkeletonLoader />
          </div>

          {/* Table Skeleton */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Table Skeleton</h4>
              <Button 
                size="sm"
                onClick={() => simulateLoading('table')}
                disabled={showTableSkeleton}
              >
                {showTableSkeleton ? 'Loading...' : 'Test Table Loading'}
              </Button>
            </div>
            {showTableSkeleton ? (
              <TableSkeleton />
            ) : (
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-gray-600 text-center">Click button to see table skeleton</p>
              </div>
            )}
          </div>

          {/* Chart Skeleton */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Chart Skeleton</h4>
              <Button 
                size="sm"
                onClick={() => simulateLoading('chart')}
                disabled={showChartSkeleton}
              >
                {showChartSkeleton ? 'Loading...' : 'Test Chart Loading'}
              </Button>
            </div>
            {showChartSkeleton ? (
              <ChartSkeleton />
            ) : (
              <div className="border rounded-lg p-4 bg-gray-50 h-64 flex items-center justify-center">
                <p className="text-gray-600">Click button to see chart skeleton</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Size Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Size Variants</CardTitle>
          <CardDescription>Different sizes for various contexts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-8">
            <div className="text-center">
              <LoadingSpinner variant="ai" size="sm" className="mx-auto mb-2" />
              <p className="text-sm">Small</p>
            </div>
            <div className="text-center">
              <LoadingSpinner variant="ai" size="md" className="mx-auto mb-2" />
              <p className="text-sm">Medium</p>
            </div>
            <div className="text-center">
              <LoadingSpinner variant="ai" size="lg" className="mx-auto mb-2" />
              <p className="text-sm">Large</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Real-world Integration Examples</CardTitle>
          <CardDescription>How these components work in actual features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h5 className="font-medium mb-2">Data Processing Workflow</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <LoadingSpinner variant="analysis" size="sm" className="mx-auto mb-2" />
                <p className="text-sm font-medium">Analyzing Data</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <LoadingSpinner variant="processing" size="sm" className="mx-auto mb-2" />
                <p className="text-sm font-medium">Processing Results</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <LoadingSpinner variant="ai" size="sm" className="mx-auto mb-2" />
                <p className="text-sm font-medium">AI Enhancement</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default UIShowcase
