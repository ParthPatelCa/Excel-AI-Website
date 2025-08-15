import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { BarChart3, Clock, Zap, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Area,
  ComposedChart,
  Bar
} from 'recharts'
import apiService from '@/services/api.js'

export const UsageDashboard = () => {
  const [metrics, setMetrics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState(30)
  const [showForecast, setShowForecast] = useState(true)

  useEffect(() => {
    loadMetrics()
  }, [selectedPeriod])

  const loadMetrics = async () => {
    try {
      setIsLoading(true)
      const result = await apiService.getTelemetryMetrics(selectedPeriod)
      if (result.success) {
        setMetrics(result.data)
      }
    } catch (error) {
      console.error('Failed to load metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatLatency = (ms) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const getSuccessRateColor = (rate) => {
    if (rate >= 95) return 'text-green-600'
    if (rate >= 90) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getFallbackRateColor = (rate) => {
    if (rate <= 10) return 'text-green-600'
    if (rate <= 25) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Build time-series dataset with derived metrics and forecast
  const buildChartData = () => {
    if (!metrics?.timeseries) return []
    const ts = metrics.timeseries.map(d => ({
      date: d.date,
      total_calls: d.total_calls,
      success_calls: d.success_calls,
      fallback_calls: d.fallback_calls,
      avg_latency_ms: d.avg_latency_ms,
      success_rate: d.total_calls > 0 ? Math.round((d.success_calls / d.total_calls) * 100) : 0,
      fallback_rate: d.total_calls > 0 ? Math.round((d.fallback_calls / d.total_calls) * 100) : 0,
    }))

    // Moving average for smoothing (7-day)
    const windowSize = 7
    const ma = (arr, w) => arr.map((_, i) => {
      const start = Math.max(0, i - w + 1)
      const slice = arr.slice(start, i + 1)
      const sum = slice.reduce((s, v) => s + v, 0)
      return Math.round(sum / slice.length)
    })
    const maCalls = ma(ts.map(d => d.total_calls), Math.min(windowSize, ts.length))
    ts.forEach((d, i) => { d.ma_total_calls = maCalls[i] })

    if (!showForecast || ts.length < 3) {
      return ts
    }

    // Linear regression forecast for next 7 days on total_calls
    const n = ts.length
    const x = Array.from({ length: n }, (_, i) => i)
    const y = ts.map(d => d.total_calls)
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((a, xi, i) => a + xi * y[i], 0)
    const sumXX = x.reduce((a, xi) => a + xi * xi, 0)
    const denom = (n * sumXX - sumX * sumX) || 1
    const slope = (n * sumXY - sumX * sumY) / denom
    const intercept = (sumY - slope * sumX) / n
    const horizon = 7

    const lastDate = new Date(ts[ts.length - 1].date + 'T00:00:00Z')
    const forecast = []
    for (let i = 1; i <= horizon; i++) {
      const idx = n - 1 + i
      const value = Math.max(0, Math.round(intercept + slope * idx))
      const d = new Date(lastDate)
      d.setUTCDate(d.getUTCDate() + i)
      forecast.push({
        date: d.toISOString().slice(0, 10),
        total_calls: null,
        forecast_total_calls: value,
        avg_latency_ms: null,
        isForecast: true
      })
    }

    return [...ts, ...forecast]
  }

  const chartData = buildChartData()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-500">Unable to load usage metrics. Please try again later.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Usage Trends */}
      <Card>
        <CardHeader className="flex items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Usage Trends
          </CardTitle>
          <div className="flex items-center gap-3 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showForecast} onChange={(e) => setShowForecast(e.target.checked)} />
              Show 7d Forecast
            </label>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(d) => new Date(d + 'T00:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                <YAxis yAxisId="left" />
                <Tooltip />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="ma_total_calls" name="Calls (7d MA)" stroke="#60a5fa" fill="#93c5fd" fillOpacity={0.3} />
                <Bar yAxisId="left" dataKey="fallback_calls" name="Fallback Calls" barSize={12} fill="#f59e0b" />
                <Line yAxisId="left" type="monotone" dataKey="total_calls" name="Total Calls" stroke="#2563eb" strokeWidth={2} dot={false} />
                {showForecast && (
                  <Line yAxisId="left" type="monotone" dataKey="forecast_total_calls" name="Forecast (7d)" stroke="#7c3aed" strokeDasharray="5 5" dot={false} />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(d) => new Date(d + 'T00:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                <YAxis />
                <Tooltip formatter={(value) => typeof value === 'number' ? `${formatLatency(value)}` : value} />
                <Legend />
                <Line type="monotone" dataKey="avg_latency_ms" name="Avg Latency" stroke="#16a34a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Usage Analytics</h2>
        <div className="flex space-x-2">
          {[7, 30, 90].map(days => (
            <button
              key={days}
              onClick={() => setSelectedPeriod(days)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                selectedPeriod === days
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.overall.total_calls}</div>
            <p className="text-xs text-muted-foreground">
              Last {selectedPeriod} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getSuccessRateColor(metrics.overall.success_rate)}`}>
              {metrics.overall.success_rate}%
            </div>
            <p className="text-xs text-muted-foreground">
              API reliability
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatLatency(metrics.overall.avg_latency_ms)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average latency
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fallback Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getFallbackRateColor(metrics.overall.fallback_rate)}`}>
              {metrics.overall.fallback_rate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Model downgrades
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage">Usage Breakdown</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="models">AI Models</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* API Calls by Type */}
            <Card>
              <CardHeader>
                <CardTitle>API Calls by Type</CardTitle>
                <CardDescription>
                  Distribution of your API usage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(metrics.overall.calls_by_type).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="capitalize">{type}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Formula Interactions */}
            <Card>
              <CardHeader>
                <CardTitle>Formula Intelligence</CardTitle>
                <CardDescription>
                  Formula generation and analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(metrics.formula_interactions).map(([type, data]) => (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="capitalize">{type}</span>
                      <Badge>{data.count}</Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      Avg: {formatLatency(data.avg_latency_ms)} • Tokens: {data.total_tokens}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Usage Limits */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Usage Limits</CardTitle>
              <CardDescription>
                Your current plan usage and limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Queries</span>
                  <span className="text-sm text-gray-500">
                    {metrics.usage_limits.monthly_queries} / {
                      metrics.usage_limits.limits.queries === 'unlimited' ? '∞' : metrics.usage_limits.limits.queries
                    }
                  </span>
                </div>
                <Progress 
                  value={
                    metrics.usage_limits.limits.queries === 'unlimited' ? 0 :
                    (metrics.usage_limits.monthly_queries / metrics.usage_limits.limits.queries) * 100
                  } 
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">File Uploads</span>
                  <span className="text-sm text-gray-500">
                    {metrics.usage_limits.monthly_uploads} / {
                      metrics.usage_limits.limits.uploads === 'unlimited' ? '∞' : metrics.usage_limits.limits.uploads
                    }
                  </span>
                </div>
                <Progress 
                  value={
                    metrics.usage_limits.limits.uploads === 'unlimited' ? 0 :
                    (metrics.usage_limits.monthly_uploads / metrics.usage_limits.limits.uploads) * 100
                  } 
                  className="h-2"
                />
              </div>

              <div className="text-xs text-gray-500">
                Usage resets monthly • Last reset: {new Date(metrics.usage_limits.last_reset).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Total Tokens Used</span>
                  <Badge variant="outline">{metrics.overall.total_tokens}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Success Rate</span>
                  <Badge variant={metrics.overall.success_rate >= 95 ? 'default' : 'destructive'}>
                    {metrics.overall.success_rate}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Fallback Rate</span>
                  <Badge variant={metrics.overall.fallback_rate <= 10 ? 'default' : 'destructive'}>
                    {metrics.overall.fallback_rate}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Chat Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Total Messages</span>
                  <Badge variant="outline">{metrics.chat_stats.total_messages}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Avg Response Time</span>
                  <Badge variant="outline">{formatLatency(metrics.chat_stats.avg_latency_ms)}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tokens Used</span>
                  <Badge variant="outline">{metrics.chat_stats.total_tokens}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Model Usage</CardTitle>
              <CardDescription>
                Distribution of AI models used in your requests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(metrics.overall.models_used).map(([model, count]) => {
                const percentage = (count / metrics.overall.total_calls) * 100
                return (
                  <div key={model} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{model}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{count} calls</Badge>
                        <Badge>{percentage.toFixed(1)}%</Badge>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
