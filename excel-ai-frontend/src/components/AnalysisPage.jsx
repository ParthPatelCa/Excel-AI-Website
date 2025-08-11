import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs.jsx'
import apiService from '@/services/api.js'
import { 
  Plus, 
  Search, 
  BarChart3, 
  TrendingUp, 
  Brain, 
  Target, 
  Zap,
  Loader2, 
  CheckCircle, 
  XCircle,
  Clock,
  PlayCircle,
  FileText,
  ChartBar
} from 'lucide-react'

const ANALYSIS_ICONS = {
  'root_cause': Search,
  'statistical': BarChart3,
  'gap': Target,
  'correlation': TrendingUp,
  'machine_learning': Brain,
  'scenario': PlayCircle,
  'optimization': Zap
}

export function AnalysisPage() {
  const [analyses, setAnalyses] = useState([])
  const [analysisTypes, setAnalysisTypes] = useState({})
  const [connectors, setConnectors] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedAnalysis, setSelectedAnalysis] = useState(null)
  const [showResultsDialog, setShowResultsDialog] = useState(false)
  const [newAnalysis, setNewAnalysis] = useState({
    name: '',
    analysis_type: '',
    connector_id: '',
    parameters: {}
  })
  const [error, setError] = useState(null)

  useEffect(() => {
    loadAnalyses()
    loadAnalysisTypes()
    loadConnectors()
  }, [])

  const loadAnalyses = async () => {
    try {
      setLoading(true)
      const response = await apiService.listAnalyses()
      if (response.success) {
        setAnalyses(response.data.items)
      } else {
        setError(response.error)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadAnalysisTypes = async () => {
    try {
      const response = await apiService.getAnalysisTypes()
      if (response.success) {
        setAnalysisTypes(response.data)
      }
    } catch (err) {
      console.error('Failed to load analysis types:', err)
    }
  }

  const loadConnectors = async () => {
    try {
      const response = await apiService.listConnectors()
      if (response.success) {
        setConnectors(response.data.items)
      }
    } catch (err) {
      console.error('Failed to load connectors:', err)
    }
  }

  const handleCreateAnalysis = async () => {
    if (!newAnalysis.name || !newAnalysis.analysis_type) {
      setError('Name and analysis type are required')
      return
    }

    try {
      setCreating(true)
      setError(null)
      const response = await apiService.createAnalysis(newAnalysis)
      if (response.success) {
        setAnalyses(prev => [response.data, ...prev])
        setShowCreateDialog(false)
        setNewAnalysis({ name: '', analysis_type: '', connector_id: '', parameters: {} })
      } else {
        setError(response.error)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleViewResults = async (analysisId) => {
    try {
      const response = await apiService.getAnalysis(analysisId)
      if (response.success) {
        setSelectedAnalysis(response.data)
        setShowResultsDialog(true)
      }
    } catch (err) {
      console.error('Failed to load analysis:', err)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Running</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatExecutionTime = (ms) => {
    if (!ms) return 'N/A'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading analyses...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analyze</h1>
          <p className="text-gray-600 mt-1">Discover actionable insights with ease. Analyze and interpret data, uncovering trends, patterns, and correlations.</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Analysis
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Analysis</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Analysis Name</label>
                  <Input
                    placeholder="e.g., Sales Performance Analysis"
                    value={newAnalysis.name}
                    onChange={(e) => setNewAnalysis(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Source</label>
                  <Select
                    value={newAnalysis.connector_id}
                    onValueChange={(value) => setNewAnalysis(prev => ({ ...prev, connector_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select data source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No data source</SelectItem>
                      {connectors.map((connector) => (
                        <SelectItem key={connector.id} value={connector.id.toString()}>
                          {connector.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Analysis Type</label>
                <Select
                  value={newAnalysis.analysis_type}
                  onValueChange={(value) => setNewAnalysis(prev => ({ ...prev, analysis_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select analysis type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(analysisTypes).map(([key, type]) => {
                      const Icon = ANALYSIS_ICONS[key] || BarChart3
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center">
                            <Icon className="h-4 w-4 mr-2" />
                            {type.name}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {newAnalysis.analysis_type && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <p className="text-sm text-gray-600">
                    {analysisTypes[newAnalysis.analysis_type]?.description}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Analysis Parameters (JSON)</label>
                <Textarea
                  placeholder='{"target_variable": "sales", "features": ["price", "marketing_spend"]}'
                  value={JSON.stringify(newAnalysis.parameters, null, 2)}
                  onChange={(e) => {
                    try {
                      const params = JSON.parse(e.target.value || '{}')
                      setNewAnalysis(prev => ({ ...prev, parameters: params }))
                    } catch {
                      // Invalid JSON, keep previous value
                    }
                  }}
                  rows={4}
                />
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAnalysis} disabled={creating}>
                  {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Run Analysis
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Analysis Types Overview */}
      {analyses.length === 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Types of Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(analysisTypes).map(([key, type]) => {
              const Icon = ANALYSIS_ICONS[key] || BarChart3
              return (
                <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{type.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                        <div className="mt-3 space-y-1">
                          <div className="text-xs text-gray-500">
                            <strong>Parameters:</strong> {type.parameters?.join(', ')}
                          </div>
                          <div className="text-xs text-gray-500">
                            <strong>Output:</strong> {type.output?.join(', ')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Existing Analyses */}
      {analyses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Analyses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyses.map((analysis) => {
              const Icon = ANALYSIS_ICONS[analysis.analysis_type] || BarChart3
              const analysisType = analysisTypes[analysis.analysis_type] || {}
              
              return (
                <Card key={analysis.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Icon className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-lg">{analysis.name}</CardTitle>
                      </div>
                      {getStatusBadge(analysis.status)}
                    </div>
                    <p className="text-sm text-gray-600">{analysisType.name}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">
                        {new Date(analysis.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Execution Time:</span>
                      <span className="font-medium">{formatExecutionTime(analysis.execution_time_ms)}</span>
                    </div>
                    {analysis.model_used && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Model:</span>
                        <span className="font-medium">{analysis.model_used}</span>
                      </div>
                    )}
                    
                    <div className="flex space-x-2 pt-2">
                      {analysis.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewResults(analysis.id)}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          View Results
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Results Dialog */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Analysis Results: {selectedAnalysis?.name}</DialogTitle>
          </DialogHeader>
          {selectedAnalysis && (
            <Tabs defaultValue="results" className="w-full">
              <TabsList>
                <TabsTrigger value="results">Results</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="visualizations">Charts</TabsTrigger>
              </TabsList>
              
              <TabsContent value="results" className="space-y-4">
                <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                  {JSON.stringify(selectedAnalysis.results, null, 2)}
                </pre>
              </TabsContent>
              
              <TabsContent value="insights" className="space-y-4">
                <div className="prose max-w-none">
                  {selectedAnalysis.insights || 'No insights generated'}
                </div>
              </TabsContent>
              
              <TabsContent value="visualizations" className="space-y-4">
                <div className="text-sm text-gray-600">
                  Chart configurations and visualizations will be displayed here.
                </div>
                {selectedAnalysis.visualizations && (
                  <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(selectedAnalysis.visualizations, null, 2)}
                  </pre>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {error && analyses.length === 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
