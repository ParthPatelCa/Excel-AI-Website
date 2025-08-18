import { useState, useEffect, Suspense } from 'react'
import { Upload, BarChart3, MessageSquare, Download, FileSpreadsheet, Zap, TrendingUp, Brain, Link, CheckCircle, AlertCircle, History, Settings, Target, Search } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { AnimatedButton } from '@/components/ui/AnimatedButton.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { LoadingSpinner, ErrorAlert, ProgressBar } from '@/components/ui/alerts.jsx'
import { ThemeProvider } from '@/contexts/ThemeContext.jsx'
import { ThemeToggle } from '@/components/ui/ThemeToggle.jsx'
import { AdvancedDropZone } from '@/components/ui/AdvancedDropZone.jsx'
import { DataVisualization } from '@/components/DataVisualization.jsx'
import { ChatInterface } from '@/components/ChatInterface.jsx'
import { FormulaWorkspace } from '@/components/FormulaWorkspace.jsx'
import { FormulaHistory } from '@/components/FormulaHistory.jsx'
import { ChatHistory } from '@/components/ChatHistory.jsx'
import { ExportReports } from '@/components/ExportReports.jsx'
import { ConnectorsPage } from '@/components/ConnectorsPage.jsx'
import { AnalysisPage } from '@/components/AnalysisPage.jsx'
import { VisualizePage } from '@/components/VisualizePage.jsx'
import { DataPrepPage } from '@/components/DataPrepPage.jsx'
import { EnrichPage } from '@/components/EnrichPage.jsx'
import { AIToolsPage } from '@/components/AIToolsPage.jsx'
import { AuthForm } from '@/components/AuthForm.jsx'
import { UserDashboard } from '@/components/UserDashboard.jsx'
import { DataCleaning } from '@/components/DataCleaning.jsx'
import { ChartBuilder } from '@/components/ChartBuilder.jsx'
import { PredictiveAnalytics } from '@/components/PredictiveAnalytics.jsx'
import { TemplateLibrary } from '@/components/TemplateLibrary.jsx'
import { MacroGenerator } from '@/components/MacroGenerator.jsx'
import { UIShowcase } from '@/components/UIShowcase.jsx'
import { PerformanceMonitor } from '@/components/PerformanceMonitor.jsx'
import { 
  LazyDataVisualization, 
  LazyChartBuilder, 
  LazyPredictiveAnalytics,
  LazyDataCleaning,
  LazyTemplateLibrary,
  LazyMacroGenerator,
  LazyUIShowcase,
  ComponentLoader,
  preloadComponents
} from '@/utils/lazyComponents.jsx'
import { validateFile, validateGoogleSheetsUrl } from '@/utils/validation.js'
import apiService from '@/services/api.js'
import enhancedApiService from '@/services/enhancedApi.js'
import authService from '@/services/auth.js'
// Enhanced UI Components
import { 
  EnhancedApp, 
  EnhancedNavigation, 
  EnhancedLoading, 
  EnhancedError, 
  EnhancedFileUpload,
  SectionTracker,
  useAnalytics
} from '@/components/EnhancedUI.jsx'
import './App.css'

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  
  // App state
  const [currentView, setCurrentView] = useState('home')
  const [currentPath, setCurrentPath] = useState(window.location.pathname)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [analysisResults, setAnalysisResults] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('')
  const [urlValidation, setUrlValidation] = useState(null)
  const [error, setError] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [currentActiveTab, setCurrentActiveTab] = useState('overview')

  // Enhanced analytics hook
  const { trackEvent, trackPageView, trackEngagement, trackError } = useAnalytics()

  // Check authentication on app load
  useEffect(() => {
    checkAuthStatus()
  }, [])

  // Handle URL changes
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname)
    }
    
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Track page views when currentView changes
  useEffect(() => {
    trackPageView(currentView)
  }, [currentView, trackPageView])

  // Initialize performance optimizations
  useEffect(() => {
    // Preload critical components
    preloadComponents()
    
    // Preload critical API data
    enhancedApiService.preloadCriticalData()
    
    // Performance monitoring
    if ('performance' in window && performance.mark) {
      performance.mark('app-init-start')
    }
    
    return () => {
      if ('performance' in window && performance.mark) {
        performance.mark('app-init-end')
        performance.measure('app-init', 'app-init-start', 'app-init-end')
      }
    }
  }, [])

  const checkAuthStatus = async () => {
    setAuthLoading(true)
    
    if (authService.isAuthenticated()) {
      const result = await authService.getCurrentUser()
      if (result.success) {
        setIsAuthenticated(true)
        setUser(result.user)
        trackEvent('user_authenticated', { userId: result.user.id })
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
    // Navigate to home page
    window.history.pushState(null, '', '/')
    setCurrentPath('/')
    trackEvent('auth_success', { method: 'login', userId: userData.id })
  }

  const handleLogout = () => {
    trackEvent('user_logout', { userId: user?.id })
    setIsAuthenticated(false)
    setUser(null)
    setCurrentView('home')
    // Navigate to auth page
    window.history.pushState(null, '', '/auth')
    setCurrentPath('/auth')
    // Reset app state
    setUploadedFile(null)
    setAnalysisResults(null)
    setChatMessages([])
    setError(null)
  }

  const handleFileUpload = async (file) => {
    if (!file) return

    // Validate file
    const validation = validateFile(file)
    if (!validation.isValid) {
      const errorMsg = validation.errors.join(', ')
      setError(errorMsg)
      trackError(new Error(errorMsg), { context: 'file_validation' })
      return
    }

    setUploadedFile(file)
    setIsLoading(true)
    setCurrentView('analysis')
    setError(null)
    setUploadProgress(0)

    trackEvent('file_upload_started', { 
      fileName: file.name, 
      fileSize: file.size,
      fileType: file.type 
    })

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
          
          trackEvent('analysis_completed', { 
            fileName: file.name,
            insightsCount: analysisResponse.insights?.length || 0,
            hasAIInsights: !!analysisResponse.ai_insights
          })
        } else {
          throw new Error('Analysis failed')
        }
      } else {
        throw new Error('File upload failed')
      }
    } catch (error) {
      console.error('Error processing file:', error)
      const errorMsg = `Failed to process file: ${error.message}`
      setError(errorMsg)
      setAnalysisResults(null)
      trackError(error, { context: 'file_processing', fileName: file.name })
    } finally {
      setIsLoading(false)
      setUploadProgress(0)
    }
  }

  const handleGoogleSheetsAnalysis = async () => {
    // Validate URL
    const validation = validateGoogleSheetsUrl(googleSheetsUrl)
    if (!validation.isValid) {
      const errorMsg = validation.errors.join(', ')
      setError(errorMsg)
      trackError(new Error(errorMsg), { context: 'google_sheets_validation' })
      return
    }

    setIsLoading(true)
    setCurrentView('analysis')
    setUploadedFile({ name: 'Google Sheets Data', source: 'google_sheets' })
    setError(null)

    trackEvent('google_sheets_analysis_started', { url: googleSheetsUrl })

    try {
      const response = await apiService.analyzeGoogleSheetsUrl(googleSheetsUrl)
      
      if (response.success) {
        setAnalysisResults({
          insights: response.insights,
          ai_insights: response.ai_insights,
          file_info: response.file_info
        })
        
        trackEvent('google_sheets_analysis_completed', { 
          url: googleSheetsUrl,
          insightsCount: response.insights?.length || 0
        })
      } else {
        throw new Error('Google Sheets analysis failed')
      }
    } catch (error) {
      console.error('Error analyzing Google Sheets:', error)
      const errorMsg = `Failed to analyze Google Sheets: ${error.message}`
      setError(errorMsg)
      setAnalysisResults(null)
      trackError(error, { context: 'google_sheets_analysis', url: googleSheetsUrl })
    } finally {
      setIsLoading(false)
    }
  }

  const validateGoogleSheetsUrlInput = async (url) => {
    const validation = validateGoogleSheetsUrl(url)
    setUrlValidation(validation.isValid ? 
      { valid: true, message: 'Valid Google Sheets URL detected' } :
      { valid: false, message: validation.errors[0] }
    )
  }

  const HomePage = () => (
    <SectionTracker section="home">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
          </div>
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="mb-6">
              <Badge variant="outline" className="bg-white/50 dark:bg-gray-800/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 px-4 py-2 text-sm font-medium">
                ✨ AI-Powered Data Analysis
              </Badge>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Transform Your Excel Data with
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent block mt-1 sm:mt-2">
                AI-Powered Insights
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
              Upload your Excel files and get instant, intelligent analysis. Discover patterns, 
              generate formulas, and make data-driven decisions with our advanced AI technology.
            </p>
            
            {/* Enhanced Data Input Section */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 mb-8 sm:mb-12 border border-white/20 dark:border-gray-700/20 mx-4 sm:mx-0">
              <Tabs defaultValue="file" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 bg-gray-100/50 dark:bg-gray-700/50">
                  <TabsTrigger value="file" className="flex items-center justify-center space-x-1 sm:space-x-2 text-sm sm:text-base data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-md" data-testid="file-tab">
                    <Upload className="h-4 w-4" />
                    <span className="hidden sm:inline">Upload File</span>
                    <span className="sm:hidden">Upload</span>
                  </TabsTrigger>
                  <TabsTrigger value="sheets" className="flex items-center justify-center space-x-1 sm:space-x-2 text-sm sm:text-base data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-md" data-testid="sheets-tab">
                    <Link className="h-4 w-4" />
                    <span className="hidden sm:inline">Google Sheets</span>
                    <span className="sm:hidden">Sheets</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="file" className="space-y-4">
                  <EnhancedFileUpload
                    onFileSelect={handleFileUpload}
                    accept=".xlsx,.xls,.csv"
                    maxSize={16 * 1024 * 1024}
                    className="w-full"
                  />
                </TabsContent>
                
                <TabsContent value="sheets" className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500 transition-all duration-300 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 hover:bg-green-50/30 dark:hover:bg-green-900/10">
                    <div className="flex flex-col items-center">
                      <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 p-4 sm:p-6 rounded-full mb-4">
                        <Link className="h-12 sm:h-16 w-12 sm:w-16 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-2 text-center px-2">
                        Analyze Google Sheets directly
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 text-center text-sm sm:text-base px-4">
                        Paste your Google Sheets URL below. Make sure the sheet is publicly viewable.
                      </p>
                      
                      <div className="w-full max-w-md space-y-4 px-4 sm:px-0">
                        <div className="relative">
                          <Input
                            type="url"
                            placeholder="https://docs.google.com/spreadsheets/d/..."
                            value={googleSheetsUrl}
                            onChange={(e) => {
                              setGoogleSheetsUrl(e.target.value)
                              if (e.target.value) {
                                validateGoogleSheetsUrlInput(e.target.value)
                              } else {
                                setUrlValidation(null)
                              }
                            }}
                            className="pr-12 text-sm"
                            data-testid="sheets-url-input"
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
                          <p className={`text-sm ${urlValidation.valid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} data-testid="url-error">
                            {urlValidation.message}
                          </p>
                        )}
                        
                        <AnimatedButton
                          animation="glow"
                          size="lg"
                          onClick={handleGoogleSheetsAnalysis}
                          disabled={!googleSheetsUrl || (urlValidation && !urlValidation.valid)}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg text-sm sm:text-base py-3 sm:py-4"
                          data-testid="analyze-button"
                        >
                          <Link className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
                          <span className="hidden sm:inline">Analyze Sheets</span>
                          <span className="sm:hidden">Analyze</span>
                        </AnimatedButton>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Enhanced Demo Button */}
            <div className="flex flex-col items-center space-y-3 sm:space-y-4 px-4 sm:px-0">
              <p className="text-gray-600 dark:text-gray-400 text-center text-sm sm:text-base">
                Don't have data to upload? Try our interactive demo!
              </p>
              <AnimatedButton
                animation="pulse"
                size="lg" 
                variant="outline"
                className="bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-purple-200 hover:border-purple-300 text-purple-700 hover:text-purple-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4"
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
              <div className="flex flex-col items-center space-y-1">
                <span className="text-base sm:text-lg font-semibold">✨ Try Demo with Sample Data</span>
                <span className="text-xs sm:text-sm opacity-80">Experience our full analytics suite instantly</span>
              </div>
            </AnimatedButton>
            </div>
          </div>
        </section>

      {/* Features Section */}
      <section className="py-16 bg-white/80 backdrop-blur-md relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Connect, Analyze, and Discover Insights
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our comprehensive platform supports multiple data sources and advanced analysis types
            </p>
          </div>

          {/* Two-section layout: Connect & Analyze */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {/* Connectors Section */}
            <div className="space-y-6">
              <div className="text-center">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl w-fit mx-auto mb-4">
                  <Link className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-3">Connect</h4>
                <p className="text-gray-600 mb-6">Connect your data in a few clicks to generate insights in seconds.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card className="hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-md border-white/20">
                  <CardContent className="p-4 text-center">
                    <FileSpreadsheet className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">Excel</div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-md border-white/20">
                  <CardContent className="p-4 text-center">
                    <BarChart3 className="h-6 w-6 mx-auto mb-2 text-green-600" />
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">Google Analytics</div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-md border-white/20">
                  <CardContent className="p-4 text-center">
                    <Search className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">Search Console</div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-md border-white/20">
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">Google Trends</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Analysis Section */}
            <div className="space-y-6">
              <div className="text-center">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-xl w-fit mx-auto mb-4">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-3">Analyze</h4>
                <p className="text-gray-600 mb-6">Discover actionable insights with advanced analysis types and AI-powered recommendations.</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg">
                  <Search className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Root cause analysis</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Statistical analysis</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg">
                  <Target className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Gap analysis</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Correlation analysis</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg">
                  <Brain className="h-5 w-5 text-pink-600" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Machine learning & more</span>
                </div>
              </div>
            </div>
          </div>

          {/* Legacy Features Grid */}
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
  </SectionTracker>
)

  const AnalysisPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
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
              <TabsList className="grid w-full grid-cols-12 bg-gray-100">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="visualize">Visualize</TabsTrigger>
                <TabsTrigger value="dataprep">Data Prep</TabsTrigger>
                <TabsTrigger value="enrich">Enrich</TabsTrigger>
                <TabsTrigger value="tools">Tools</TabsTrigger>
                <TabsTrigger value="connectors">Connect</TabsTrigger>
                <TabsTrigger value="analyze">Analyze</TabsTrigger>
                <TabsTrigger value="ai-chat">AI Chat</TabsTrigger>
                <TabsTrigger value="data-cleaning">Clean Data</TabsTrigger>
                <TabsTrigger value="chart-builder">Charts</TabsTrigger>
                <TabsTrigger value="predictive">Analytics</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="macros">Macros</TabsTrigger>
                <TabsTrigger value="formulas">Formulas</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
                <TabsTrigger value="ui-test">UI Test</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              </TabsList>

              <TabsContent value="visualize" className="space-y-6">
                <VisualizePage />
              </TabsContent>

              <TabsContent value="dataprep" className="space-y-6">
                <DataPrepPage />
              </TabsContent>

              <TabsContent value="enrich" className="space-y-6">
                <EnrichPage />
              </TabsContent>

              <TabsContent value="tools" className="space-y-6">
                <AIToolsPage />
              </TabsContent>

              <TabsContent value="connectors" className="space-y-6">
                <ConnectorsPage />
              </TabsContent>

              <TabsContent value="analyze" className="space-y-6">
                <AnalysisPage />
              </TabsContent>

              <TabsContent value="overview" className="space-y-6" data-testid="analysis-results">
                {/* Data Overview */}
                <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Data Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4" data-testid="file-info">
                  <p><strong>File:</strong> {uploadedFile?.name || 'Unknown'}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg" data-testid="row-count">
                    <div className="text-2xl font-bold text-blue-600">
                      {analysisResults.insights.data_quality.total_rows.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">{analysisResults.insights.data_quality.total_rows} rows</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg" data-testid="column-count">
                    <div className="text-2xl font-bold text-green-600">
                      {analysisResults.insights.data_quality.total_columns}
                    </div>
                    <div className="text-sm text-gray-600">{analysisResults.insights.data_quality.total_columns} columns</div>
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
                        <th className="text-left py-2 text-gray-900 dark:text-gray-100">Column</th>
                        <th className="text-right py-2 text-gray-900 dark:text-gray-100">Mean</th>
                        <th className="text-right py-2 text-gray-900 dark:text-gray-100">Median</th>
                        <th className="text-right py-2 text-gray-900 dark:text-gray-100">Min</th>
                        <th className="text-right py-2 text-gray-900 dark:text-gray-100">Max</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(analysisResults.insights.summary_stats).map(([column, stats]) => (
                        <tr key={column} className="border-b">
                          <td className="py-2 font-medium text-gray-900 dark:text-gray-100">{column}</td>
                          <td className="text-right py-2 text-gray-700 dark:text-gray-300">{stats.mean?.toLocaleString()}</td>
                          <td className="text-right py-2 text-gray-700 dark:text-gray-300">{stats.median?.toLocaleString()}</td>
                          <td className="text-right py-2 text-gray-700 dark:text-gray-300">{stats.min?.toLocaleString()}</td>
                          <td className="text-right py-2 text-gray-700 dark:text-gray-300">{stats.max?.toLocaleString()}</td>
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

              <TabsContent value="data-cleaning" className="space-y-6">
                {/* Data Cleaning */}
                <DataCleaning 
                  data={analysisResults.file_info?.preview || []}
                  columns={analysisResults.file_info?.column_names || []}
                />
              </TabsContent>

              <TabsContent value="chart-builder" className="space-y-6">
                {/* Chart Builder */}
                <ChartBuilder 
                  data={analysisResults.file_info?.preview || []}
                  columns={analysisResults.file_info?.column_names || []}
                />
              </TabsContent>

              <TabsContent value="predictive" className="space-y-6">
                {/* Predictive Analytics */}
                <PredictiveAnalytics 
                  data={analysisResults.file_info?.preview || []}
                  columns={analysisResults.file_info?.column_names || []}
                />
              </TabsContent>

              <TabsContent value="templates" className="space-y-6">
                {/* Template Library */}
                <TemplateLibrary 
                  onApplyTemplate={(template) => {
                    // Handle template application
                    console.log('Applied template:', template)
                  }}
                />
              </TabsContent>

              <TabsContent value="macros" className="space-y-6">
                {/* Macro Generator */}
                <MacroGenerator />
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

              <TabsContent value="ui-test" className="space-y-6">
                {/* UI Components Test */}
                <div id="ui-test-section">
                  <Suspense fallback={<ComponentLoader message="Loading UI showcase..." />}>
                    <LazyUIShowcase />
                  </Suspense>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="space-y-6">
                {/* Performance Monitor */}
                <div id="performance-section">
                  <PerformanceMonitor />
                </div>
              </TabsContent>

              <TabsContent value="dashboard" className="space-y-6">
                {/* Dashboard Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart className="h-5 w-5" />
                        Quick Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Rows:</span>
                          <span className="font-semibold">{analysisResults?.basicStats?.totalRows || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Columns:</span>
                          <span className="font-semibold">{analysisResults?.basicStats?.totalColumns || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Missing Values:</span>
                          <span className="font-semibold">{analysisResults?.basicStats?.missingValues || 0}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Analysis Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Insights Found:</span>
                          <span className="font-semibold">{analysisResults?.insights?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Recommendations:</span>
                          <span className="font-semibold">{analysisResults?.recommendations?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Data Quality:</span>
                          <span className="font-semibold text-green-600">Good</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>File uploaded: {uploadedFile?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Analysis completed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span>Charts generated</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Main Dashboard Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Data Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analysisResults?.tableData ? (
                        <div className="overflow-x-auto" data-testid="data-table">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                {Object.keys(analysisResults.tableData[0] || {}).slice(0, 4).map((header, idx) => (
                                  <th key={idx} className="text-left p-2">{header}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {analysisResults.tableData.slice(0, 5).map((row, idx) => (
                                <tr key={idx} className="border-b">
                                  {Object.values(row).slice(0, 4).map((cell, cellIdx) => (
                                    <td key={cellIdx} className="p-2">{String(cell).slice(0, 20)}...</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500">No data available</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Key Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analysisResults?.insights?.slice(0, 3).map((insight, idx) => (
                          <div key={idx} className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm">{insight}</p>
                          </div>
                        )) || (
                          <p className="text-gray-500">No insights available yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
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
      <EnhancedApp>
        <div className="min-h-screen flex items-center justify-center">
          <EnhancedLoading message="Loading DataSense AI..." />
        </div>
      </EnhancedApp>
    )
  }

  // Show auth form if not authenticated or on /auth path
  if (false && (!isAuthenticated || currentPath === '/auth')) {
    return (
      <EnhancedApp>
        <AuthForm onAuthSuccess={handleAuthSuccess} />
      </EnhancedApp>
    )
  }

  // Loading state for file processing
  if (isLoading) {
    return (
      <EnhancedApp>
        <div className="min-h-screen flex items-center justify-center">
          <EnhancedLoading 
            message={uploadProgress > 0 ? "Processing your file..." : "Analyzing your data..."}
            progress={uploadProgress > 0 ? uploadProgress : null}
          />
        </div>
      </EnhancedApp>
    )
  }

  // Error state
  if (error) {
    return (
      <EnhancedApp>
        <div className="min-h-screen flex items-center justify-center p-8">
          <EnhancedError 
            error={error}
            onRetry={() => {
              setError(null)
              setCurrentView('home')
            }}
            onDismiss={() => setError(null)}
            className="max-w-lg w-full"
          />
        </div>
      </EnhancedApp>
    )
  }

  // Show dashboard if user wants to see dashboard
  if (currentView === 'dashboard') {
    return (
      <EnhancedApp>
        <UserDashboard user={user} onLogout={handleLogout} />
      </EnhancedApp>
    )
  }

  // Main app content based on current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return <HomePage />
      case 'connect':
        return (
          <SectionTracker section="connect">
            <ConnectorsPage />
          </SectionTracker>
        )
      case 'analyze':
        return (
          <SectionTracker section="analyze">
            <AnalysisPage 
              analysisResults={analysisResults}
              uploadedFile={uploadedFile}
              onBackToHome={() => setCurrentView('home')}
            />
          </SectionTracker>
        )
      case 'visualize':
        return (
          <SectionTracker section="visualize">
            <VisualizePage />
          </SectionTracker>
        )
      case 'data-prep':
        return (
          <SectionTracker section="data-prep">
            <DataPrepPage />
          </SectionTracker>
        )
      case 'enrich':
        return (
          <SectionTracker section="enrich">
            <EnrichPage />
          </SectionTracker>
        )
      case 'tools':
        return (
          <SectionTracker section="tools">
            <AIToolsPage />
          </SectionTracker>
        )
      default:
        return <HomePage />
    }
  }

  return (
    <EnhancedApp>
      {/* Global Navigation - Always visible */}
      <EnhancedNavigation 
        currentView={currentView} 
        onViewChange={setCurrentView}
        className="sticky top-0 z-50"
      />
      {renderCurrentView()}
    </EnhancedApp>
  )
}

function WrappedApp() {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  )
}

export default WrappedApp

