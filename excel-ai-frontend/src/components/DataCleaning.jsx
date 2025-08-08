import { useState, useRef } from 'react'
import { Upload, Download, CheckCircle, AlertTriangle, RefreshCw, Zap, CleaningServices, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { LoadingSpinner, TableSkeleton } from '@/components/ui/alerts.jsx'
import { useToast } from '@/hooks/useToast.js'
import apiService from '@/services/api.js'

export function DataCleaning() {
  const [file, setFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)
  const { showSuccess, showError, showInfo } = useToast()

  const handleFileUpload = async (event) => {
    const selectedFile = event.target.files[0]
    if (!selectedFile) return

    // Validate file type
    const allowedTypes = ['.csv', '.xlsx', '.xls']
    const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'))
    if (!allowedTypes.includes(fileExtension)) {
      showError('Please upload a CSV or Excel file (.csv, .xlsx, .xls)')
      return
    }

    // Validate file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      showError('File size must be less than 10MB')
      return
    }

    setFile(selectedFile)
    setIsLoading(true)
    setError(null)
    showInfo(`Processing ${selectedFile.name}...`)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/v1/features/data-cleaning', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      const data = await response.json()

      if (data.success) {
        setResults(data)
        showSuccess(`Data cleaning completed! Found ${data.quality_issues?.length || 0} issues to fix.`)
      } else {
        throw new Error(data.error || 'Data cleaning failed')
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to process file. Please try again.'
      setError(errorMessage)
      showError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const downloadCleanedData = () => {
    if (!results) return

    const csvContent = convertToCSV(results.cleaned_data.preview)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = `${file.name.split('.')[0]}_cleaned.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return ''
    
    const headers = Object.keys(data[0])
    const csvHeaders = headers.join(',')
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header]
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      }).join(',')
    )
    
    return [csvHeaders, ...csvRows].join('\n')
  }

  const getQualityScore = () => {
    if (!results?.quality_issues?.summary) return 0
    return Math.round(results.quality_issues.summary.data_quality_score || 0)
  }

  const getSeverityColor = (count, total) => {
    const percentage = (count / total) * 100
    if (percentage > 20) return 'destructive'
    if (percentage > 10) return 'secondary'
    return 'default'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Automated Data Cleaning</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Upload your data and let our AI automatically detect and fix quality issues, 
          inconsistencies, and formatting problems.
        </p>
      </div>

      {/* Upload Section */}
      {!results && (
        <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-6 rounded-full w-fit mx-auto mb-4">
                <CleaningServices className="h-16 w-16 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload Data for Cleaning</h3>
              <p className="text-gray-500 mb-6">
                Supports Excel (.xlsx, .xls) and CSV files up to 16MB
              </p>
              
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
                ref={fileInputRef}
                disabled={isLoading}
              />
              
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner variant="processing" size="sm" className="mr-2" />
                    Analyzing Data...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
                    Choose File
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <LoadingSpinner variant="ai" size="lg" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Cleaning Your Data</h3>
                <p className="text-gray-600 mb-4">
                  Our AI is analyzing your data for quality issues and applying automatic fixes...
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing</span>
                    <span>Please wait...</span>
                  </div>
                </div>
              </div>
              
              {/* Processing Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <LoadingSpinner variant="analysis" size="sm" className="mx-auto mb-2" />
                  <p className="text-sm font-medium">Detecting Issues</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <LoadingSpinner variant="processing" size="sm" className="mx-auto mb-2" />
                  <p className="text-sm font-medium">Applying Fixes</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <LoadingSpinner variant="ai" size="sm" className="mx-auto mb-2" />
                  <p className="text-sm font-medium">Generating Report</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Quality Score Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Data Quality Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{getQualityScore()}%</div>
                  <div className="text-sm text-gray-600">Quality Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{results.applied_operations.length}</div>
                  <div className="text-sm text-gray-600">Issues Fixed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {results.improvement_summary.rows_before - results.improvement_summary.rows_after}
                  </div>
                  <div className="text-sm text-gray-600">Rows Cleaned</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {results.improvement_summary.missing_values_before - results.improvement_summary.missing_values_after}
                  </div>
                  <div className="text-sm text-gray-600">Missing Values Fixed</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Data Quality Score</span>
                  <span>{getQualityScore()}%</span>
                </div>
                <Progress value={getQualityScore()} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <Tabs defaultValue="issues" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="issues">Quality Issues</TabsTrigger>
              <TabsTrigger value="operations">Applied Fixes</TabsTrigger>
              <TabsTrigger value="comparison">Before/After</TabsTrigger>
              <TabsTrigger value="download">Export</TabsTrigger>
            </TabsList>

            <TabsContent value="issues" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Detected Issues</CardTitle>
                  <CardDescription>
                    Analysis of data quality problems found in your dataset
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Missing Values */}
                  {results.quality_issues.missing_values.total_missing > 0 && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Missing Values</h4>
                        <Badge variant={getSeverityColor(results.quality_issues.missing_values.total_missing, results.original_data.rows)}>
                          {results.quality_issues.missing_values.total_missing} missing
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(results.quality_issues.missing_values.by_column).map(([column, count]) => (
                          <div key={column} className="flex justify-between text-sm">
                            <span>{column}</span>
                            <span>{count} ({results.quality_issues.missing_values.percentage_by_column[column]}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Duplicates */}
                  {results.quality_issues.duplicates.count > 0 && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Duplicate Rows</h4>
                        <Badge variant={getSeverityColor(results.quality_issues.duplicates.count, results.original_data.rows)}>
                          {results.quality_issues.duplicates.count} duplicates ({results.quality_issues.duplicates.percentage}%)
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Data Type Issues */}
                  {Object.keys(results.quality_issues.data_types.suggested_conversions).length > 0 && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Data Type Issues</h4>
                        <Badge variant="secondary">
                          {Object.keys(results.quality_issues.data_types.suggested_conversions).length} columns
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(results.quality_issues.data_types.suggested_conversions).map(([column, conversion]) => (
                          <div key={column} className="flex justify-between text-sm">
                            <span>{column}</span>
                            <span>{conversion.from} → {conversion.to} ({conversion.confidence}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Text Inconsistencies */}
                  {results.quality_issues.inconsistencies.columns_with_issues.length > 0 && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Text Inconsistencies</h4>
                        <Badge variant="secondary">
                          {results.quality_issues.inconsistencies.columns_with_issues.length} columns
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {results.quality_issues.inconsistencies.columns_with_issues.map((column) => (
                          <div key={column} className="flex justify-between text-sm">
                            <span>{column}</span>
                            <span>{results.quality_issues.inconsistencies.details[column].join(', ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="operations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Applied Cleaning Operations</CardTitle>
                  <CardDescription>
                    Automatic fixes that were safely applied to your data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {results.applied_operations.length > 0 ? (
                    <div className="space-y-3">
                      {results.applied_operations.map((operation, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <div className="font-semibold text-green-800">{operation.operation}</div>
                            <div className="text-sm text-green-700">{operation.details}</div>
                            {operation.column && (
                              <div className="text-xs text-green-600 mt-1">Column: {operation.column}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Zap className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p>No automatic fixes were applied. Your data is already in good shape!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Before */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Before Cleaning</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between">
                        <span>Rows:</span>
                        <span>{results.original_data.rows.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Columns:</span>
                        <span>{results.original_data.columns}</span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            {results.original_data.column_names.slice(0, 4).map((col) => (
                              <th key={col} className="text-left py-1 px-2">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {results.original_data.preview.slice(0, 5).map((row, index) => (
                            <tr key={index} className="border-b">
                              {results.original_data.column_names.slice(0, 4).map((col) => (
                                <td key={col} className="py-1 px-2">{row[col] || 'N/A'}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* After */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">After Cleaning</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between">
                        <span>Rows:</span>
                        <span>{results.cleaned_data.rows.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Columns:</span>
                        <span>{results.cleaned_data.columns}</span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            {results.cleaned_data.column_names.slice(0, 4).map((col) => (
                              <th key={col} className="text-left py-1 px-2">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {results.cleaned_data.preview.slice(0, 5).map((row, index) => (
                            <tr key={index} className="border-b">
                              {results.cleaned_data.column_names.slice(0, 4).map((col) => (
                                <td key={col} className="py-1 px-2">{row[col] || 'N/A'}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="download" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Export Cleaned Data</CardTitle>
                  <CardDescription>
                    Download your cleaned dataset and quality report
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      onClick={downloadCleanedData}
                      className="w-full"
                      size="lg"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Cleaned Data (CSV)
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full"
                      size="lg"
                      onClick={() => {
                        const report = JSON.stringify(results, null, 2)
                        const blob = new Blob([report], { type: 'application/json' })
                        const url = window.URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `${file.name.split('.')[0]}_quality_report.json`
                        a.click()
                        window.URL.revokeObjectURL(url)
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Quality Report (JSON)
                    </Button>
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Summary</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p>• {results.improvement_summary.operations_applied} cleaning operations applied</p>
                      <p>• Data quality improved from manual review needed to {getQualityScore()}%</p>
                      <p>• {results.improvement_summary.missing_values_before - results.improvement_summary.missing_values_after} missing values resolved</p>
                      <p>• Ready for analysis and visualization</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <Button 
              variant="outline"
              onClick={() => {
                setResults(null)
                setFile(null)
                setError(null)
              }}
            >
              Clean Another File
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
