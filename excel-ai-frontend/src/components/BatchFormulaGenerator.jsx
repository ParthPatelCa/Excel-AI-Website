import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Loader2, CheckCircle, XCircle, Copy, Download, Upload, Zap } from 'lucide-react'
import { useToast } from '@/hooks/useToast.js'
import apiService from '@/services/api.js'

export function BatchFormulaGenerator({ columns = [] }) {
  const [descriptions, setDescriptions] = useState('')
  const [platform, setPlatform] = useState('excel')
  const [results, setResults] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const { success, error: showError } = useToast()

  const handleSubmit = async () => {
    const lines = descriptions.split('\n').filter(line => line.trim())
    if (lines.length === 0) {
      showError('Please enter at least one formula description')
      return
    }

    if (lines.length > 50) {
      showError('Maximum 50 formulas can be generated in a batch')
      return
    }

    setIsLoading(true)
    setProgress(0)
    setResults(null)

    try {
      // Simulate progress updates during the request
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const response = await apiService.batchGenerateFormulas(lines, { columns, platform })
      
      clearInterval(progressInterval)
      setProgress(100)

      if (response.success) {
        setResults(response.data)
        success(`Generated ${response.data.summary.successful_count}/${response.data.summary.total_requests} formulas successfully!`)
      } else {
        showError(response.error || 'Failed to generate formulas')
      }
    } catch (error) {
      showError(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  const copyFormula = (formula) => {
    navigator.clipboard.writeText(formula)
    success('Formula copied to clipboard!')
  }

  const downloadResults = () => {
    if (!results) return

    const csvContent = [
      ['Index', 'Description', 'Status', 'Formula', 'Explanation', 'Validation'],
      ...results.results.map(result => [
        result.index,
        `"${result.description}"`,
        result.status,
        result.success ? `"${result.data?.primary_formula || ''}"` : '',
        result.success ? `"${result.data?.explanation || ''}"` : '',
        result.success ? (result.data?.validation?.is_valid ? 'Valid' : 'Has Issues') : result.error
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `batch-formulas-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    success('Results downloaded successfully!')
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
    }
  }

  const getValidationBadge = (validation) => {
    if (!validation) return null
    
    if (validation.is_valid) {
      return <Badge variant="success" className="text-xs">Valid</Badge>
    } else {
      return <Badge variant="destructive" className="text-xs">
        {validation.invalid_columns?.length || 0} Issues
      </Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Batch Formula Generator
          </CardTitle>
          <p className="text-sm text-gray-600">
            Generate multiple formulas at once. Enter one description per line (max 50).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Platform</label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">Microsoft Excel</SelectItem>
                  <SelectItem value="sheets">Google Sheets</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Available Columns</label>
              <div className="flex flex-wrap gap-1 p-2 bg-gray-50 rounded-md min-h-[40px]">
                {columns.length > 0 ? (
                  columns.map((col, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {col}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">No columns available</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Formula Descriptions (one per line)
            </label>
            <Textarea
              placeholder={`Sum all revenue where region is 'West'
Calculate average of sales column
Count rows where status is 'Complete'
Find maximum value in quantity column
Concatenate first name and last name`}
              value={descriptions}
              onChange={(e) => setDescriptions(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
            <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
              <span>{descriptions.split('\n').filter(line => line.trim()).length} formulas</span>
              <span>Max 50 formulas per batch</span>
            </div>
          </div>

          {isLoading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Generating formulas...</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !descriptions.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Generate Formulas
                </>
              )}
            </Button>
            {results && (
              <Button variant="outline" onClick={downloadResults}>
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-600">✓ {results.summary.successful_count} successful</span>
              <span className="text-red-600">✗ {results.summary.failed_count} failed</span>
              <span className="text-gray-600">⚡ {results.summary.success_rate}% success rate</span>
              <span className="text-gray-600">🕒 {results.summary.total_time_ms}ms</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead className="w-8">Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Formula</TableHead>
                    <TableHead>Validation</TableHead>
                    <TableHead className="w-16">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.results.map((result) => (
                    <TableRow key={result.index}>
                      <TableCell className="font-mono text-sm">{result.index + 1}</TableCell>
                      <TableCell>{getStatusIcon(result.status)}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={result.description}>
                          {result.description}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        {result.success ? (
                          <div className="space-y-1">
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded block font-mono">
                              {result.data.primary_formula}
                            </code>
                            {result.data.cached && (
                              <Badge variant="secondary" className="text-xs">Cached</Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-red-600 text-sm">{result.error}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {result.success && getValidationBadge(result.data.validation)}
                      </TableCell>
                      <TableCell>
                        {result.success && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyFormula(result.data.primary_formula)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
