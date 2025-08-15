import { useState, useEffect } from 'react'
import { BarChart3, LineChart, PieChart, ScatterChart as ScatterIcon, Download, Wand2, Settings, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Switch } from '@/components/ui/switch.jsx'
import { Slider } from '@/components/ui/slider.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { LoadingSpinner, ChartSkeleton } from '@/components/ui/alerts.jsx'
import { useToast } from '@/hooks/useToast.js'
import { BarChart, LineChart as RechartsLineChart, PieChart as RechartsPieChart, ScatterChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Bar, Line, Pie, Cell, Scatter, ResponsiveContainer } from 'recharts'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']

const CHART_TYPES = [
  { id: 'bar', name: 'Bar Chart', icon: BarChart3, description: 'Compare categories' },
  { id: 'line', name: 'Line Chart', icon: LineChart, description: 'Show trends over time' },
  { id: 'pie', name: 'Pie Chart', icon: PieChart, description: 'Show proportions' },
  { id: 'scatter', name: 'Scatter Plot', icon: ScatterIcon, description: 'Show correlations' }
]

export function ChartBuilder({ data = [], columns = [] }) {
  const { success: showSuccess, error: showError } = useToast()
  const [selectedChartType, setSelectedChartType] = useState('auto')
  const [chartConfig, setChartConfig] = useState(null)
  const [chartData, setChartData] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Chart customization options
  const [customOptions, setCustomOptions] = useState({
    title: 'Custom Chart',
    width: 800,
    height: 400,
    theme: 'default',
    animation: true,
    showLegend: true,
    showGrid: true
  })

  const [selectedColumns, setSelectedColumns] = useState({
    x: '',
    y: '',
    category: '',
    size: ''
  })

  useEffect(() => {
    if (data.length > 0 && columns.length > 0) {
      // Auto-select reasonable defaults
      const numericCols = getNumericColumns()
      const categoricalCols = getCategoricalColumns()
      
      setSelectedColumns({
        x: categoricalCols[0] || columns[0] || '',
        y: numericCols[0] || '',
        category: categoricalCols[1] || '',
        size: numericCols[1] || ''
      })
    }
  }, [data, columns])

  const getNumericColumns = () => {
    if (!data.length) return []
    const sample = data[0]
    return columns.filter(col => {
      const value = sample[col]
      return !isNaN(value) && !isNaN(parseFloat(value))
    })
  }

  const getCategoricalColumns = () => {
    if (!data.length) return []
    const sample = data[0]
    return columns.filter(col => {
      const value = sample[col]
      return isNaN(value) || isNaN(parseFloat(value))
    })
  }

  const generateChart = async () => {
    if (!data.length) {
      setError('No data available for chart generation')
      showError('No data available for chart generation')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const requestData = {
        dataset: data,
        chart_type: selectedChartType,
        columns: Object.values(selectedColumns).filter(Boolean),
        options: customOptions
      }

      const response = await fetch('/api/v1/features/chart-builder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(requestData)
      })

      const result = await response.json()

      if (result.success) {
        setChartConfig(result.chart_configs)
        setChartData(result.chart_data)
        setRecommendations(result.recommendations)
        
        // Update custom options with generated config
        setCustomOptions(prev => ({
          ...prev,
          title: result.chart_configs.title || prev.title
        }))
        
        showSuccess('Chart generated successfully!')
      } else {
        throw new Error(result.error || 'Chart generation failed')
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to generate chart. Please try again.'
      setError(errorMessage)
      showError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const renderChart = () => {
    if (!chartData || !chartConfig) return null

    const chartProps = {
      width: customOptions.width,
      height: customOptions.height,
      data: chartData.data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    }

    switch (chartConfig.type) {
      case 'bar':
      case 'column':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke={customOptions.showGrid ? '#e0e0e0' : 'transparent'} />
              <XAxis dataKey="x" />
              <YAxis />
              <Tooltip />
              {customOptions.showLegend && <Legend />}
              <Bar dataKey="y" fill={COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsLineChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke={customOptions.showGrid ? '#e0e0e0' : 'transparent'} />
              <XAxis dataKey="x" />
              <YAxis />
              <Tooltip />
              {customOptions.showLegend && <Legend />}
              <Line 
                type={chartConfig.smooth ? 'monotone' : 'linear'} 
                dataKey="y" 
                stroke={COLORS[0]} 
                strokeWidth={2}
                dot={chartConfig.markers}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        )

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsPieChart>
              <Pie
                data={chartData.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ label, value, percent }) => `${label}: ${(percent * 100).toFixed(1)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                nameKey="label"
              >
                {chartData.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              {customOptions.showLegend && <Legend />}
            </RechartsPieChart>
          </ResponsiveContainer>
        )

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke={customOptions.showGrid ? '#e0e0e0' : 'transparent'} />
              <XAxis dataKey="x" name={chartConfig.x_axis} />
              <YAxis dataKey="y" name={chartConfig.y_axis} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              {customOptions.showLegend && <Legend />}
              <Scatter name="Data Points" data={chartData.data} fill={COLORS[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        )

      default:
        return <div className="text-center text-gray-500">Unsupported chart type</div>
    }
  }

  const exportChart = (format) => {
    // In a real implementation, this would generate and download the chart
    // For now, we'll just show a placeholder
    alert(`Exporting chart as ${format}... (Feature coming soon!)`)
  }

  const applyRecommendation = (recommendation) => {
    setSelectedChartType(recommendation.type)
    if (recommendation.suggested_columns) {
      setSelectedColumns(prev => ({
        ...prev,
        x: recommendation.suggested_columns[0] || prev.x,
        y: recommendation.suggested_columns[1] || prev.y
      }))
    }
    
    // Auto-generate chart with recommendation
    setTimeout(() => generateChart(), 100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Interactive Chart Builder</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Create beautiful, interactive charts from your data with AI-powered recommendations
        </p>
      </div>

      {/* Chart Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wand2 className="h-5 w-5 mr-2" />
            Chart Type Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <Button
              variant={selectedChartType === 'auto' ? 'default' : 'outline'}
              onClick={() => setSelectedChartType('auto')}
              className="h-20 flex flex-col items-center justify-center"
            >
              <Wand2 className="h-6 w-6 mb-1" />
              <span className="text-xs">Auto Select</span>
            </Button>
            {CHART_TYPES.map((type) => (
              <Button
                key={type.id}
                variant={selectedChartType === type.id ? 'default' : 'outline'}
                onClick={() => setSelectedChartType(type.id)}
                className="h-20 flex flex-col items-center justify-center"
              >
                <type.icon className="h-6 w-6 mb-1" />
                <span className="text-xs">{type.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Data Mapping</CardTitle>
            <CardDescription>Select which columns to use for your chart</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="x-axis">X-Axis</Label>
              <Select value={selectedColumns.x} onValueChange={(value) => setSelectedColumns(prev => ({ ...prev, x: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select X-axis column" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="y-axis">Y-Axis</Label>
              <Select value={selectedColumns.y} onValueChange={(value) => setSelectedColumns(prev => ({ ...prev, y: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Y-axis column" />
                </SelectTrigger>
                <SelectContent>
                  {getNumericColumns().map((col) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedChartType === 'scatter' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="category">Color By (Optional)</Label>
                  <Select value={selectedColumns.category} onValueChange={(value) => setSelectedColumns(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {getCategoricalColumns().map((col) => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Size By (Optional)</Label>
                  <Select value={selectedColumns.size} onValueChange={(value) => setSelectedColumns(prev => ({ ...prev, size: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {getNumericColumns().map((col) => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Customization Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Customization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Chart Title</Label>
              <Input
                id="title"
                value={customOptions.title}
                onChange={(e) => setCustomOptions(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter chart title"
              />
            </div>

            <div className="space-y-2">
              <Label>Chart Size</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Width: {customOptions.width}px</Label>
                  <Slider
                    value={[customOptions.width]}
                    onValueChange={([value]) => setCustomOptions(prev => ({ ...prev, width: value }))}
                    max={1200}
                    min={400}
                    step={50}
                  />
                </div>
                <div>
                  <Label className="text-xs">Height: {customOptions.height}px</Label>
                  <Slider
                    value={[customOptions.height]}
                    onValueChange={([value]) => setCustomOptions(prev => ({ ...prev, height: value }))}
                    max={800}
                    min={300}
                    step={50}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="animation">Enable Animation</Label>
                <Switch
                  id="animation"
                  checked={customOptions.animation}
                  onCheckedChange={(checked) => setCustomOptions(prev => ({ ...prev, animation: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="legend">Show Legend</Label>
                <Switch
                  id="legend"
                  checked={customOptions.showLegend}
                  onCheckedChange={(checked) => setCustomOptions(prev => ({ ...prev, showLegend: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="grid">Show Grid</Label>
                <Switch
                  id="grid"
                  checked={customOptions.showGrid}
                  onCheckedChange={(checked) => setCustomOptions(prev => ({ ...prev, showGrid: checked }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wand2 className="h-5 w-5 mr-2" />
              AI Recommendations
            </CardTitle>
            <CardDescription>
              Smart suggestions based on your data characteristics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{rec.type}</Badge>
                      <Badge variant="outline">{rec.confidence}% confidence</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => applyRecommendation(rec)}
                    className="ml-4"
                  >
                    Apply
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button 
          onClick={generateChart} 
          disabled={isLoading || !selectedColumns.x || !selectedColumns.y}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          {isLoading ? (
            <>
              <LoadingSpinner variant="ai" size="sm" className="mr-2" />
              Generating Chart...
            </>
          ) : (
            <>
              <Eye className="h-5 w-5 mr-2" />
              Generate Chart
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

      {/* Chart Display */}
      {isLoading && (
        <Card>
          <CardHeader>
            <CardTitle>Generating Your Chart...</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartSkeleton />
          </CardContent>
        </Card>
      )}
      
      {chartData && chartConfig && !isLoading && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{customOptions.title}</CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => exportChart('png')}>
                  <Download className="h-4 w-4 mr-1" />
                  PNG
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportChart('pdf')}>
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportChart('svg')}>
                  <Download className="h-4 w-4 mr-1" />
                  SVG
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              {renderChart()}
            </div>
            
            {/* Chart Metadata */}
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Chart Type:</span>
                  <div className="text-gray-600">{chartConfig.type}</div>
                </div>
                <div>
                  <span className="font-semibold">Data Points:</span>
                  <div className="text-gray-600">{chartData.metadata.total_points}</div>
                </div>
                <div>
                  <span className="font-semibold">X-Axis:</span>
                  <div className="text-gray-600">{selectedColumns.x}</div>
                </div>
                <div>
                  <span className="font-semibold">Y-Axis:</span>
                  <div className="text-gray-600">{selectedColumns.y}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
