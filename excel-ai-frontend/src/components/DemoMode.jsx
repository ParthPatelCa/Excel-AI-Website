import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft,
  Database,
  BarChart3,
  Brain,
  Sparkles,
  FileSpreadsheet,
  Code,
  TrendingUp,
  Users,
  Star,
  MessageSquare,
  DollarSign,
  Target,
  Lightbulb,
  Copy,
  Play
} from 'lucide-react'
import demoData from '@/data/demoData'

export function DemoMode({ onBack, onSignUp }) {
  const [activeTab, setActiveTab] = useState('connect')
  const [showInsights, setShowInsights] = useState(false)
  const [copiedFormula, setCopiedFormula] = useState(null)

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text)
    setCopiedFormula(index)
    setTimeout(() => setCopiedFormula(null), 2000)
  }

  const renderChart = (data, type = 'revenue') => {
    const maxValue = Math.max(...data.map(d => d[type]))
    return (
      <div className="space-y-2">
        {data.slice(0, 6).map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-12 text-sm font-medium">{item.month}</div>
            <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${(item[type] / maxValue) * 100}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                {type === 'revenue' ? `$${item[type].toLocaleString()}` : item[type]}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Demo Navigation */}
      <nav className="bg-white/90 backdrop-blur-md shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                DataSense AI
              </h1>
              <Badge variant="outline" className="bg-green-100 text-green-800">
                ✨ Demo Mode
              </Badge>
            </div>
          </div>
          <Button
            onClick={onSignUp}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Start Free Trial
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Demo Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            🚀 Experience DataSense AI Live Demo
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our platform with real sample data. See how easy it is to connect, analyze, and visualize your business data.
          </p>
        </div>

        {/* Demo Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white p-1 rounded-lg shadow-sm">
            <TabsTrigger value="connect" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Connect</span>
            </TabsTrigger>
            <TabsTrigger value="analyze" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Analyze</span>
            </TabsTrigger>
            <TabsTrigger value="visualize" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Visualize</span>
            </TabsTrigger>
            <TabsTrigger value="enrich" className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Enrich</span>
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center space-x-2">
              <Code className="h-4 w-4" />
              <span className="hidden sm:inline">Tools</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center space-x-2">
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">Insights</span>
            </TabsTrigger>
          </TabsList>

          {/* Connect Tab */}
          <TabsContent value="connect" className="space-y-6">
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                  <Database className="h-5 w-5 text-blue-600" />
                  <span>Connected Data Sources</span>
                </CardTitle>
                <CardDescription className="text-gray-700 dark:text-gray-300">
                  Sample data sources already connected for this demo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <FileSpreadsheet className="h-6 w-6 text-green-600" />
                      <span className="font-medium text-gray-900">Sales Data.xlsx</span>
                    </div>
                    <p className="text-sm text-gray-600">12 rows, 4 columns</p>
                    <Badge variant="outline" className="mt-2 bg-green-100 text-green-800 border-green-200">Connected</Badge>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <MessageSquare className="h-6 w-6 text-blue-600" />
                      <span className="font-medium text-gray-900">Customer Feedback</span>
                    </div>
                    <p className="text-sm text-gray-600">10 responses</p>
                    <Badge variant="outline" className="mt-2 bg-blue-100 text-blue-800 border-blue-200">Connected</Badge>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <Star className="h-6 w-6 text-purple-600" />
                      <span className="font-medium text-gray-900">Product Data</span>
                    </div>
                    <p className="text-sm text-gray-600">6 products</p>
                    <Badge variant="outline" className="mt-2 bg-purple-100 text-purple-800 border-purple-200">Connected</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analyze Tab */}
          <TabsContent value="analyze" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span>Sales Trends</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderChart(demoData.salesData, 'revenue')}
                  <Button 
                    onClick={() => setShowInsights(true)}
                    className="w-full mt-4"
                    variant="outline"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Generate AI Insights
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                    <Users className="h-5 w-5 text-green-600" />
                    <span>Customer Growth</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderChart(demoData.salesData, 'customers')}
                  {showInsights && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-800 mb-2">🤖 AI Insight:</p>
                      <p className="text-sm text-blue-700">
                        Customer growth shows 75% increase year-over-year. Strong correlation with revenue growth indicates healthy unit economics.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Visualize Tab */}
          <TabsContent value="visualize" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">Regional Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['West', 'East', 'South', 'North'].map((region, index) => {
                      const values = [85000, 74000, 61000, 52000]
                      const colors = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-yellow-500']
                      return (
                        <div key={region} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded ${colors[index]}`} />
                            <span className="font-medium">{region}</span>
                          </div>
                          <span className="text-sm font-mono">${values[index].toLocaleString()}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">Product Satisfaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {demoData.productData.map((product, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate flex-1 mr-2">{product.product}</span>
                        <div className="flex items-center space-x-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${i < Math.floor(product.satisfaction) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">{product.satisfaction}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Enrich Tab */}
          <TabsContent value="enrich" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <span>AI Text Analysis - Customer Feedback</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Sample Feedback:</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {demoData.customerFeedback.slice(0, 5).map((feedback, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded text-sm">
                          "{feedback}"
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">AI Analysis Results:</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 rounded border border-green-200">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-green-600 font-medium">😊 Positive</span>
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">72%</Badge>
                        </div>
                        <p className="text-sm text-green-700">Quality, service, features</p>
                      </div>
                      
                      <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-yellow-600 font-medium">😐 Neutral</span>
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">18%</Badge>
                        </div>
                        <p className="text-sm text-yellow-700">Documentation, setup</p>
                      </div>
                      
                      <div className="p-3 bg-red-50 rounded border border-red-200">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-red-600 font-medium">😞 Negative</span>
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">10%</Badge>
                        </div>
                        <p className="text-sm text-red-700">Pricing, delivery delays</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <span>Excel Formula Generator</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {demoData.excelFormulas.map((formula, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{formula.description}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(formula.formula, index)}
                          >
                            {copiedFormula === index ? '✓' : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                        <code className="text-sm bg-white p-2 rounded block font-mono">
                          {formula.formula}
                        </code>
                        <p className="text-xs text-gray-600 mt-1">{formula.explanation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                    <Code className="h-5 w-5 text-blue-600" />
                    <span>SQL Query Generator</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {demoData.sqlQueries.map((query, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{query.description}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(query.query, `sql-${index}`)}
                          >
                            {copiedFormula === `sql-${index}` ? '✓' : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                        <pre className="text-xs bg-white p-2 rounded overflow-x-auto font-mono">
                          {query.query}
                        </pre>
                        <p className="text-xs text-gray-600 mt-1">{query.explanation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span>Sales Insights</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {demoData.insights.salesTrends.map((insight, index) => (
                      <div key={index} className="p-3 bg-blue-50 rounded text-sm">
                        {insight}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    <span>Customer Sentiment</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {demoData.insights.customerSentiment.map((insight, index) => (
                      <div key={index} className="p-3 bg-green-50 rounded text-sm">
                        {insight}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                    <Star className="h-5 w-5 text-purple-600" />
                    <span>Product Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {demoData.insights.productPerformance.map((insight, index) => (
                      <div key={index} className="p-3 bg-purple-50 rounded text-sm">
                        {insight}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Demo CTA */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            <CardContent className="pt-8 pb-8">
              <h3 className="text-2xl font-bold mb-4">
                🎉 Ready to Analyze Your Own Data?
              </h3>
              <p className="text-lg mb-6 opacity-90">
                This demo shows just a glimpse of DataSense AI's capabilities. 
                Start your free trial to unlock the full potential of your data.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="text-lg px-8 py-4"
                  onClick={onSignUp}
                >
                  Start Free Trial
                  <Play className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-gray-900"
                  onClick={onBack}
                >
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default DemoMode
