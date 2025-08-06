import { useState } from 'react'
import { Download, FileText, Camera, Table, PieChart, BarChart3, Sparkles, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { LoadingSpinner } from '@/components/ui/alerts.jsx'

export const ExportReports = ({ analysisResults, fileName }) => {
  const [isExporting, setIsExporting] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState('pdf')

  const exportFormats = [
    { id: 'pdf', name: 'PDF Report', icon: FileText, description: 'Complete analysis report' },
    { id: 'csv', name: 'CSV Data', icon: Table, description: 'Raw data export' },
    { id: 'json', name: 'JSON Data', icon: FileText, description: 'Structured data format' },
    { id: 'png', name: 'PNG Charts', icon: Camera, description: 'Export visualizations' }
  ]

  const downloadAsJSON = () => {
    const data = {
      fileName: fileName,
      exportDate: new Date().toISOString(),
      analysis: analysisResults,
      metadata: {
        version: '1.0',
        source: 'Excel AI Website'
      }
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName || 'analysis'}_export.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadAsCSV = () => {
    if (!analysisResults?.file_info?.preview) return
    
    const data = analysisResults.file_info.preview
    const headers = Object.keys(data[0] || {})
    
    let csv = headers.join(',') + '\n'
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header]
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      })
      csv += values.join(',') + '\n'
    })
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName || 'data'}_export.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const generatePDFReport = () => {
    // For now, we'll create an HTML report that can be printed to PDF
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Data Analysis Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
        h2 { color: #1e40af; margin-top: 30px; }
        .metric-card { 
          display: inline-block; 
          margin: 10px; 
          padding: 15px; 
          border: 1px solid #e5e7eb; 
          border-radius: 8px; 
          background: #f9fafb;
        }
        .metric-value { font-size: 24px; font-weight: bold; color: #2563eb; }
        .metric-label { font-size: 14px; color: #6b7280; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
        th { background-color: #f3f4f6; font-weight: bold; }
        .insight { 
          background: #eff6ff; 
          border-left: 4px solid #2563eb; 
          padding: 15px; 
          margin: 10px 0; 
        }
        .recommendation { 
          background: #f0fdf4; 
          border-left: 4px solid #10b981; 
          padding: 15px; 
          margin: 10px 0; 
        }
        .footer { margin-top: 50px; text-align: center; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>Data Analysis Report</h1>
      <p><strong>File:</strong> ${fileName || 'Unknown'}</p>
      <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      
      <h2>Data Overview</h2>
      <div class="metric-card">
        <div class="metric-value">${analysisResults?.insights?.data_quality?.total_rows?.toLocaleString() || 'N/A'}</div>
        <div class="metric-label">Total Rows</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${analysisResults?.insights?.data_quality?.total_columns || 'N/A'}</div>
        <div class="metric-label">Columns</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${analysisResults?.insights?.data_quality?.missing_values || 'N/A'}</div>
        <div class="metric-label">Missing Values</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${analysisResults?.insights?.data_quality?.duplicate_rows || 'N/A'}</div>
        <div class="metric-label">Duplicates</div>
      </div>

      ${analysisResults?.insights?.summary_stats ? `
      <h2>Statistical Summary</h2>
      <table>
        <thead>
          <tr>
            <th>Column</th>
            <th>Mean</th>
            <th>Median</th>
            <th>Min</th>
            <th>Max</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(analysisResults.insights.summary_stats).map(([column, stats]) => `
            <tr>
              <td>${column}</td>
              <td>${stats.mean?.toLocaleString() || 'N/A'}</td>
              <td>${stats.median?.toLocaleString() || 'N/A'}</td>
              <td>${stats.min?.toLocaleString() || 'N/A'}</td>
              <td>${stats.max?.toLocaleString() || 'N/A'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}

      ${analysisResults?.ai_insights?.key_findings ? `
      <h2>Key Findings</h2>
      ${analysisResults.ai_insights.key_findings.map((finding, index) => `
        <div class="insight">
          <strong>${index + 1}.</strong> ${finding}
        </div>
      `).join('')}
      ` : ''}

      ${analysisResults?.ai_insights?.recommendations ? `
      <h2>Recommendations</h2>
      ${analysisResults.ai_insights.recommendations.map((rec, index) => `
        <div class="recommendation">
          <strong>${index + 1}.</strong> ${rec}
        </div>
      `).join('')}
      ` : ''}

      <div class="footer">
        Generated by Excel AI Website • ${new Date().toLocaleDateString()}
      </div>
    </body>
    </html>
    `
    
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const newWindow = window.open(url, '_blank')
    
    if (newWindow) {
      newWindow.onload = () => {
        setTimeout(() => {
          newWindow.print()
        }, 500)
      }
    }
    
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate processing
      
      switch (selectedFormat) {
        case 'pdf':
          generatePDFReport()
          break
        case 'csv':
          downloadAsCSV()
          break
        case 'json':
          downloadAsJSON()
          break
        case 'png':
          // For PNG export, we would need to capture chart images
          alert('PNG export feature coming soon! Use PDF export for now to include visualizations.')
          break
        default:
          break
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const quickExportActions = [
    {
      name: 'Quick PDF',
      action: () => {
        setSelectedFormat('pdf')
        setTimeout(() => handleExport(), 100)
      },
      icon: FileText,
      description: 'Download complete report'
    },
    {
      name: 'Data CSV',
      action: () => {
        setSelectedFormat('csv')
        setTimeout(() => handleExport(), 100)
      },
      icon: Table,
      description: 'Export raw data'
    },
    {
      name: 'Analysis JSON',
      action: () => {
        setSelectedFormat('json')
        setTimeout(() => handleExport(), 100)
      },
      icon: FileText,
      description: 'Full analysis data'
    }
  ]

  return (
    <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
        <CardTitle className="flex items-center text-green-800">
          <div className="bg-green-100 p-2 rounded-lg mr-3">
            <Download className="h-5 w-5 text-green-600" />
          </div>
          Export & Reports
          <Badge variant="outline" className="ml-auto bg-green-50 text-green-700 border-green-200">
            Professional Reports
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* Quick Export Actions */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-green-600" />
            <h4 className="font-semibold text-gray-800">Quick Export</h4>
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
              One-Click Downloads
            </Badge>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {quickExportActions.map((action) => (
              <Button
                key={action.name}
                variant="outline"
                onClick={action.action}
                disabled={isExporting}
                className="h-auto p-6 flex flex-col items-center space-y-3 bg-gradient-to-b from-white to-gray-50 hover:from-green-50 hover:to-green-100 border-gray-200 hover:border-green-300 transition-all duration-200 group"
              >
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-3 rounded-full group-hover:from-green-200 group-hover:to-emerald-200 transition-colors">
                  <action.icon className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-800 group-hover:text-green-700">{action.name}</div>
                  <div className="text-xs text-gray-500 group-hover:text-green-600">{action.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        <Separator className="bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

        {/* Custom Export */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <h4 className="font-semibold text-gray-800">Custom Export</h4>
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
              Advanced Options
            </Badge>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="text-sm font-semibold mb-3 block text-blue-800">Export Format</label>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger className="bg-white border-blue-200 focus:border-blue-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {exportFormats.map(format => (
                      <SelectItem key={format.id} value={format.id}>
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 p-1 rounded">
                            <format.icon className="h-3 w-3 text-blue-600" />
                          </div>
                          <div>
                            <span className="font-medium">{format.name}</span>
                            <div className="text-xs text-gray-500">{format.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  onClick={handleExport}
                  disabled={isExporting}
                  className="h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                >
                  {isExporting ? (
                    <LoadingSpinner message="" />
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Format Description */}
            {selectedFormat && (
              <div className="mt-4 bg-white p-4 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <p className="text-sm text-blue-800 font-medium">
                    {exportFormats.find(f => f.id === selectedFormat)?.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Export Info */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-xl border border-gray-200">
          <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
            <div className="bg-gray-200 p-1 rounded mr-2">
              <FileText className="h-4 w-4 text-gray-600" />
            </div>
            What's included in your export:
          </h5>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-1 rounded-full">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                </div>
                <span className="text-sm text-gray-700">Data overview and statistics</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-1 rounded-full">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                </div>
                <span className="text-sm text-gray-700">AI-generated insights and recommendations</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-1 rounded-full">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                </div>
                <span className="text-sm text-gray-700">Statistical summaries and data quality metrics</span>
              </div>
              {selectedFormat === 'pdf' && (
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-1 rounded-full">
                    <Sparkles className="h-3 w-3 text-blue-600" />
                  </div>
                  <span className="text-sm text-blue-700 font-medium">Formatted report ready for presentation</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
