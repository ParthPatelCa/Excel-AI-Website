import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { BarChart3, LineChart, PieChart, ScatterChart, Activity, BarChart2, Box, Lightbulb, Download } from 'lucide-react'
import apiService from '@/services/api.js'

export function VisualizePage() {
  const [activeTab, setActiveTab] = useState('create')
  const [chartTypes, setChartTypes] = useState({})
  const [selectedChart, setSelectedChart] = useState('')
  const [chartData, setChartData] = useState([])
  const [chartConfig, setChartConfig] = useState({})
  const [generatedChart, setGeneratedChart] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [visualizations, setVisualizations] = useState([])
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    loadChartTypes()
    if (activeTab === 'library') {
      loadVisualizations()
    }
  }, [activeTab])

  const loadChartTypes = async () => {
    try {
      console.log('Loading chart types...')
      const response = await apiService.getChartTypes()
      console.log('Chart types response:', response)
      if (response.success) {
        setChartTypes(response.data)
        console.log('Chart types loaded:', response.data)
      } else {
        console.error('Failed to load chart types - response not successful:', response)
      }
    } catch (error) {
      console.error('Failed to load chart types:', error)
      // Fallback with hardcoded chart types for demo
      const fallbackTypes = {
        bar: {
          name: 'Bar Chart',
          best_for: 'Categorical data, comparisons'
        },
        line: {
          name: 'Line Chart',
          best_for: 'Time series, trends'
        },
        pie: {
          name: 'Pie Chart',
          best_for: 'Proportions, percentages'
        },
        scatter: {
          name: 'Scatter Plot',
          best_for: 'Correlations, distributions'
        },
        heatmap: {
          name: 'Heatmap',
          best_for: 'Correlation matrices, dense data'
        },
        histogram: {
          name: 'Histogram',
          best_for: 'Data distribution, frequency'
        },
        box: {
          name: 'Box Plot',
          best_for: 'Statistical distribution, outliers'
        }
      }
      setChartTypes(fallbackTypes)
      console.log('Using fallback chart types:', fallbackTypes)
    }
  }

  const loadVisualizations = async () => {
    try {
      const response = await apiService.getVisualizations()
      if (response.success) {
        setVisualizations(response.data.items)
      }
    } catch (error) {
      console.error('Failed to load visualizations:', error)
    }
  }

  const handleDataUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target.result
          const lines = text.split('\n')
          const headers = lines[0].split(',')
          const data = lines.slice(1).map(line => {
            const values = line.split(',')
            const row = {}
            headers.forEach((header, index) => {
              row[header.trim()] = values[index]?.trim()
            })
            return row
          }).filter(row => Object.values(row).some(val => val))
          
          setChartData(data)
          getSuggestions(data)
        } catch (error) {
          console.error('Failed to parse file:', error)
        }
      }
      reader.readAsText(file)
    }
  }

  const getSuggestions = async (data) => {
    try {
      const response = await apiService.suggestChartType(data)
      if (response.success) {
        setSuggestions(response.data.suggestions)
      }
    } catch (error) {
      console.error('Failed to get suggestions:', error)
    }
  }

  const createVisualization = async () => {
    if (!selectedChart || !chartData.length) return

    setIsLoading(true)
    try {
      const response = await apiService.createVisualization({
        title: chartConfig.title || `${chartTypes[selectedChart]?.name || selectedChart} Chart`,
        chart_type: selectedChart,
        data: chartData,
        config: chartConfig
      })

      if (response.success) {
        setGeneratedChart(response.data)
        setActiveTab('preview')
      }
    } catch (error) {
      console.error('Failed to create visualization:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const applySuggestion = (suggestion) => {
    setSelectedChart(suggestion.type)
    setChartConfig(suggestion.config)
  }

  const getChartIcon = (type) => {
    const icons = {
      bar: BarChart3,
      line: LineChart,
      pie: PieChart,
      scatter: ScatterChart,
      heatmap: Activity,
      histogram: BarChart2,
      box: Box
    }
    return icons[type] || BarChart3
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Visualize Your Data</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Effortlessly create and tailor charts that turn raw data into clear, compelling visuals. 
          Customize your visuals to any chart type, color and more.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center space-x-4 mb-8">
        <Button
          variant={activeTab === 'create' ? 'default' : 'outline'}
          onClick={() => setActiveTab('create')}
        >
          Create Chart
        </Button>
        <Button
          variant={activeTab === 'preview' ? 'default' : 'outline'}
          onClick={() => setActiveTab('preview')}
        >
          Preview
        </Button>
        <Button
          variant={activeTab === 'library' ? 'default' : 'outline'}
          onClick={() => setActiveTab('library')}
        >
          Chart Library
        </Button>
      </div>

      {activeTab === 'create' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Data Upload */}
          <Card>
            <CardHeader>
              <CardTitle>1. Upload Your Data</CardTitle>
              <CardDescription>Upload a CSV file or paste data to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                type="file"
                accept=".csv"
                onChange={handleDataUpload}
                className="mb-4"
              />
              {chartData.length > 0 && (
                <div className="text-sm text-green-600">
                  ✓ Data loaded: {chartData.length} rows with columns: {Object.keys(chartData[0] || {}).join(', ')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Suggestions */}
          {suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  AI Suggestions
                </CardTitle>
                <CardDescription>Based on your data structure, we recommend these chart types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {suggestions.map((suggestion, index) => {
                    const IconComponent = getChartIcon(suggestion.type)
                    return (
                      <Card key={index} className="cursor-pointer hover:bg-gray-50" onClick={() => applySuggestion(suggestion)}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <IconComponent className="h-5 w-5 text-blue-600" />
                            <span className="font-medium">{chartTypes[suggestion.type]?.name || suggestion.type}</span>
                            <Badge variant="secondary">{Math.round(suggestion.confidence * 100)}%</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{suggestion.reason}</p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chart Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>2. Choose Chart Type</CardTitle>
              <CardDescription>Select the visualization that best represents your data</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(chartTypes).length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Loading chart types...</div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(chartTypes).map(([type, info]) => {
                    const IconComponent = getChartIcon(type)
                    return (
                      <Card
                        key={type}
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedChart === type ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          console.log('Selected chart type:', type)
                          setSelectedChart(type)
                        }}
                      >
                        <CardContent className="p-4 text-center">
                          <IconComponent className={`h-8 w-8 mx-auto mb-2 ${
                            selectedChart === type ? 'text-blue-600' : 'text-gray-600'
                          }`} />
                          <div className="font-medium text-sm">{info.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{info.best_for}</div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
              
              {selectedChart && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-900">
                    Selected: {chartTypes[selectedChart]?.name}
                  </div>
                  <div className="text-sm text-blue-700">
                    {chartTypes[selectedChart]?.best_for}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chart Configuration */}
          {selectedChart && (
            <Card>
              <CardHeader>
                <CardTitle>3. Configure Chart</CardTitle>
                <CardDescription>Customize your chart settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Chart Title</label>
                  <Input
                    value={chartConfig.title || ''}
                    onChange={(e) => setChartConfig(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter chart title"
                  />
                </div>

                {chartData.length > 0 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">X-Axis</label>
                      <Select onValueChange={(value) => setChartConfig(prev => ({ ...prev, x: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select X-axis column" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(chartData[0] || {}).map(col => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Y-Axis</label>
                      <Select onValueChange={(value) => setChartConfig(prev => ({ ...prev, y: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Y-axis column" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(chartData[0] || {}).map(col => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <Button
                  onClick={createVisualization}
                  disabled={!selectedChart || !chartData.length || isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Creating Chart...' : 'Create Visualization'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'preview' && generatedChart && (
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {generatedChart.title}
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-4 rounded-lg border">
                <div id="chart-container" className="w-full h-96">
                  {/* Plotly chart would be rendered here */}
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Chart preview will be displayed here
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'library' && (
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visualizations.map(viz => (
              <Card key={viz.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {React.createElement(getChartIcon(viz.chart_type), { className: 'h-5 w-5 text-blue-600' })}
                    {viz.title}
                  </CardTitle>
                  <CardDescription>
                    Created {new Date(viz.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 h-32 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-gray-500">Chart Preview</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Badge variant="secondary">{chartTypes[viz.chart_type]?.name || viz.chart_type}</Badge>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {visualizations.length === 0 && (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No visualizations yet</h3>
              <p className="text-gray-600 mb-4">Create your first chart to get started</p>
              <Button onClick={() => setActiveTab('create')}>Create Chart</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
