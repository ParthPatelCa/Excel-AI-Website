import { useState, useEffect } from 'react'
import { api } from '../lib/api.ts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Switch } from '@/components/ui/switch.jsx'
import { Slider } from '@/components/ui/slider.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { 
  Wand2, TrendingUp, BarChart3, LineChart, PieChart, ScatterChart as ScatterIcon,
  Download, Share2, Save, Settings, Palette, Layers, Brain, Lightbulb,
  Eye, EyeOff, RotateCcw, Copy, Zap, ChevronRight, Target
} from 'lucide-react'
import { 
  BarChart, LineChart as RechartsLineChart, PieChart as RechartsPieChart, 
  ScatterChart, AreaChart, RadarChart, FunnelChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Bar, Line, Pie, Cell, Scatter, Area, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Funnel, LabelList
} from 'recharts'
import { useToast } from '@/hooks/useToast.js'
import apiService from '@/services/api.js'

const CHART_TYPES = [
  { 
    id: 'auto', 
    name: 'AI Recommended', 
    icon: Brain, 
    description: 'Let AI choose the best chart type',
    difficulty: 'beginner',
    useCases: ['Any data', 'Quick insights', 'Best practices']
  },
  { 
    id: 'bar', 
    name: 'Bar Chart', 
    icon: BarChart3, 
    description: 'Compare categories and values',
    difficulty: 'beginner',
    useCases: ['Category comparison', 'Rankings', 'Survey results']
  },
  { 
    id: 'line', 
    name: 'Line Chart', 
    icon: LineChart, 
    description: 'Show trends over time',
    difficulty: 'beginner',
    useCases: ['Time series', 'Trends', 'Growth tracking']
  },
  { 
    id: 'area', 
    name: 'Area Chart', 
    icon: TrendingUp, 
    description: 'Emphasize volume and trends',
    difficulty: 'intermediate',
    useCases: ['Cumulative data', 'Volume emphasis', 'Multiple series']
  },
  { 
    id: 'pie', 
    name: 'Pie Chart', 
    icon: PieChart, 
    description: 'Show parts of a whole',
    difficulty: 'beginner',
    useCases: ['Market share', 'Budget breakdown', 'Proportions']
  },
  { 
    id: 'scatter', 
    name: 'Scatter Plot', 
    icon: ScatterIcon, 
    description: 'Explore relationships between variables',
    difficulty: 'intermediate',
    useCases: ['Correlation analysis', 'Outlier detection', 'Pattern discovery']
  },
  { 
    id: 'funnel', 
    name: 'Funnel Chart', 
    icon: Target, 
    description: 'Visualize progressive stages',
    difficulty: 'advanced',
    useCases: ['Sales funnel', 'Conversion rates', 'Process flow']
  }
]

const COLOR_THEMES = {
  default: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'],
  professional: ['#1E40AF', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2'],
  pastel: ['#93C5FD', '#6EE7B7', '#FCD34D', '#FCA5A5', '#C4B5FD', '#67E8F9'],
  monochrome: ['#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F3F4F6'],
  vibrant: ['#DC2626', '#EA580C', '#CA8A04', '#65A30D', '#059669', '#0284C7'],
  earth: ['#92400E', '#B45309', '#A16207', '#4D7C0F', '#047857', '#0F766E']
}

const SAMPLE_DATA_SCENARIOS = [
  {
    name: 'Sales Performance',
    description: 'Monthly sales data by region',
    data: [
      { month: 'Jan', north: 45000, south: 38000, east: 52000, west: 41000 },
      { month: 'Feb', north: 48000, south: 42000, east: 55000, west: 44000 },
      { month: 'Mar', north: 52000, south: 45000, east: 58000, west: 47000 },
      { month: 'Apr', north: 49000, south: 41000, east: 54000, west: 45000 },
      { month: 'May', north: 53000, south: 47000, east: 61000, west: 49000 },
      { month: 'Jun', north: 57000, south: 51000, east: 64000, west: 52000 }
    ]
  },
  {
    name: 'Customer Segments',
    description: 'Revenue distribution by customer type',
    data: [
      { segment: 'Enterprise', value: 45, customers: 120 },
      { segment: 'SMB', value: 30, customers: 890 },
      { segment: 'Startup', value: 15, customers: 450 },
      { segment: 'Government', value: 10, customers: 75 }
    ]
  }
]

export function AdvancedChartBuilder({ data = [], columns = [], onChartCreate }) {
  const { success, error: showError } = useToast()
  const [selectedChartType, setSelectedChartType] = useState('auto')
  const [chartConfig, setChartConfig] = useState(null)
  const [chartData, setChartData] = useState(null)
  const [aiRecommendations, setAiRecommendations] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // Data and column selection
  const [selectedColumns, setSelectedColumns] = useState({
    x: '',
    y: '',
    series: '',
    size: '',
    color: ''
  })
  const [useSampleData, setUseSampleData] = useState(false)
  const [sampleDataIndex, setSampleDataIndex] = useState(0)
  
  // Chart customization
  const [chartOptions, setChartOptions] = useState({
    title: '',
    subtitle: '',
    width: 800,
    height: 400,
    colorTheme: 'default',
    showLegend: true,
    showGrid: true,
    showTooltips: true,
    animations: true,
    responsive: true
  })

  // AI-powered insights
  const [chartInsights, setChartInsights] = useState(null)
  const [alternativeCharts, setAlternativeCharts] = useState([])

  const currentData = useSampleData ? SAMPLE_DATA_SCENARIOS[sampleDataIndex].data : data
  const currentColumns = useSampleData ? Object.keys(SAMPLE_DATA_SCENARIOS[sampleDataIndex].data[0] || {}) : columns

  useEffect(() => {
    if (currentData.length > 0 && currentColumns.length > 0) {
      autoSelectColumns()
      if (selectedChartType === 'auto') {
        generateAiRecommendations()
      }
    }
  }, [currentData, currentColumns, useSampleData, sampleDataIndex])

  const autoSelectColumns = () => {
    if (!currentData.length) return

    const sample = currentData[0]
    const numericCols = currentColumns.filter(col => {
      const value = sample[col]
      return !isNaN(value) && !isNaN(parseFloat(value))
    })
    const categoricalCols = currentColumns.filter(col => {
      const value = sample[col]
      return isNaN(value) || isNaN(parseFloat(value))
    })

    setSelectedColumns({
      x: categoricalCols[0] || currentColumns[0] || '',
      y: numericCols[0] || '',
      series: categoricalCols[1] || '',
      size: numericCols[1] || '',
      color: categoricalCols[0] || ''
    })
  }

  const generateAiRecommendations = async () => {
    if (!currentData.length) return

    try {
      const response = await apiService.getChartRecommendations(currentData, currentColumns)
      if (response.success) {
        setAiRecommendations(response.recommendations)
        setChartInsights(response.insights)
        setAlternativeCharts(response.alternatives)
      }
    } catch (error) {
      console.error('Failed to get AI recommendations:', error)
    }
  }

  const generateChart = async () => {
    if (!currentData.length) {
      showError('Please provide data or use sample data')
      return
    }

    if (!selectedColumns.x && !selectedColumns.y) {
      showError('Please select at least X or Y axis columns')
      return
    }

    setIsLoading(true)

    try {
      const requestData = {
        dataset: currentData,
        chart_type: selectedChartType,
        columns: Object.values(selectedColumns).filter(Boolean),
        options: {
          ...chartOptions,
          selected_columns: selectedColumns
        }
      }

      const result = await api.post('/api/v1/features/chart-builder', requestData);

      if (result.success) {
        setChartConfig(result.chart_configs)
        setChartData(result.chart_data)
        
        success(`${selectedChartType === 'auto' ? 'AI-recommended' : selectedChartType} chart created successfully!`)
        
        if (onChartCreate) {
          onChartCreate({
            config: result.chart_configs,
            data: result.chart_data,
            type: selectedChartType,
            options: chartOptions
          })
        }
      } else {
        throw new Error(result.error || 'Chart generation failed')
      }
    } catch (error) {
      showError(`Chart generation failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const applyRecommendation = (recommendation) => {
    setSelectedChartType(recommendation.chart_type)
    setSelectedColumns(recommendation.columns)
    setChartOptions(prev => ({
      ...prev,
      title: recommendation.title,
      subtitle: recommendation.subtitle
    }))
    success(`Applied recommendation: ${recommendation.title}`)
  }

  const renderChart = () => {
    if (!chartData || !chartConfig) return null

    const colors = COLOR_THEMES[chartOptions.colorTheme]
    const chartProps = {
      data: chartData.data,
      margin: { top: 20, right: 30, left: 20, bottom: 60 }
    }

    switch (chartConfig.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={chartOptions.height}>
            <BarChart {...chartProps}>
              {chartOptions.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey={chartConfig.x_axis} />
              <YAxis />
              {chartOptions.showTooltips && <Tooltip />}
              {chartOptions.showLegend && <Legend />}
              <Bar dataKey={chartConfig.y_axis} fill={colors[0]} />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={chartOptions.height}>
            <RechartsLineChart {...chartProps}>
              {chartOptions.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey={chartConfig.x_axis} />
              <YAxis />
              {chartOptions.showTooltips && <Tooltip />}
              {chartOptions.showLegend && <Legend />}
              <Line 
                type="monotone" 
                dataKey={chartConfig.y_axis} 
                stroke={colors[0]} 
                strokeWidth={2}
                dot={chartConfig.markers}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        )

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={chartOptions.height}>
            <AreaChart {...chartProps}>
              {chartOptions.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey={chartConfig.x_axis} />
              <YAxis />
              {chartOptions.showTooltips && <Tooltip />}
              {chartOptions.showLegend && <Legend />}
              <Area 
                type="monotone" 
                dataKey={chartConfig.y_axis} 
                stroke={colors[0]} 
                fill={colors[0]}
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        )

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={chartOptions.height}>
            <RechartsPieChart>
              <Pie
                data={chartData.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                outerRadius={Math.min(chartOptions.width, chartOptions.height) / 4}
                fill="#8884d8"
                dataKey="value"
                nameKey="label"
              >
                {chartData.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              {chartOptions.showTooltips && <Tooltip />}
            </RechartsPieChart>
          </ResponsiveContainer>
        )

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={chartOptions.height}>
            <ScatterChart {...chartProps}>
              {chartOptions.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey={chartConfig.x_axis} />
              <YAxis />
              {chartOptions.showTooltips && <Tooltip />}
              {chartOptions.showLegend && <Legend />}
              <Scatter dataKey={chartConfig.y_axis} fill={colors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        )

      default:
        return <div className="text-center py-8 text-gray-500">Chart type not supported yet</div>
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Advanced Chart Builder</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Create stunning, interactive charts with AI recommendations and advanced customization options.
        </p>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="create">Create Chart</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          <TabsTrigger value="customize">Customize</TabsTrigger>
          <TabsTrigger value="export">Export & Share</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          {/* Data Source Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Data Source
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={useSampleData} 
                    onCheckedChange={setUseSampleData}
                  />
                  <Label>Use sample data for demo</Label>
                </div>
                {useSampleData && (
                  <Select value={sampleDataIndex.toString()} onValueChange={(v) => setSampleDataIndex(parseInt(v))}>
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SAMPLE_DATA_SCENARIOS.map((scenario, idx) => (
                        <SelectItem key={idx} value={idx.toString()}>
                          {scenario.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div className="text-sm text-gray-600">
                {useSampleData ? (
                  <span>Using sample data: {SAMPLE_DATA_SCENARIOS[sampleDataIndex].description}</span>
                ) : (
                  <span>
                    Current data: {currentData.length} rows × {currentColumns.length} columns
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chart Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Chart Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {CHART_TYPES.map((type) => {
                  const IconComponent = type.icon
                  return (
                    <Card 
                      key={type.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedChartType === type.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedChartType(type.id)}
                    >
                      <CardContent className="pt-4">
                        <div className="text-center space-y-2">
                          <IconComponent className="h-8 w-8 mx-auto text-blue-600" />
                          <div>
                            <h3 className="font-medium">{type.name}</h3>
                            <p className="text-xs text-gray-500">{type.description}</p>
                          </div>
                          <Badge className={getDifficultyColor(type.difficulty)}>
                            {type.difficulty}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Column Mapping */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Column Mapping
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>X-Axis</Label>
                  <Select value={selectedColumns.x} onValueChange={(value) => 
                    setSelectedColumns(prev => ({ ...prev, x: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentColumns.map((col) => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Y-Axis</Label>
                  <Select value={selectedColumns.y} onValueChange={(value) => 
                    setSelectedColumns(prev => ({ ...prev, y: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentColumns.map((col) => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Series/Color By (Optional)</Label>
                  <Select value={selectedColumns.series} onValueChange={(value) => 
                    setSelectedColumns(prev => ({ ...prev, series: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {currentColumns.map((col) => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={generateChart} disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <>
                      <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Chart...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate Chart
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={autoSelectColumns}>
                  <Zap className="h-4 w-4 mr-2" />
                  Auto Select
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI Chart Recommendations
              </CardTitle>
              <p className="text-sm text-gray-600">
                Smart suggestions based on your data patterns and visualization best practices
              </p>
            </CardHeader>
            <CardContent>
              {aiRecommendations.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No recommendations yet</p>
                  <Button onClick={generateAiRecommendations}>
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Get AI Recommendations
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {aiRecommendations.map((rec, idx) => (
                    <Card key={idx} className="border-l-4 border-l-purple-400">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium">{rec.title}</h3>
                              <Badge variant="outline">{rec.chart_type}</Badge>
                              <Badge className="bg-purple-100 text-purple-800">
                                {rec.confidence}% confidence
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{rec.reasoning}</p>
                            <div className="text-xs text-gray-500">
                              Best for: {rec.use_cases.join(', ')}
                            </div>
                          </div>
                          <Button size="sm" onClick={() => applyRecommendation(rec)}>
                            <ChevronRight className="h-3 w-3 mr-1" />
                            Apply
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {chartInsights && (
                <Card className="mt-6 bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-blue-600" />
                      Data Insights
                    </h3>
                    <p className="text-sm text-blue-700">{chartInsights}</p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customize" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Chart Title</Label>
                  <Input 
                    value={chartOptions.title}
                    onChange={(e) => setChartOptions(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter chart title"
                  />
                </div>

                <div>
                  <Label>Color Theme</Label>
                  <Select 
                    value={chartOptions.colorTheme} 
                    onValueChange={(value) => setChartOptions(prev => ({ ...prev, colorTheme: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(COLOR_THEMES).map((theme) => (
                        <SelectItem key={theme} value={theme}>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {COLOR_THEMES[theme].slice(0, 3).map((color, idx) => (
                                <div 
                                  key={idx}
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                            {theme}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Show Legend</Label>
                    <Switch 
                      checked={chartOptions.showLegend}
                      onCheckedChange={(checked) => setChartOptions(prev => ({ ...prev, showLegend: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Show Grid</Label>
                    <Switch 
                      checked={chartOptions.showGrid}
                      onCheckedChange={(checked) => setChartOptions(prev => ({ ...prev, showGrid: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Animations</Label>
                    <Switch 
                      checked={chartOptions.animations}
                      onCheckedChange={(checked) => setChartOptions(prev => ({ ...prev, animations: checked }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dimensions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Width: {chartOptions.width}px</Label>
                  <Slider
                    value={[chartOptions.width]}
                    onValueChange={([value]) => setChartOptions(prev => ({ ...prev, width: value }))}
                    max={1200}
                    min={400}
                    step={50}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Height: {chartOptions.height}px</Label>
                  <Slider
                    value={[chartOptions.height]}
                    onValueChange={([value]) => setChartOptions(prev => ({ ...prev, height: value }))}
                    max={800}
                    min={200}
                    step={50}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export & Share
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto p-4 flex-col">
                  <Download className="h-6 w-6 mb-2" />
                  <span>PNG Image</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex-col">
                  <Download className="h-6 w-6 mb-2" />
                  <span>SVG Vector</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex-col">
                  <Share2 className="h-6 w-6 mb-2" />
                  <span>Share Link</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex-col">
                  <Copy className="h-6 w-6 mb-2" />
                  <span>Embed Code</span>
                </Button>
              </div>
              
              {chartConfig && (
                <Alert>
                  <Save className="h-4 w-4" />
                  <AlertDescription>
                    Your chart configuration has been saved and can be exported in multiple formats.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Chart Preview */}
      {chartData && chartConfig && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{chartOptions.title || chartConfig.title}</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </Button>
                <Button size="sm" variant="outline">
                  <Settings className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-white">
              {renderChart()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
