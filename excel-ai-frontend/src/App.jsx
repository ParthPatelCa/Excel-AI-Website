import { useState, useEffect } from 'react'
import { Upload, BarChart3, MessageSquare, Download, FileSpreadsheet, Zap, TrendingUp, Brain, Link, CheckCircle, AlertCircle, History } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { LoadingSpinner, ErrorAlert, ProgressBar } from '@/components/ui/alerts.jsx'
import { DataVisualization } from '@/components/DataVisualization.jsx'
import { ChatInterface } from '@/components/ChatInterface.jsx'
import { FormulaWorkspace } from '@/components/FormulaWorkspace.jsx'
import { FormulaHistory } from '@/components/FormulaHistory.jsx'
import { ChatHistory } from '@/components/ChatHistory.jsx'
import { ExportReports } from '@/components/ExportReports.jsx'
import { AuthForm } from '@/components/AuthForm.jsx'
import { UserDashboard } from '@/components/UserDashboard.jsx'
import { validateFile, validateGoogleSheetsUrl } from '@/utils/validation.js'
import apiService from '@/services/api.js'
import authService from '@/services/auth.js'
import './App.css'

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  
  // App state
  const [currentView, setCurrentView] = useState('home')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [analysisResults, setAnalysisResults] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('')
  const [urlValidation, setUrlValidation] = useState(null)
  const [error, setError] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [currentActiveTab, setCurrentActiveTab] = useState('overview')

  // Check authentication on app load
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    setAuthLoading(true)
    
    if (authService.isAuthenticated()) {
      const result = await authService.getCurrentUser()
      if (result.success) {
        setIsAuthenticated(true)
        setUser(result.user)
      } else {
        setIsAuthenticated(false)
        setUser(null)
      }
    } else {
      setIsAuthenticated(false)
      setUser(null)
    }
    
    setAuthLoading(false)
  }

  const handleAuthSuccess = (userData) => {
    setIsAuthenticated(true)
    setUser(userData)
    setCurrentView('home')
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUser(null)
    setCurrentView('home')
    // Reset app state
    setUploadedFile(null)
    setAnalysisResults(null)
    setChatMessages([])
    setError(null)
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file
    const validation = validateFile(file)
    if (!validation.isValid) {
      setError(validation.errors.join(', '))
      return
    }

    setUploadedFile(file)
    setIsLoading(true)
    setCurrentView('analysis')
    setError(null)
    setUploadProgress(0)

    try {
      // Upload and get file info with progress
      const uploadResponse = await apiService.uploadFile(file, (progress) => {
        setUploadProgress(progress)
      })
      
      if (uploadResponse.success) {
        setUploadProgress(100)
        
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
      setError(`Failed to process file: ${error.message}`)
      setAnalysisResults(null)
    } finally {
      setIsLoading(false)
      setUploadProgress(0)
    }
  }

  const handleGoogleSheetsAnalysis = async () => {
    // Validate URL
    const validation = validateGoogleSheetsUrl(googleSheetsUrl)
    if (!validation.isValid) {
      setError(validation.errors.join(', '))
      return
    }

    setIsLoading(true)
    setCurrentView('analysis')
    setUploadedFile({ name: 'Google Sheets Data', source: 'google_sheets' })
    setError(null)

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
      setError(`Failed to analyze Google Sheets: ${error.message}`)
      setAnalysisResults(null)
    } finally {
      setIsLoading(false)
    }
  }

  const validateGoogleSheetsUrl = async (url) => {
    const validation = validateGoogleSheetsUrl(url)
    setUrlValidation(validation.isValid ? 
      { valid: true, message: 'Valid Google Sheets URL detected' } :
      { valid: false, message: validation.errors[0] }
    )
  }

  const HomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg">
                <FileSpreadsheet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  DataSense AI
                </h1>
                <p className="text-xs text-gray-500">Transform Your Data Into Intelligence</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  Welcome, {user?.first_name}!
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentView('dashboard')}
                >
                  Dashboard
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleLogout}
                >
                  Sign Out
                </Button>
              </div>
              <Button variant="outline" className="bg-white/50 hover:bg-white/80">Sign In</Button>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="mb-6">
            <Badge variant="outline" className="bg-white/50 text-blue-700 border-blue-200 px-4 py-2 text-sm font-medium">
              ✨ AI-Powered Data Analysis
            </Badge>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Transform Your Excel Data with
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent block mt-2">
              AI-Powered Insights
            </span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Upload your Excel files and get instant, intelligent analysis. Discover patterns, 
            generate formulas, and make data-driven decisions with our advanced AI technology.
          </p>
          
          {/* Data Input Section */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-8 mb-12 border border-white/20">
            <Tabs defaultValue="file" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100/50">
                <TabsTrigger value="file" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                  <Upload className="h-4 w-4" />
                  <span>Upload File</span>
                </TabsTrigger>
                <TabsTrigger value="sheets" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                  <Link className="h-4 w-4" />
                  <span>Google Sheets</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="file" className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-all duration-300 rounded-2xl p-8 hover:bg-blue-50/30">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-6 rounded-full mb-4">
                        <Upload className="h-16 w-16 text-blue-600" />
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                        Drop your Excel file here or click to browse
                      </h3>
                      <p className="text-gray-500 mb-6">
                        Supports .xlsx, .xls, and .csv files up to 16MB
                      </p>
                      <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                        <Upload className="h-5 w-5 mr-2" />
                        Choose File
                      </Button>
                    </div>
                  </label>
                </div>
              </TabsContent>
              
              <TabsContent value="sheets" className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 hover:border-green-400 transition-all duration-300 rounded-2xl p-8 hover:bg-green-50/30">
                  <div className="flex flex-col items-center">
                    <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-6 rounded-full mb-4">
                      <Link className="h-16 w-16 text-green-600" />
                    </div>
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
                          className="pr-10 border-gray-200 focus:border-green-400 bg-white/80"
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
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
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
            className="bg-white/50 hover:bg-white/80 border-gray-200 shadow-lg"
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
            ✨ Try Demo with Sample Data
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white/80 backdrop-blur-md relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Powerful AI Features for Your Data
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our advanced AI engine provides comprehensive analysis and actionable insights
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-md border-white/20">
              <CardHeader>
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-3 rounded-xl w-fit">
                  <Brain className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-gray-800">Smart Analysis</CardTitle>
                <CardDescription className="text-gray-600">
                  AI-powered insights that automatically detect patterns, trends, and anomalies in your data
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-md border-white/20">
              <CardHeader>
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-3 rounded-xl w-fit">
                  <Link className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-gray-800">Google Sheets Integration</CardTitle>
                <CardDescription className="text-gray-600">
                  Analyze data directly from Google Sheets URLs without downloading files
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-md border-white/20">
              <CardHeader>
                <div className="bg-gradient-to-br from-orange-100 to-red-100 p-3 rounded-xl w-fit">
                  <MessageSquare className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-gray-800">Natural Language Queries</CardTitle>
                <CardDescription className="text-gray-600">
                  Ask questions about your data in plain English and get instant, intelligent responses
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-md border-white/20">
              <CardHeader>
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-3 rounded-xl w-fit">
                  <Zap className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-gray-800">Formula Generation</CardTitle>
                <CardDescription className="text-gray-600">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                onClick={() => setCurrentView('home')}
                className="mr-4 bg-white/50 hover:bg-white/80"
              >
                ← Back
              </Button>
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg">
                <FileSpreadsheet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Analysis Results
                </h1>
                {uploadedFile && (
                  <p className="text-sm text-gray-500 flex items-center">
                    <FileSpreadsheet className="h-3 w-3 mr-1" />
                    {uploadedFile.source === 'google_sheets' ? 'Google Sheets Data' : uploadedFile.name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline"
                onClick={() => {
                  // Scroll to export section
                  document.querySelector('#export-section')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="bg-white/50 hover:bg-white/80"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6">
            <ErrorAlert 
              error={error} 
              onRetry={() => setCurrentView('home')}
              onDismiss={() => setError(null)}
            />
          </div>
        )}

        {isLoading ? (
          <div className="space-y-6">
            <LoadingSpinner message="Analyzing Your Data" />
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="max-w-md mx-auto">
                <ProgressBar 
                  progress={uploadProgress} 
                  message={`Uploading file... ${Math.round(uploadProgress)}%`}
                />
              </div>
            )}
          </div>
        ) : analysisResults ? (
          <div className="space-y-8">
            {/* Enhanced Analysis Interface with Tabs */}
            <Tabs value={currentActiveTab} onValueChange={setCurrentActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-6 bg-gray-100">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="visualize">Visualize</TabsTrigger>
                <TabsTrigger value="ai-chat">AI Chat</TabsTrigger>
                <TabsTrigger value="history">
                  <History className="h-4 w-4 mr-2" />
                  History
                </TabsTrigger>
                <TabsTrigger value="formulas">Formulas</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Data Overview */}
                <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Data Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              </TabsContent>

              <TabsContent value="visualize" className="space-y-6">
                {/* Data Visualization */}
                <DataVisualization 
                  data={analysisResults.file_info?.preview || []} 
                  analysisResults={analysisResults}
                />
              </TabsContent>

              <TabsContent value="ai-chat" className="space-y-6">
                {/* Chat Interface */}
                <ChatInterface 
                  data={analysisResults.file_info?.preview || []} 
                  onError={setError}
                  messages={chatMessages}
                  onMessagesChange={setChatMessages}
                />
              </TabsContent>

              <TabsContent value="history" className="space-y-6">
                {/* Chat History */}
                <ChatHistory 
                  onLoadConversation={(messages) => {
                    setChatMessages(messages)
                    setCurrentActiveTab('ai-chat')
                  }}
                />
              </TabsContent>

              <TabsContent value="formulas" className="space-y-6">
                <FormulaWorkspace columns={analysisResults.file_info?.column_names || []} />
                <FormulaHistory />
              </TabsContent>

              <TabsContent value="export" className="space-y-6">
                {/* Export Reports */}
                <div id="export-section">
                  <ExportReports 
                    analysisResults={analysisResults}
                    fileName={uploadedFile?.name || 'analysis'}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-600">No data to display. Please upload a file or enter a Google Sheets URL.</p>
            <Button 
              onClick={() => setCurrentView('home')}
              className="mt-4"
            >
              Go Back
            </Button>
          </div>
        )}
      </div>
    </div>
  )

  // Authentication loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading DataSense AI...</p>
        </div>
      </div>
    )
  }

  // Show auth form if not authenticated
  if (!isAuthenticated) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />
  }

  // Show dashboard if user wants to see dashboard, otherwise show main app
  if (currentView === 'dashboard') {
    return <UserDashboard user={user} onLogout={handleLogout} />
  }

  return currentView === 'home' ? <HomePage /> : <AnalysisPage />
}

export default App

