import { useState } from 'react'
import { Upload, BarChart3, MessageSquare, Download, FileSpreadsheet, Zap, TrendingUp, Brain, Link, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import apiService from '@/services/api.js'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('home')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [analysisResults, setAnalysisResults] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('')
  const [urlValidation, setUrlValidation] = useState(null)

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setUploadedFile(file)
    setIsLoading(true)
    setCurrentView('analysis')

    try {
      // Upload and get file info
      const uploadResponse = await apiService.uploadFile(file)
      
      if (uploadResponse.success) {
        // Analyze the uploaded data
        const analysisResponse = await apiService.analyzeData(uploadResponse.data)
        
        if (analysisResponse.success) {
          setAnalysisResults({
            insights: analysisResponse.insights,
            ai_insights: analysisResponse.ai_insights,
            file_info: uploadResponse.file_info
          })
        } else {
          throw new Error('Analysis failed')
        }
      } else {
        throw new Error('File upload failed')
      }
    } catch (error) {
      console.error('Error processing file:', error)
      setAnalysisResults({
        error: `Failed to process file: ${error.message}`,
        insights: null,
        ai_insights: null
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSheetsAnalysis = async () => {
    if (!googleSheetsUrl.trim()) return

    setIsLoading(true)
    setCurrentView('analysis')
    setUploadedFile({ name: 'Google Sheets Data', source: 'google_sheets' })

    try {
      const response = await apiService.analyzeGoogleSheetsUrl(googleSheetsUrl)
      
      if (response.success) {
        setAnalysisResults({
          insights: response.insights,
          ai_insights: response.ai_insights,
          file_info: response.file_info
        })
      } else {
        throw new Error('Google Sheets analysis failed')
      }
    } catch (error) {
      console.error('Error analyzing Google Sheets:', error)
      setAnalysisResults({
        error: `Failed to analyze Google Sheets: ${error.message}`,
        insights: null,
        ai_insights: null
      })
    } finally {
      setIsLoading(false)
    }
  }

  const validateGoogleSheetsUrl = async (url) => {
    if (!url.trim()) {
      setUrlValidation(null)
      return
    }

    // Basic URL validation
    const isGoogleSheetsUrl = url.includes('docs.google.com/spreadsheets')
    if (!isGoogleSheetsUrl) {
      setUrlValidation({ valid: false, message: 'Please enter a valid Google Sheets URL' })
      return
    }

    setUrlValidation({ valid: true, message: 'Valid Google Sheets URL detected' })
  }

  const HomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <FileSpreadsheet className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Excel AI Insights</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline">Sign In</Button>
              <Button>Get Started</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Transform Your Excel Data with
            <span className="text-blue-600"> AI-Powered Insights</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Upload your Excel files and get instant, intelligent analysis. Discover patterns, 
            generate formulas, and make data-driven decisions with our advanced AI technology.
          </p>
          
          {/* Data Input Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
            <Tabs defaultValue="file" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="file" className="flex items-center space-x-2">
                  <Upload className="h-4 w-4" />
                  <span>Upload File</span>
                </TabsTrigger>
                <TabsTrigger value="sheets" className="flex items-center space-x-2">
                  <Link className="h-4 w-4" />
                  <span>Google Sheets</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="file" className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors rounded-lg p-8">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      <Upload className="h-16 w-16 text-blue-500 mb-4" />
                      <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                        Drop your Excel file here or click to browse
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Supports .xlsx, .xls, and .csv files up to 16MB
                      </p>
                      <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                        <Upload className="h-5 w-5 mr-2" />
                        Choose File
                      </Button>
                    </div>
                  </label>
                </div>
              </TabsContent>
              
              <TabsContent value="sheets" className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors rounded-lg p-8">
                  <div className="flex flex-col items-center">
                    <Link className="h-16 w-16 text-green-500 mb-4" />
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                      Analyze Google Sheets directly
                    </h3>
                    <p className="text-gray-500 mb-6 text-center">
                      Paste your Google Sheets URL below. Make sure the sheet is publicly viewable.
                    </p>
                    
                    <div className="w-full max-w-md space-y-4">
                      <div className="relative">
                        <Input
                          type="url"
                          placeholder="https://docs.google.com/spreadsheets/d/..."
                          value={googleSheetsUrl}
                          onChange={(e) => {
                            setGoogleSheetsUrl(e.target.value)
                            validateGoogleSheetsUrl(e.target.value)
                          }}
                          className="pr-10"
                        />
                        {urlValidation && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            {urlValidation.valid ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                        )}
                      </div>
                      
                      {urlValidation && (
                        <p className={`text-sm ${urlValidation.valid ? 'text-green-600' : 'text-red-600'}`}>
                          {urlValidation.message}
                        </p>
                      )}
                      
                      <Button 
                        size="lg" 
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={handleGoogleSheetsAnalysis}
                        disabled={!urlValidation?.valid}
                      >
                        <Link className="h-5 w-5 mr-2" />
                        Analyze Google Sheets
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Demo Button */}
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => {
              setCurrentView('analysis')
              setUploadedFile({ name: 'sample-sales-data.xlsx' })
              setAnalysisResults({
                insights: {
                  summary_stats: {
                    'Revenue': { mean: 45000, median: 42000, std: 12000, min: 15000, max: 85000 },
                    'Units Sold': { mean: 150, median: 140, std: 45, min: 50, max: 300 }
                  },
                  data_quality: {
                    total_rows: 1250,
                    total_columns: 8,
                    missing_values: 23,
                    duplicate_rows: 5
                  }
                },
                ai_insights: {
                  key_findings: [
                    "Revenue shows strong seasonal patterns with Q4 being the highest performing quarter",
                    "There's a positive correlation (0.85) between marketing spend and revenue",
                    "Product category 'Electronics' accounts for 60% of total revenue"
                  ],
                  recommendations: [
                    "Consider increasing marketing budget during Q3 to boost Q4 performance",
                    "Focus inventory planning on Electronics category",
                    "Investigate and clean 23 missing values in the dataset"
                  ]
                }
              })
            }}
          >
            Try Demo with Sample Data
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Powerful AI Features for Your Data
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our advanced AI engine provides comprehensive analysis and actionable insights
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-blue-100 p-3 rounded-lg w-fit">
                  <Brain className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>Smart Analysis</CardTitle>
                <CardDescription>
                  AI-powered insights that automatically detect patterns, trends, and anomalies in your data
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-green-100 p-3 rounded-lg w-fit">
                  <Link className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>Google Sheets Integration</CardTitle>
                <CardDescription>
                  Analyze data directly from Google Sheets URLs without downloading files
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-orange-100 p-3 rounded-lg w-fit">
                  <MessageSquare className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle>Natural Language Queries</CardTitle>
                <CardDescription>
                  Ask questions about your data in plain English and get instant, intelligent responses
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-purple-100 p-3 rounded-lg w-fit">
                  <Zap className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle>Formula Generation</CardTitle>
                <CardDescription>
                  Generate Excel formulas automatically based on your data structure and analysis needs
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )

  const AnalysisPage = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                onClick={() => setCurrentView('home')}
                className="mr-4"
              >
                ← Back
              </Button>
              <div className="bg-blue-600 p-2 rounded-lg">
                <FileSpreadsheet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Analysis Results</h1>
                {uploadedFile && (
                  <p className="text-sm text-gray-500">
                    {uploadedFile.source === 'google_sheets' ? 'Google Sheets Data' : uploadedFile.name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Your Data</h3>
              <p className="text-gray-600">Our AI is processing your file and generating insights...</p>
            </div>
          </div>
        ) : analysisResults ? (
          analysisResults.error ? (
            <div className="space-y-8">
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-red-600">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Error Processing Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-700">{analysisResults.error}</p>
                  <div className="mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentView('home')}
                      className="mr-2"
                    >
                      Try Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
          <div className="space-y-8">
            {/* Data Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Data Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {analysisResults.insights.data_quality.total_rows.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Rows</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {analysisResults.insights.data_quality.total_columns}
                    </div>
                    <div className="text-sm text-gray-600">Columns</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {analysisResults.insights.data_quality.missing_values}
                    </div>
                    <div className="text-sm text-gray-600">Missing Values</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {analysisResults.insights.data_quality.duplicate_rows}
                    </div>
                    <div className="text-sm text-gray-600">Duplicates</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  AI-Generated Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Key Findings
                  </h4>
                  <div className="space-y-2">
                    {analysisResults.ai_insights.key_findings.map((finding, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <Badge variant="secondary" className="mt-1">
                          {index + 1}
                        </Badge>
                        <p className="text-gray-700">{finding}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Zap className="h-4 w-4 mr-2" />
                    Recommendations
                  </h4>
                  <div className="space-y-2">
                    {analysisResults.ai_insights.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <Badge variant="outline" className="mt-1">
                          {index + 1}
                        </Badge>
                        <p className="text-gray-700">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistical Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Statistical Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Column</th>
                        <th className="text-right py-2">Mean</th>
                        <th className="text-right py-2">Median</th>
                        <th className="text-right py-2">Min</th>
                        <th className="text-right py-2">Max</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(analysisResults.insights.summary_stats).map(([column, stats]) => (
                        <tr key={column} className="border-b">
                          <td className="py-2 font-medium">{column}</td>
                          <td className="text-right py-2">{stats.mean?.toLocaleString()}</td>
                          <td className="text-right py-2">{stats.median?.toLocaleString()}</td>
                          <td className="text-right py-2">{stats.min?.toLocaleString()}</td>
                          <td className="text-right py-2">{stats.max?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Chat Interface */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Ask Questions About Your Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Ask anything about your data..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Ask
                  </Button>
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Try asking: "What are the top performing products?" or "Show me the revenue trend over time"
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          )
        ) : null}
      </div>
    </div>
  )

  return currentView === 'home' ? <HomePage /> : <AnalysisPage />
}

export default App

