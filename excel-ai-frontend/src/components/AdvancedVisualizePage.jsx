import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { AdvancedChartBuilder } from '@/components/AdvancedChartBuilder.jsx'
import { ChartBuilder } from '@/components/ChartBuilder.jsx'
import { 
  BarChart3, TrendingUp, Palette, Wand2, Gallery, 
  Lightbulb, Download, Share2, Settings, Eye 
} from 'lucide-react'
import { useToast } from '@/hooks/useToast.js'

export function AdvancedVisualizePage() {
  const [activeView, setActiveView] = useState('advanced')
  const [uploadedData, setUploadedData] = useState([])
  const [uploadedColumns, setUploadedColumns] = useState([])
  const [createdCharts, setCreatedCharts] = useState([])
  const [selectedChart, setSelectedChart] = useState(null)
  const { success, error: showError } = useToast()

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target.result
          const lines = text.split('\n')
          const headers = lines[0].split(',').map(h => h.trim())
          const data = lines.slice(1).map(line => {
            const values = line.split(',')
            const row = {}
            headers.forEach((header, index) => {
              row[header] = values[index]?.trim()
            })
            return row
          }).filter(row => Object.values(row).some(val => val))
          
          setUploadedData(data)
          setUploadedColumns(headers)
          success(`Loaded ${data.length} rows with ${headers.length} columns`)
        } catch (error) {
          showError('Failed to parse CSV file')
        }
      }
      reader.readAsText(file)
    }
  }

  const handleChartCreate = (chartInfo) => {
    const newChart = {
      id: Date.now(),
      ...chartInfo,
      createdAt: new Date().toISOString()
    }
    setCreatedCharts(prev => [newChart, ...prev])
    setSelectedChart(newChart)
    success('Chart added to gallery!')
  }

  const chartTypeStats = [
    { type: 'Bar Charts', count: createdCharts.filter(c => c.type === 'bar').length, icon: BarChart3 },
    { type: 'Line Charts', count: createdCharts.filter(c => c.type === 'line').length, icon: TrendingUp },
    { type: 'Pie Charts', count: createdCharts.filter(c => c.type === 'pie').length, icon: Palette },
    { type: 'Scatter Plots', count: createdCharts.filter(c => c.type === 'scatter').length, icon: Settings }
  ]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Advanced Visualization Studio</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Create stunning, AI-powered visualizations with smart recommendations, 
          advanced customization, and professional export options.
        </p>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Data Upload
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Advanced Builder
          </TabsTrigger>
          <TabsTrigger value="classic" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Classic Builder
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <Gallery className="h-4 w-4" />
            Chart Gallery
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-blue-600" />
                Upload Your Data
              </CardTitle>
              <p className="text-sm text-gray-600">
                Upload a CSV file to get started with visualization
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">Upload CSV File</p>
                  <p className="text-sm text-gray-500">Click to browse or drag and drop</p>
                </label>
              </div>

              {uploadedData.length > 0 && (
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    Successfully loaded {uploadedData.length} rows with columns: {uploadedColumns.join(', ')}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-blue-50">
                  <CardContent className="pt-4">
                    <h3 className="font-medium mb-2">✨ Pro Tips</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Include clear column headers</li>
                      <li>• Use consistent date formats</li>
                      <li>• Avoid special characters in data</li>
                      <li>• Keep files under 16MB</li>
                    </ul>
                  </CardContent>
                </Card>
                <Card className="bg-green-50">
                  <CardContent className="pt-4">
                    <h3 className="font-medium mb-2">🎯 What's Next?</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Get AI chart recommendations</li>
                      <li>• Build interactive visualizations</li>
                      <li>• Customize with advanced options</li>
                      <li>• Export in multiple formats</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          {uploadedData.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Wand2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Upload data to start building advanced charts</p>
                  <Button onClick={() => setActiveView('upload')}>
                    Upload Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <AdvancedChartBuilder 
              data={uploadedData}
              columns={uploadedColumns}
              onChartCreate={handleChartCreate}
            />
          )}
        </TabsContent>

        <TabsContent value="classic" className="space-y-6">
          {uploadedData.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Upload data to use the classic chart builder</p>
                  <Button onClick={() => setActiveView('upload')}>
                    Upload Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Classic Chart Builder</CardTitle>
                  <p className="text-sm text-gray-600">
                    Simple and straightforward chart creation
                  </p>
                </CardHeader>
                <CardContent>
                  <ChartBuilder 
                    data={uploadedData}
                    columns={uploadedColumns}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="gallery" className="space-y-6">
          {/* Chart Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {chartTypeStats.map((stat, idx) => {
              const IconComponent = stat.icon
              return (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-8 w-8 text-blue-600" />
                      <div>
                        <div className="text-2xl font-bold">{stat.count}</div>
                        <p className="text-sm text-gray-600">{stat.type}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Chart Gallery */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gallery className="h-5 w-5" />
                Your Chart Gallery
              </CardTitle>
              <p className="text-sm text-gray-600">
                View, manage, and export your created visualizations
              </p>
            </CardHeader>
            <CardContent>
              {createdCharts.length === 0 ? (
                <div className="text-center py-12">
                  <Gallery className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No charts created yet</p>
                  <Button onClick={() => setActiveView('advanced')}>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Create Your First Chart
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {createdCharts.map((chart) => (
                    <Card key={chart.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{chart.type}</Badge>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Download className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Share2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="aspect-video bg-gray-50 rounded border flex items-center justify-center">
                            <p className="text-gray-500 text-sm">Chart Preview</p>
                          </div>
                          
                          <div>
                            <h3 className="font-medium">{chart.options?.title || `${chart.type} Chart`}</h3>
                            <p className="text-xs text-gray-500">
                              Created {new Date(chart.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
