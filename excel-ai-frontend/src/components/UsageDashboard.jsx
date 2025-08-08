import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { BarChart3, Clock, Zap, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import apiService from '@/services/api.js'

export const UsageDashboard = ({ user }) => {
  const [metrics, setMetrics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState(30)

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
