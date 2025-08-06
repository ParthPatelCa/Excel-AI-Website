import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Activity, Table } from 'lucide-react'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export const DataVisualization = ({ data, analysisResults }) => {
  const [chartType, setChartType] = useState('bar')
  const [selectedColumn, setSelectedColumn] = useState('')

  if (!data || !data.length) return null

  // Get numeric columns for visualization
  const numericColumns = Object.keys(data[0]).filter(key => {
    const values = data.map(row => row[key]).filter(val => val !== null && val !== undefined && val !== '')
    return values.some(val => !isNaN(Number(val)) && val !== '')
  })

  // Get categorical columns
  const categoricalColumns = Object.keys(data[0]).filter(key => {
    const uniqueValues = [...new Set(data.map(row => row[key]))]
    return uniqueValues.length <= 20 && uniqueValues.length > 1 // Good for grouping
  })

  // Prepare data for different chart types
  const prepareChartData = () => {
    if (!selectedColumn) return []

    if (chartType === 'distribution') {
      // Create distribution/frequency data
      const values = data.map(row => row[selectedColumn]).filter(val => val !== null && val !== undefined && val !== '')
      const frequency = {}
      values.forEach(val => {
        frequency[val] = (frequency[val] || 0) + 1
      })
      
      return Object.entries(frequency)
        .map(([value, count]) => ({ name: value, value: count }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10) // Top 10 values
    }

    if (chartType === 'trend' && data.length > 1) {
      // Use data as-is for trend analysis (assuming chronological order)
      return data.slice(0, 50).map((row, index) => ({
        index: index + 1,
        value: Number(row[selectedColumn]) || 0,
        label: row[Object.keys(row)[0]] || `Point ${index + 1}` // Use first column as label
      }))
    }

    // Default: use first 20 rows for bar chart
    return data.slice(0, 20).map((row, index) => ({
      name: row[Object.keys(row)[0]] || `Item ${index + 1}`,
      value: Number(row[selectedColumn]) || 0
    }))
  }

  const chartData = prepareChartData()

  const renderChart = () => {
    if (!selectedColumn || !chartData.length) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Select a column to visualize data</p>
          </div>
        </div>
      )
    }

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'line':
      case 'trend':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={chartType === 'trend' ? 'index' : 'name'}
                fontSize={12}
              />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'pie':
      case 'distribution':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  const getChartDescription = () => {
    const totalPoints = chartData.length
    const maxValue = Math.max(...chartData.map(d => d.value))
    const avgValue = chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length

    return `Showing ${totalPoints} data points. Max: ${maxValue.toLocaleString()}, Average: ${avgValue.toFixed(2)}`
  }

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-blue-50">
        <CardTitle className="flex items-center text-gray-800">
          <div className="bg-purple-500 p-2 rounded-lg mr-3 shadow-sm">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <span>Interactive Data Visualization</span>
            <p className="text-sm text-gray-600 font-normal mt-1">
              Explore your data with dynamic charts and insights
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* Enhanced Controls */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 flex items-center">
              <Table className="h-4 w-4 mr-2 text-purple-500" />
              Select Column to Visualize
            </label>
            <Select value={selectedColumn} onValueChange={setSelectedColumn}>
              <SelectTrigger className="border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-xl shadow-sm transition-all duration-200">
                <SelectValue placeholder="Choose a column to visualize" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-200 shadow-xl">
                {numericColumns.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">
                      Numeric Columns
                    </div>
                    {numericColumns.map(column => (
                      <SelectItem key={column} value={column} className="rounded-lg my-1">
                        <div className="flex items-center space-x-2">
                          <span>{column}</span>
                          <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                            Numeric
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
                {categoricalColumns.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">
                      Categorical Columns
                    </div>
                    {categoricalColumns.map(column => (
                      <SelectItem key={column} value={column} className="rounded-lg my-1">
                        <div className="flex items-center space-x-2">
                          <span>{column}</span>
                          <Badge variant="outline" className="ml-2 bg-green-100 text-green-700 border-green-300">
                            Category
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 flex items-center">
              <BarChart3 className="h-4 w-4 mr-2 text-purple-500" />
              Chart Type
            </label>
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-xl shadow-sm transition-all duration-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-200 shadow-xl">
                <SelectItem value="bar" className="rounded-lg my-1">
                  <div className="flex items-center space-x-3">
                    <div className="p-1 bg-blue-100 rounded">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Bar Chart</div>
                      <div className="text-xs text-gray-500">Compare values across categories</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="line" className="rounded-lg my-1">
                  <div className="flex items-center space-x-3">
                    <div className="p-1 bg-green-100 rounded">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Line Chart</div>
                      <div className="text-xs text-gray-500">Show trends and connections</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="trend" className="rounded-lg my-1">
                  <div className="flex items-center space-x-3">
                    <div className="p-1 bg-purple-100 rounded">
                      <Activity className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">Trend Analysis</div>
                      <div className="text-xs text-gray-500">Analyze patterns over time</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="distribution" className="rounded-lg my-1">
                  <div className="flex items-center space-x-3">
                    <div className="p-1 bg-orange-100 rounded">
                      <PieChartIcon className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium">Distribution</div>
                      <div className="text-xs text-gray-500">Show value distribution</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Chart Description */}
        {selectedColumn && chartData.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-100">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="h-4 w-4 text-purple-600" />
              <h4 className="font-semibold text-purple-800">Chart Overview</h4>
            </div>
            <p className="text-sm text-purple-700">{getChartDescription()}</p>
          </div>
        )}

        {/* Enhanced Chart Container */}
        <div className="relative">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg overflow-hidden">
            {!selectedColumn ? (
              <div className="flex items-center justify-center h-64 text-gray-500 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                <div className="text-center space-y-4">
                  <div className="bg-white p-4 rounded-full shadow-md mx-auto w-fit">
                    <BarChart3 className="h-12 w-12 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Ready to Visualize</h3>
                    <p className="text-sm text-gray-600">Select a column above to create beautiful charts</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-purple-500" />
                    {selectedColumn} - {chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart
                  </h3>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    {chartData.length} data points
                  </Badge>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-2 border">
                  {renderChart()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Chart Insights */}
        {selectedColumn && chartData.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
            <h4 className="font-semibold mb-4 text-blue-800 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Insights for {selectedColumn}
            </h4>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {chartData.length.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Data Points</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {Math.max(...chartData.map(d => d.value)).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Highest Value</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {Math.min(...chartData.map(d => d.value)).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Lowest Value</div>
              </div>
            </div>
            
            {/* Additional Insights */}
            <div className="mt-4 p-4 bg-white rounded-lg border">
              <h5 className="font-medium text-gray-800 mb-2">Key Observations:</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Range: {(Math.max(...chartData.map(d => d.value)) - Math.min(...chartData.map(d => d.value))).toLocaleString()} units</li>
                <li>• Average: {(chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length).toFixed(2)}</li>
                {chartType === 'distribution' && (
                  <li>• Most common value: {chartData[0]?.name} ({chartData[0]?.value} occurrences)</li>
                )}
                {chartType === 'trend' && chartData.length > 1 && (
                  <li>• Trend: {chartData[chartData.length - 1].value > chartData[0].value ? 'Increasing' : 'Decreasing'} pattern detected</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
