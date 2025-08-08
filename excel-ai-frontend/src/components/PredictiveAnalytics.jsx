import { useState } from 'react'
import { TrendingUp, Target, AlertTriangle, BarChart3, Activity, Brain, Download, Play } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Slider } from '@/components/ui/slider.jsx'
import { LoadingSpinner } from '@/components/ui/alerts.jsx'
import { LineChart, BarChart, ScatterChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, Bar, Scatter, ResponsiveContainer, Area, AreaChart } from 'recharts'

const ANALYSIS_TYPES = [
  {
    id: 'forecast',
    name: 'Time Series Forecast',
    description: 'Predict future values based on historical trends',
    icon: TrendingUp,
    color: 'blue'
  },
  {
    id: 'correlation',
    name: 'Correlation Analysis',
    description: 'Find relationships between variables',
    icon: Activity,
    color: 'green'
  },
  {
    id: 'trends',
    name: 'Trend Analysis',
    description: 'Analyze patterns and movements in data',
    icon: BarChart3,
    color: 'purple'
  },
  {
    id: 'anomaly',
    name: 'Anomaly Detection',
    description: 'Identify outliers and unusual patterns',
    icon: AlertTriangle,
    color: 'red'
  },
  {
    id: 'what_if',
    name: 'What-If Scenarios',
    description: 'Model different business scenarios',
    icon: Target,
    color: 'orange'
  }
]

export function PredictiveAnalytics({ data = [], columns = [] }) {
  const [selectedAnalysis, setSelectedAnalysis] = useState('forecast')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const [analysisConfig, setAnalysisConfig] = useState({
    target_column: '',
    time_column: '',
    horizon: 12,
    scenarios: {}
  })

  const getNumericColumns = () => {
    if (!data.length) return []
    const sample = data[0]
    return columns.filter(col => {
      const value = sample[col]
      return !isNaN(value) && !isNaN(parseFloat(value))
    })
  }

  const getDateColumns = () => {
    if (!data.length) return []
    const sample = data[0]
    return columns.filter(col => {
      const value = sample[col]
      return !isNaN(Date.parse(value)) || /\d{4}-\d{2}-\d{2}/.test(value) || /\d{1,2}\/\d{1,2}\/\d{4}/.test(value)
    })
  }

  const runAnalysis = async () => {
    if (!data.length) {
      setError('No data available for analysis')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const requestData = {
        dataset: data,
        type: selectedAnalysis,
        target_column: analysisConfig.target_column,
        time_column: analysisConfig.time_column,
        horizon: analysisConfig.horizon,
        scenarios: analysisConfig.scenarios
      }

      const response = await fetch('/api/v1/features/predictive-analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(requestData)
      })

      const result = await response.json()

      if (result.success) {
        setResults(result)
      } else {
        throw new Error(result.error || 'Analysis failed')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const addScenario = () => {
    const scenarioName = prompt('Enter scenario name:')
    if (scenarioName) {
      setAnalysisConfig(prev => ({
        ...prev,
        scenarios: {
          ...prev.scenarios,
          [scenarioName]: {}
        }
      }))
    }
  }

  const updateScenario = (scenarioName, variable, value) => {
    setAnalysisConfig(prev => ({
      ...prev,
      scenarios: {
        ...prev.scenarios,
        [scenarioName]: {
          ...prev.scenarios[scenarioName],
          [variable]: parseFloat(value) || 0
        }
      }
    }))
  }

  const removeScenario = (scenarioName) => {
    setAnalysisConfig(prev => {
      const newScenarios = { ...prev.scenarios }
      delete newScenarios[scenarioName]
      return { ...prev, scenarios: newScenarios }
    })
  }

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const renderForecastChart = () => {
    if (!results?.results?.forecast) return null

    const forecastData = results.results.forecast.map((item, index) => ({
      period: `Period ${item.period}`,
      predicted: item.predicted_value,
      lower: item.lower_bound,
      upper: item.upper_bound
    }))

    return (
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={forecastData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area
            type="monotone"
            dataKey="upper"
            stackId="1"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.2}
            name="Upper Bound"
          />
          <Area
            type="monotone"
            dataKey="lower"
            stackId="1"
            stroke="#3B82F6"
            fill="#ffffff"
            name="Lower Bound"
          />
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="#1D4ED8"
            strokeWidth={3}
            name="Forecast"
          />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  const renderCorrelationChart = () => {
    if (!results?.results?.strong_correlations) return null

    const correlationData = results.results.strong_correlations.map(corr => ({
      name: `${corr.variable1} vs ${corr.variable2}`,
      correlation: Math.abs(corr.correlation),
      direction: corr.direction
    }))

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={correlationData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
          <YAxis domain={[0, 1]} />
          <Tooltip />
          <Bar dataKey="correlation" fill="#10B981" />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  const renderAnomaliesChart = () => {
    if (!results?.results?.anomaly_details) return null

    const anomalyData = results.results.anomaly_details.map(anomaly => ({
      index: anomaly.index,
      value: anomaly.value,
      severity: anomaly.severity
    }))

    return (
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart data={anomalyData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="index" name="Index" />
          <YAxis dataKey="value" name="Value" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter 
            name="Anomalies" 
            data={anomalyData} 
            fill="#EF4444"
          />
        </ScatterChart>
      </ResponsiveContainer>
    )
  }

  const renderWhatIfChart = () => {
    if (!results?.results || typeof results.results !== 'object') return null

    const scenarioData = Object.entries(results.results).map(([scenario, data]) => ({
      scenario: scenario.replace('_', ' '),
      value: data.value || 0,
      change: data.percent_change || 0
    }))

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={scenarioData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="scenario" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#F59E0B" />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  const exportResults = () => {
    if (!results) return

    const exportData = {
      analysis_type: selectedAnalysis,
      results: results.results,
      methodology: results.methodology,
      timestamp: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `predictive_analysis_${selectedAnalysis}_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Predictive Analytics</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Generate forecasts, detect patterns, and model scenarios using advanced statistical methods
        </p>
      </div>

      {/* Analysis Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            Choose Analysis Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ANALYSIS_TYPES.map((type) => (
              <div
                key={type.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedAnalysis === type.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedAnalysis(type.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-${type.color}-100`}>
                    <type.icon className={`h-5 w-5 text-${type.color}-600`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{type.name}</h3>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Configuration</CardTitle>
          <CardDescription>
            Configure the parameters for your {ANALYSIS_TYPES.find(t => t.id === selectedAnalysis)?.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Target Column */}
          <div className="space-y-2">
            <Label htmlFor="target">Target Column</Label>
            <Select 
              value={analysisConfig.target_column} 
              onValueChange={(value) => setAnalysisConfig(prev => ({ ...prev, target_column: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select the column to analyze" />
              </SelectTrigger>
              <SelectContent>
                {getNumericColumns().map((col) => (
                  <SelectItem key={col} value={col}>{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Column (for forecast and trends) */}
          {(selectedAnalysis === 'forecast' || selectedAnalysis === 'trends') && (
            <div className="space-y-2">
              <Label htmlFor="time">Time Column (Optional)</Label>
              <Select 
                value={analysisConfig.time_column} 
                onValueChange={(value) => setAnalysisConfig(prev => ({ ...prev, time_column: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time/date column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Auto-detect / Use index</SelectItem>
                  {getDateColumns().map((col) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Forecast Horizon */}
          {selectedAnalysis === 'forecast' && (
            <div className="space-y-2">
              <Label>Forecast Horizon: {analysisConfig.horizon} periods</Label>
              <Slider
                value={[analysisConfig.horizon]}
                onValueChange={([value]) => setAnalysisConfig(prev => ({ ...prev, horizon: value }))}
                max={50}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
          )}

          {/* What-If Scenarios */}
          {selectedAnalysis === 'what_if' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Scenarios</Label>
                <Button size="sm" onClick={addScenario}>Add Scenario</Button>
              </div>
              
              {Object.keys(analysisConfig.scenarios).length === 0 ? (
                <p className="text-gray-500 text-sm">No scenarios defined. Click "Add Scenario" to create one.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(analysisConfig.scenarios).map(([scenarioName, scenario]) => (
                    <div key={scenarioName} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{scenarioName}</h4>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => removeScenario(scenarioName)}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {getNumericColumns().slice(0, 4).map((col) => (
                          <div key={col} className="space-y-1">
                            <Label className="text-xs">{col} % change</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={scenario[col] || ''}
                              onChange={(e) => updateScenario(scenarioName, col, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Run Analysis Button */}
      <div className="flex justify-center">
        <Button 
          onClick={runAnalysis} 
          disabled={isLoading || !analysisConfig.target_column}
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Play className="h-5 w-5 mr-2" />
              Run {ANALYSIS_TYPES.find(t => t.id === selectedAnalysis)?.name}
            </>
          )}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Results Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Analysis Results</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge className={getConfidenceColor(results.confidence_level)}>
                    {results.confidence_level} confidence
                  </Badge>
                  <Button variant="outline" size="sm" onClick={exportResults}>
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
              <CardDescription>{results.methodology}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="visualization" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="visualization">Visualization</TabsTrigger>
                  <TabsTrigger value="insights">Key Insights</TabsTrigger>
                  <TabsTrigger value="details">Detailed Results</TabsTrigger>
                </TabsList>

                <TabsContent value="visualization" className="space-y-4">
                  <div className="w-full">
                    {selectedAnalysis === 'forecast' && renderForecastChart()}
                    {selectedAnalysis === 'correlation' && renderCorrelationChart()}
                    {selectedAnalysis === 'anomaly' && renderAnomaliesChart()}
                    {selectedAnalysis === 'what_if' && renderWhatIfChart()}
                    {selectedAnalysis === 'trends' && (
                      <div className="text-center py-8 text-gray-500">
                        <TrendingUp className="h-12 w-12 mx-auto mb-3" />
                        <p>Trend visualization coming soon!</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="insights" className="space-y-4">
                  <div className="space-y-3">
                    {/* Forecast Insights */}
                    {selectedAnalysis === 'forecast' && results.results.forecast && (
                      <>
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-semibold text-blue-800 mb-2">Forecast Summary</h4>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Forecasting {results.results.forecast.length} periods ahead</li>
                            <li>• Historical trend: {results.results.historical_trend > 0 ? 'Increasing' : results.results.historical_trend < 0 ? 'Decreasing' : 'Stable'}</li>
                            <li>• Seasonality: {results.results.seasonal_pattern?.seasonal ? 'Detected' : 'Not detected'}</li>
                            <li>• Model accuracy: {results.results.accuracy_metrics?.mape?.toFixed(1)}% MAPE</li>
                          </ul>
                        </div>
                      </>
                    )}

                    {/* Correlation Insights */}
                    {selectedAnalysis === 'correlation' && results.results.insights && (
                      <div className="space-y-2">
                        {results.results.insights.map((insight, index) => (
                          <div key={index} className="p-3 bg-green-50 rounded-lg">
                            <p className="text-sm text-green-700">{insight}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Anomaly Insights */}
                    {selectedAnalysis === 'anomaly' && results.results && (
                      <div className="p-4 bg-red-50 rounded-lg">
                        <h4 className="font-semibold text-red-800 mb-2">Anomaly Detection Summary</h4>
                        <ul className="text-sm text-red-700 space-y-1">
                          <li>• {results.results.anomalies_detected} anomalies detected</li>
                          <li>• Anomaly rate: {results.results.anomaly_rate}%</li>
                          <li>• Detection method: Z-score and IQR analysis</li>
                        </ul>
                      </div>
                    )}

                    {/* What-If Insights */}
                    {selectedAnalysis === 'what_if' && results.results && (
                      <div className="space-y-2">
                        {Object.entries(results.results).map(([scenario, data]) => (
                          <div key={scenario} className="p-3 bg-orange-50 rounded-lg">
                            <h4 className="font-semibold text-orange-800">{scenario.replace('_', ' ')}</h4>
                            <p className="text-sm text-orange-700">
                              Value: {data.value?.toFixed(2)} ({data.percent_change > 0 ? '+' : ''}{data.percent_change?.toFixed(1)}% change)
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Raw Results</h4>
                    <pre className="text-xs overflow-auto max-h-96 bg-white p-3 rounded border">
                      {JSON.stringify(results.results, null, 2)}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
