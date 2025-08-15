import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible.jsx'
import { 
  ShieldCheck, AlertTriangle, XCircle, CheckCircle, TrendingUp, 
  Eye, Settings, Brain, Zap, ChevronDown, ChevronRight 
} from 'lucide-react'
import { useToast } from '@/hooks/useToast.js'
import apiService from '@/services/api.js'

export function SmartDataValidation({ data = [], onValidationComplete }) {
  const [validationResults, setValidationResults] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [businessContext, setBusinessContext] = useState('general')
  const [expandedSections, setExpandedSections] = useState({
    anomalies: true,
    quality: true,
    business: true,
    insights: false
  })
  const { success, error: showError } = useToast()

  const runValidation = async () => {
    if (!data || data.length === 0) {
      showError('No data available for validation')
      return
    }

    setIsLoading(true)
    try {
      const context = {
        business_type: businessContext,
        domain: businessContext,
        data_source: 'user_upload'
      }

      const response = await apiService.smartValidateData(data, context)
      
      if (response.success) {
        setValidationResults(response.data)
        success(`Validation complete! Overall quality score: ${response.data.overall_score}%`)
        if (onValidationComplete) {
          onValidationComplete(response.data)
        }
      } else {
        showError(response.error || 'Validation failed')
      }
    } catch (error) {
      showError(`Validation error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'low':
        return <Eye className="h-4 w-4 text-blue-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  const getSeverityBadge = (severity) => {
    const variants = {
      'high': 'destructive',
      'medium': 'secondary',
      'low': 'outline',
      'none': 'default'
    }
    return <Badge variant={variants[severity] || 'default'}>{severity}</Badge>
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            Smart Data Validation
          </CardTitle>
          <p className="text-sm text-gray-600">
            AI-powered data quality assessment with anomaly detection and business rule validation
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Business Context</label>
              <Select value={businessContext} onValueChange={setBusinessContext}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Business</SelectItem>
                  <SelectItem value="sales">Sales & Marketing</SelectItem>
                  <SelectItem value="finance">Finance & Accounting</SelectItem>
                  <SelectItem value="hr">Human Resources</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="ecommerce">E-commerce</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Dataset Info</label>
              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {data.length} rows × {data.length > 0 ? Object.keys(data[0]).length : 0} columns
              </div>
            </div>
          </div>

          <Button 
            onClick={runValidation} 
            disabled={isLoading || data.length === 0}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Settings className="h-4 w-4 mr-2 animate-spin" />
                Running Smart Validation...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Run Smart Validation
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {validationResults && (
        <div className="space-y-4">
          {/* Overall Score */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(validationResults.overall_score)}`}>
                  {validationResults.overall_score}%
                </div>
                <p className="text-gray-600 mt-2">Overall Data Quality Score</p>
                <Progress 
                  value={validationResults.overall_score} 
                  className="mt-4"
                />
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
              <TabsTrigger value="rules">Business Rules</TabsTrigger>
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <TrendingUp className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{validationResults.anomalies.length}</div>
                      <p className="text-sm text-gray-600">Anomalies Detected</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold">{validationResults.quality_issues.length}</div>
                      <p className="text-sm text-gray-600">Quality Issues</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold">
                        {validationResults.business_rules.filter(r => r.passed).length}
                      </div>
                      <p className="text-sm text-gray-600">Rules Passed</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Issues Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Issues Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {validationResults.quality_issues.slice(0, 3).map((issue, idx) => (
                      <Alert key={idx}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>{issue.column}:</strong> {issue.description}
                          {getSeverityBadge(issue.severity)}
                        </AlertDescription>
                      </Alert>
                    ))}
                    {validationResults.quality_issues.length > 3 && (
                      <p className="text-sm text-gray-500">
                        +{validationResults.quality_issues.length - 3} more issues...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="anomalies" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Statistical Anomalies</CardTitle>
                  <p className="text-sm text-gray-600">
                    Outliers and unusual patterns detected in your data
                  </p>
                </CardHeader>
                <CardContent>
                  {validationResults.anomalies.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p>No statistical anomalies detected!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {validationResults.anomalies.map((anomaly, idx) => (
                        <Card key={idx} className="border-l-4 border-l-yellow-400">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium">{anomaly.column}</span>
                                  {getSeverityBadge(anomaly.severity)}
                                  <Badge variant="outline">{anomaly.method}</Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  {anomaly.anomaly_count} outliers ({anomaly.anomaly_percentage}% of data)
                                </p>
                                <div className="text-xs text-gray-500">
                                  Sample values: {anomaly.sample_values.join(', ')}
                                </div>
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

            <TabsContent value="rules" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Business Rule Validation</CardTitle>
                  <p className="text-sm text-gray-600">
                    Domain-specific validation rules for {businessContext} data
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {validationResults.business_rules.map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                        {getSeverityIcon(rule.severity)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{rule.column}</span>
                            <Badge variant={rule.passed ? 'default' : 'destructive'}>
                              {rule.passed ? 'Passed' : 'Failed'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{rule.description}</p>
                          {!rule.passed && (
                            <p className="text-xs text-red-600">
                              {rule.violations} violations found
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-600" />
                    Smart Suggestions
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    AI-powered recommendations to improve your data quality
                  </p>
                </CardHeader>
                <CardContent>
                  {validationResults.suggestions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p>No suggestions needed - your data looks great!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {validationResults.suggestions.map((suggestion, idx) => (
                        <Card key={idx} className="border-l-4 border-l-blue-400">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium">{suggestion.column || 'General'}</span>
                                  <Badge variant="outline">{suggestion.priority}</Badge>
                                  {suggestion.auto_applicable && (
                                    <Badge variant="secondary">Auto-fix</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  {suggestion.description}
                                </p>
                                {suggestion.options && (
                                  <div className="flex gap-2">
                                    {suggestion.options.map((option, optIdx) => (
                                      <Badge key={optIdx} variant="outline" className="text-xs">
                                        {option.replace('_', ' ')}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {suggestion.auto_applicable && (
                                <Button size="sm" variant="outline">
                                  Apply Fix
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Insights */}
              {validationResults.ai_insights && validationResults.ai_insights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-600" />
                      AI Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {validationResults.ai_insights.map((insight, idx) => (
                        <Alert key={idx}>
                          <Brain className="h-4 w-4" />
                          <AlertDescription>
                            <strong>{insight.type.replace('_', ' ')}:</strong> {insight.description}
                            {insight.columns && (
                              <div className="mt-2">
                                <span className="text-xs text-gray-500">
                                  Columns: {insight.columns.join(', ')}
                                </span>
                              </div>
                            )}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
