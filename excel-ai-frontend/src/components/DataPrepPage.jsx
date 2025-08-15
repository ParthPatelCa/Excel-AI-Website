import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { CheckCircle, AlertCircle, Zap, Blend, RefreshCw, Download, Upload, Wand2, ShieldCheck } from 'lucide-react'
import { SmartDataValidation } from '@/components/SmartDataValidation.jsx'
import apiService from '@/services/api.js'

export function DataPrepPage() {
  const [activeOperation, setActiveOperation] = useState('analyze')
  const [uploadedData, setUploadedData] = useState([])
  const [analysisResults, setAnalysisResults] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [cleaningOperations, setCleaningOperations] = useState([])
  const [transformations, setTransformations] = useState([])
  const [cleanedData, setCleanedData] = useState([])
  const [datasets, setDatasets] = useState([])
  const [blendConfig, setBlendConfig] = useState({ type: 'inner_join', join_keys: [] })

  const handleFileUpload = (event) => {
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
          
          setUploadedData(data)
          if (activeOperation === 'analyze') {
            analyzeData(data)
          }
        } catch (error) {
          console.error('Failed to parse file:', error)
        }
      }
      reader.readAsText(file)
    }
  }

  const analyzeData = async (data = uploadedData) => {
    if (!data.length) return

    setIsLoading(true)
    try {
      const response = await apiService.analyzeDataQuality(data)
      if (response.success) {
        setAnalysisResults(response.data)
        // Auto-suggest cleaning operations
        const operations = generateCleaningOperations(response.data)
        setCleaningOperations(operations)
      }
    } catch (error) {
      console.error('Failed to analyze data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateCleaningOperations = (analysis) => {
    const operations = []
    
    // Add remove duplicates if needed
    if (analysis.summary.duplicate_rows > 0) {
      operations.push({
        type: 'remove_duplicates',
        description: `Remove ${analysis.summary.duplicate_rows} duplicate rows`,
        auto: true
      })
    }

    // Add missing value handling for columns with issues
    Object.entries(analysis.columns).forEach(([column, info]) => {
      if (info.missing_count > 0) {
        operations.push({
          type: 'fill_missing',
          column: column,
          method: info.is_numeric ? 'mean' : 'mode',
          description: `Fill ${info.missing_count} missing values in ${column}`,
          auto: true
        })
      }
    })

    return operations
  }

  const cleanData = async () => {
    if (!uploadedData.length || !cleaningOperations.length) return

    setIsLoading(true)
    try {
      const response = await apiService.cleanData({
        data: uploadedData,
        operations: cleaningOperations.filter(op => op.selected)
      })
      
      if (response.success) {
        setCleanedData(response.data.cleaned_data)
        setActiveOperation('results')
      }
    } catch (error) {
      console.error('Failed to clean data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const transformData = async () => {
    if (!uploadedData.length || !transformations.length) return

    setIsLoading(true)
    try {
      const response = await apiService.transformData({
        data: uploadedData,
        transformations: transformations.filter(t => t.selected)
      })
      
      if (response.success) {
        setCleanedData(response.data.transformed_data)
        setActiveOperation('results')
      }
    } catch (error) {
      console.error('Failed to transform data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const blendDatasets = async () => {
    if (datasets.length < 2) return

    setIsLoading(true)
    try {
      const response = await apiService.blendData({
        datasets: datasets,
        config: blendConfig
      })
      
      if (response.success) {
        setCleanedData(response.data.blended_data)
        setActiveOperation('results')
      }
    } catch (error) {
      console.error('Failed to blend data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleOperation = (index) => {
    setCleaningOperations(prev => prev.map((op, i) => 
      i === index ? { ...op, selected: !op.selected } : op
    ))
  }

  const toggleTransformation = (index) => {
    setTransformations(prev => prev.map((t, i) => 
      i === index ? { ...t, selected: !t.selected } : t
    ))
  }

  const getDataQualityScore = () => {
    if (!analysisResults) return 0
    
    const totalIssues = analysisResults.issues.length
    const totalColumns = Object.keys(analysisResults.columns).length
    
    if (totalIssues === 0) return 100
    return Math.max(0, 100 - (totalIssues / totalColumns) * 20)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Data Prep</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Save time and effort by using AI to automatically convert, clean, and organize your data, 
          making it ready for analysis. Reduce prep time by 90%!
        </p>
      </div>

      <Tabs value={activeOperation} onValueChange={setActiveOperation} className="max-w-6xl mx-auto">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="analyze" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Analyze
          </TabsTrigger>
          <TabsTrigger value="validate" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Smart Validate
          </TabsTrigger>
          <TabsTrigger value="clean" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Clean
          </TabsTrigger>
          <TabsTrigger value="blend" className="flex items-center gap-2">
            <Blend className="h-4 w-4" />
            Blend
          </TabsTrigger>
          <TabsTrigger value="transform" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Transform
          </TabsTrigger>
        </TabsList>

        <TabsContent value="validate" className="space-y-6">
          <SmartDataValidation 
            data={uploadedData} 
            onValidationComplete={(results) => {
              console.log('Validation complete:', results)
              // Could integrate with cleaning suggestions here
            }}
          />
        </TabsContent>

        <TabsContent value="analyze" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Quality Analysis</CardTitle>
              <CardDescription>Upload your data to get a comprehensive quality assessment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="flex-1"
                />
                <Button onClick={() => analyzeData()} disabled={!uploadedData.length || isLoading}>
                  {isLoading ? 'Analyzing...' : 'Analyze'}
                </Button>
              </div>

              {analysisResults && (
                <div className="space-y-4">
                  {/* Quality Score */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Data Quality Score
                        <Badge variant={getDataQualityScore() > 80 ? 'default' : getDataQualityScore() > 60 ? 'secondary' : 'destructive'}>
                          {Math.round(getDataQualityScore())}%
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Progress value={getDataQualityScore()} className="mb-4" />
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="font-medium">Rows</div>
                          <div className="text-gray-600">{analysisResults.summary.rows.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="font-medium">Columns</div>
                          <div className="text-gray-600">{analysisResults.summary.columns}</div>
                        </div>
                        <div>
                          <div className="font-medium">Duplicates</div>
                          <div className="text-gray-600">{analysisResults.summary.duplicate_rows}</div>
                        </div>
                        <div>
                          <div className="font-medium">Issues</div>
                          <div className="text-gray-600">{analysisResults.issues.length}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Issues */}
                  {analysisResults.issues.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Data Issues Found</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {analysisResults.issues.map((issue, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                              <AlertCircle className="h-5 w-5 text-yellow-600" />
                              <div className="flex-1">
                                <div className="font-medium">{issue.type.replace('_', ' ')} in {issue.column}</div>
                                <div className="text-sm text-gray-600">
                                  {issue.count} occurrences • {issue.severity} severity
                                </div>
                              </div>
                              <Badge variant={issue.severity === 'high' ? 'destructive' : 'secondary'}>
                                {issue.severity}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* AI Suggestions */}
                  {analysisResults.ai_suggestions && analysisResults.ai_suggestions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Wand2 className="h-5 w-5 text-purple-600" />
                          AI Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {analysisResults.ai_suggestions.map((suggestion, index) => (
                            <div key={index} className="p-3 bg-purple-50 rounded-lg">
                              <div className="font-medium">{suggestion.operation}</div>
                              <div className="text-sm text-gray-600 mt-1">{suggestion.reason}</div>
                              <Badge variant="secondary" className="mt-2">{suggestion.priority}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clean" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Cleaning Operations</CardTitle>
              <CardDescription>Select cleaning operations to apply to your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cleaningOperations.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {cleaningOperations.map((operation, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        <input
                          type="checkbox"
                          checked={operation.selected || false}
                          onChange={() => toggleOperation(index)}
                          className="h-4 w-4"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{operation.description}</div>
                          {operation.auto && (
                            <Badge variant="secondary" className="mt-1">Auto-suggested</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    onClick={cleanData} 
                    disabled={!cleaningOperations.some(op => op.selected) || isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Cleaning Data...' : 'Apply Cleaning Operations'}
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No cleaning operations available</h3>
                  <p className="text-gray-600">Upload and analyze data first to see cleaning suggestions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blend" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Blending</CardTitle>
              <CardDescription>Combine multiple datasets into one</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Upload Datasets</label>
                  <Input
                    type="file"
                    accept=".csv"
                    multiple
                    onChange={(e) => {
                      // Handle multiple file uploads
                      console.log('Multiple files selected:', e.target.files)
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Blend Type</label>
                  <Select onValueChange={(value) => setBlendConfig(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blend type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inner_join">Inner Join</SelectItem>
                      <SelectItem value="left_join">Left Join</SelectItem>
                      <SelectItem value="right_join">Right Join</SelectItem>
                      <SelectItem value="outer_join">Outer Join</SelectItem>
                      <SelectItem value="concat">Concatenate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={blendDatasets} disabled={datasets.length < 2 || isLoading} className="w-full">
                  {isLoading ? 'Blending Data...' : 'Blend Datasets'}
                </Button>
              </div>

              <div className="text-center py-8 text-gray-500">
                <Blend className="h-12 w-12 mx-auto mb-4" />
                <p>Upload multiple CSV files to blend them together</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transform" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Transformation</CardTitle>
              <CardDescription>Apply transformations to modify your data structure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {['Normalize values', 'Standardize columns', 'Create bins', 'Extract date parts', 'Log transform'].map((transform, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <input
                      type="checkbox"
                      onChange={() => toggleTransformation(index)}
                      className="h-4 w-4"
                    />
                    <div className="font-medium">{transform}</div>
                  </div>
                ))}
              </div>

              <Button onClick={transformData} disabled={!transformations.some(t => t.selected) || isLoading} className="w-full">
                {isLoading ? 'Transforming Data...' : 'Apply Transformations'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {activeOperation === 'results' && cleanedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Processed Data Results
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-200">
                <thead>
                  <tr>
                    {Object.keys(cleanedData[0] || {}).map(header => (
                      <th key={header} className="border border-gray-200 p-2 bg-gray-50 text-left">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cleanedData.slice(0, 10).map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((cell, cellIndex) => (
                        <td key={cellIndex} className="border border-gray-200 p-2">
                          {String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {cleanedData.length > 10 && (
              <p className="text-sm text-gray-600 mt-2">
                Showing first 10 rows of {cleanedData.length} total rows
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
