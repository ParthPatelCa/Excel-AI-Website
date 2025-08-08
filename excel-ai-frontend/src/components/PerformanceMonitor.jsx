import { useState, useEffect } from 'react'
import { Activity, Wifi, WifiOff, Smartphone, Download, Upload } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Button } from '@/components/ui/button.jsx'
import { usePWA } from '@/services/pwaService.js'
import { useTheme } from '@/contexts/ThemeContext.jsx'

export function PerformanceMonitor() {
  const [performanceMetrics, setPerformanceMetrics] = useState(null)
  const [bundleSize, setBundleSize] = useState(null)
  const { isOnline, networkStatus, clearCache } = usePWA()
  const { theme } = useTheme()

  useEffect(() => {
    measurePerformance()
    
    // Update metrics every 5 seconds
    const interval = setInterval(measurePerformance, 5000)
    return () => clearInterval(interval)
  }, [])

  const measurePerformance = () => {
    // Web Vitals and performance metrics
    const navigation = performance.getEntriesByType('navigation')[0]
    const paint = performance.getEntriesByType('paint')
    
    const metrics = {
      // Core Web Vitals
      loadTime: navigation?.loadEventEnd - navigation?.loadEventStart || 0,
      domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart || 0,
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      
      // Memory usage (if available)
      memoryUsed: performance.memory?.usedJSHeapSize || 0,
      memoryTotal: performance.memory?.totalJSHeapSize || 0,
      memoryLimit: performance.memory?.jsHeapSizeLimit || 0,
      
      // Connection info
      connectionType: navigator.connection?.effectiveType || 'unknown',
      downlink: navigator.connection?.downlink || 0,
      rtt: navigator.connection?.rtt || 0,
      
      // Battery (if available)
      batteryLevel: navigator.getBattery ? 'Loading...' : 'Not available',
      
      // Current timestamp
      timestamp: Date.now()
    }

    setPerformanceMetrics(metrics)

    // Get battery info if available
    if (navigator.getBattery) {
      navigator.getBattery().then(battery => {
        setPerformanceMetrics(prev => ({
          ...prev,
          batteryLevel: Math.round(battery.level * 100) + '%',
          charging: battery.charging
        }))
      })
    }
  }

  const estimateBundleSize = async () => {
    try {
      // Estimate bundle size from network requests
      const resources = performance.getEntriesByType('resource')
      const jsResources = resources.filter(r => r.name.includes('.js'))
      const cssResources = resources.filter(r => r.name.includes('.css'))
      
      const totalJS = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0)
      const totalCSS = cssResources.reduce((sum, r) => sum + (r.transferSize || 0), 0)
      
      setBundleSize({
        javascript: totalJS,
        css: totalCSS,
        total: totalJS + totalCSS,
        resourceCount: resources.length
      })
    } catch (error) {
      console.error('Failed to estimate bundle size:', error)
    }
  }

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatTime = (ms) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const getPerformanceScore = () => {
    if (!performanceMetrics) return 0
    
    let score = 100
    
    // Deduct points for slow metrics
    if (performanceMetrics.loadTime > 3000) score -= 20
    if (performanceMetrics.firstContentfulPaint > 2500) score -= 15
    if (performanceMetrics.domContentLoaded > 2000) score -= 10
    
    return Math.max(0, score)
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (!performanceMetrics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-pulse mx-auto mb-2" />
            <p>Measuring performance...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Performance Monitor
              </CardTitle>
              <CardDescription>
                Real-time application performance metrics
              </CardDescription>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${getScoreColor(getPerformanceScore())}`}>
                {getPerformanceScore()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Score</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="font-semibold text-blue-600">
                {formatTime(performanceMetrics.loadTime)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Load Time</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="font-semibold text-green-600">
                {formatTime(performanceMetrics.firstContentfulPaint)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">First Paint</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="font-semibold text-purple-600">
                {formatTime(performanceMetrics.domContentLoaded)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">DOM Ready</div>
            </div>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="font-semibold text-orange-600">
                {formatBytes(performanceMetrics.memoryUsed)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Memory Used</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {isOnline ? (
              <Wifi className="h-5 w-5 mr-2 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 mr-2 text-red-600" />
            )}
            Network Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Badge variant={isOnline ? 'default' : 'destructive'}>
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>
            <div>
              <div className="font-semibold">{networkStatus.connectionType}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Connection</div>
            </div>
            <div>
              <div className="font-semibold flex items-center">
                <Download className="h-4 w-4 mr-1" />
                {networkStatus.downlink} Mbps
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Downlink</div>
            </div>
            <div>
              <div className="font-semibold">{performanceMetrics.rtt}ms</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">RTT</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bundle Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Bundle Analysis</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={estimateBundleSize}
            >
              Analyze
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {bundleSize ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="font-semibold">{formatBytes(bundleSize.javascript)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">JavaScript</div>
              </div>
              <div>
                <div className="font-semibold">{formatBytes(bundleSize.css)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">CSS</div>
              </div>
              <div>
                <div className="font-semibold">{formatBytes(bundleSize.total)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Size</div>
              </div>
              <div>
                <div className="font-semibold">{bundleSize.resourceCount}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Resources</div>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              Click "Analyze" to estimate bundle size
            </p>
          )}
        </CardContent>
      </Card>

      {/* Device Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Smartphone className="h-5 w-5 mr-2" />
            Device Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="font-semibold">{theme}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Theme</div>
            </div>
            <div>
              <div className="font-semibold">
                {window.innerWidth}x{window.innerHeight}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Viewport</div>
            </div>
            <div>
              <div className="font-semibold">
                {performanceMetrics.batteryLevel || 'Unknown'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Battery</div>
            </div>
            <div>
              <div className="font-semibold">
                {navigator.hardwareConcurrency || 'Unknown'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">CPU Cores</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={measurePerformance}>
              <Activity className="h-4 w-4 mr-2" />
              Refresh Metrics
            </Button>
            <Button variant="outline" onClick={clearCache}>
              Clear Cache
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              Hard Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PerformanceMonitor
