import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { 
  Brain, Code2, Search, Wand2, BookOpen, Copy, Download, 
  Lightbulb, AlertCircle, CheckCircle, Zap, FileText, 
  Calculator, Database, Regex, MessageSquare 
} from 'lucide-react'
import { useToast } from '@/hooks/useToast.js'
import apiService from '@/services/api.js'

const TOOL_CATEGORIES = [
  {
    id: 'formula',
    name: 'Formula Tools',
    icon: Calculator,
    tools: [
      { id: 'explain', name: 'Formula Explainer', description: 'Understand any formula in plain English' },
      { id: 'optimize', name: 'Formula Optimizer', description: 'Make formulas faster and more efficient' },
      { id: 'convert', name: 'Formula Converter', description: 'Convert between Excel and Google Sheets' },
      { id: 'debug', name: 'Formula Debugger', description: 'Fix broken formulas automatically' }
    ]
  },
  {
    id: 'text',
    name: 'Text & Patterns',
    icon: FileText,
    tools: [
      { id: 'regex', name: 'Regex Generator', description: 'Create regex patterns from descriptions' },
      { id: 'text-extract', name: 'Text Extractor', description: 'Extract specific patterns from text' },
      { id: 'text-to-excel', name: 'Text to Excel', description: 'Convert unstructured text to Excel format' },
      { id: 'sentiment', name: 'Sentiment Analysis', description: 'Analyze text sentiment and emotions' },
      { id: 'classify', name: 'Text Classification', description: 'Categorize text into predefined groups' },
      { id: 'text-clean', name: 'Text Cleaner', description: 'Clean and format text data' }
    ]
  },
  {
    id: 'data',
    name: 'Data Tools',
    icon: Database,
    tools: [
      { id: 'sql', name: 'SQL Generator', description: 'Convert questions to SQL queries' },
      { id: 'pivot', name: 'Pivot Builder', description: 'Create pivot tables from descriptions' },
      { id: 'formatter', name: 'Data Formatter', description: 'Format and clean messy data' },
      { id: 'validator', name: 'Data Validator', description: 'Create validation rules automatically' }
    ]
  },
  {
    id: 'code',
    name: 'Code Generation',
    icon: Code2,
    tools: [
      { id: 'vba', name: 'VBA Generator', description: 'Create Excel macros from descriptions' },
      { id: 'python', name: 'Python Generator', description: 'Generate Python data analysis code' },
      { id: 'javascript', name: 'JavaScript Generator', description: 'Create web-based data tools' },
      { id: 'google-script', name: 'Google Apps Script', description: 'Automate Google Workspace tasks' }
    ]
  }
]

export function FormulaIntelligenceHub() {
  const [activeCategory, setActiveCategory] = useState('formula')
  const [activeTool, setActiveTool] = useState('explain')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [history, setHistory] = useState([])
  const { success, error: showError } = useToast()

  const currentCategory = TOOL_CATEGORIES.find(cat => cat.id === activeCategory)
  const currentTool = currentCategory?.tools.find(tool => tool.id === activeTool)

  const handleToolRun = async () => {
    if (!input.trim()) {
      showError('Please provide input for the tool')
      return
    }

    setIsLoading(true)
    setOutput(null)

    try {
      let result
      
      switch (activeTool) {
        case 'explain':
          result = await explainFormula(input)
          break
        case 'regex':
          result = await generateRegex(input)
          break
        case 'sql':
          result = await generateSQL(input)
          break
        case 'vba':
          result = await generateVBA(input)
          break
        case 'optimize':
          result = await optimizeFormula(input)
          break
        case 'convert':
          result = await convertFormula(input)
          break
        case 'text-extract':
          result = await extractText(input)
          break
        case 'pivot':
          result = await generatePivot(input)
          break
        case 'formatter':
          result = await formatData(input)
          break
        case 'python':
          result = await generatePython(input)
          break
        case 'javascript':
          result = await generateJavaScript(input)
          break
        case 'google-script':
          result = await generateGoogleScript(input)
          break
        case 'text-to-excel':
          result = await convertTextToExcel(input)
          break
        case 'sentiment':
          result = await analyzeSentiment(input)
          break
        case 'classify':
          result = await classifyText(input)
          break
        default:
          result = await genericToolCall(activeTool, input)
      }

      setOutput(result)
      
      // Add to history
      const historyItem = {
        id: Date.now(),
        tool: activeTool,
        toolName: currentTool.name,
        input: input,
        output: result,
        timestamp: new Date().toISOString()
      }
      setHistory(prev => [historyItem, ...prev.slice(0, 9)]) // Keep last 10
      
      success(`${currentTool.name} completed successfully!`)
    } catch (error) {
      showError(`${currentTool.name} failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const explainFormula = async (formula) => {
    const response = await apiService.explainFormula(formula, { detailed: true })
    return {
      type: 'explanation',
      explanation: response.data.explanation,
      breakdown: response.data.breakdown || [],
      tips: response.data.tips || [],
      complexity: response.data.complexity || 'medium',
      functions_used: response.data.functions_used || []
    }
  }

  const generateRegex = async (description) => {
    const response = await fetch('/api/v1/tools/regex-generator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({ description })
    })
    const result = await response.json()
    
    if (!result.success) throw new Error(result.error)
    
    return {
      type: 'regex',
      pattern: result.data.pattern,
      explanation: result.data.explanation,
      examples: result.data.examples || [],
      flags: result.data.flags || [],
      test_cases: result.data.test_cases || []
    }
  }

  const generateSQL = async (question) => {
    const response = await apiService.generateSQLQuery(question)
    return {
      type: 'sql',
      query: response.data.query,
      explanation: response.data.explanation,
      query_type: response.data.query_type,
      tables_used: response.data.tables_used || [],
      complexity: response.data.complexity || 'medium',
      optimization_tips: response.data.optimization_tips || [],
      alternative_queries: response.data.alternative_queries || [],
      estimated_performance: response.data.estimated_performance
    }
  }

  const generateVBA = async (description) => {
    const response = await apiService.generateCodeFromText(description, 'vba')
    return {
      type: 'code_generation',
      language: 'vba',
      code: response.data.code,
      explanation: response.data.explanation,
      functions_used: response.data.functions_used || [],
      setup_instructions: response.data.setup_instructions || [],
      dependencies: response.data.dependencies || [],
      complexity: response.data.complexity || 'intermediate',
      best_practices: response.data.best_practices || []
    }
  }

  const generatePython = async (description) => {
    const response = await apiService.generateCodeFromText(description, 'python')
    return {
      type: 'code_generation',
      language: 'python',
      code: response.data.code,
      explanation: response.data.explanation,
      functions_used: response.data.functions_used || [],
      setup_instructions: response.data.setup_instructions || [],
      dependencies: response.data.dependencies || [],
      complexity: response.data.complexity || 'intermediate',
      best_practices: response.data.best_practices || []
    }
  }

  const generateJavaScript = async (description) => {
    const response = await apiService.generateCodeFromText(description, 'javascript')
    return {
      type: 'code_generation',
      language: 'javascript',
      code: response.data.code,
      explanation: response.data.explanation,
      functions_used: response.data.functions_used || [],
      setup_instructions: response.data.setup_instructions || [],
      dependencies: response.data.dependencies || [],
      complexity: response.data.complexity || 'intermediate',
      best_practices: response.data.best_practices || []
    }
  }

  const generateGoogleScript = async (description) => {
    const response = await apiService.generateCodeFromText(description, 'javascript', { platform: 'google_apps_script' })
    return {
      type: 'code_generation',
      language: 'google-script',
      code: response.data.code,
      explanation: response.data.explanation,
      functions_used: response.data.functions_used || [],
      setup_instructions: response.data.setup_instructions || [],
      dependencies: response.data.dependencies || [],
      complexity: response.data.complexity || 'intermediate',
      best_practices: response.data.best_practices || []
    }
  }

  const optimizeFormula = async (formula) => {
    const response = await fetch('/api/v1/tools/formula-optimizer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({ formula })
    })
    const result = await response.json()
    
    if (!result.success) throw new Error(result.error)
    
    return {
      type: 'optimization',
      original: formula,
      optimized: result.data.optimized_formula,
      improvements: result.data.improvements || [],
      performance_gain: result.data.performance_gain || 'Unknown',
      explanation: result.data.explanation
    }
  }

  const convertFormula = async (formula) => {
    return {
      type: 'conversion',
      original: formula,
      excel_version: formula, // Would implement actual conversion logic
      sheets_version: formula.replace(/;/g, ','), // Simple example
      differences: ['Separator changed from ; to ,'],
      compatibility_notes: ['Formula should work in both platforms']
    }
  }

  const extractText = async (description) => {
    return {
      type: 'text_extraction',
      pattern: 'Generated pattern would go here',
      formula: `=REGEX(A1,"pattern","g")`,
      explanation: 'This pattern extracts the requested text elements',
      examples: ['Example 1', 'Example 2']
    }
  }

  const formatData = async (description) => {
    // For demo, we'll simulate data formatting
    const sampleData = [
      { name: ' John Doe ', email: 'JOHN@EXAMPLE.COM', age: '25', salary: '$50,000' },
      { name: 'Jane Smith', email: 'jane@test.com', age: '30', salary: '$60000' },
      { name: '', email: 'invalid-email', age: 'thirty', salary: '70k' }
    ]
    
    const response = await apiService.formatData(sampleData)
    return {
      type: 'data_formatting',
      original_rows: response.data.original_rows,
      cleaned_rows: response.data.cleaned_rows,
      transformations_applied: response.data.transformations_applied,
      data_quality_score: response.data.data_quality_score,
      issues_found: response.data.issues_found,
      suggestions: response.data.suggestions,
      preview: response.data.preview
    }
  }

  const generatePivot = async (description) => {
    // Sample columns for demo - in real app, would come from uploaded data
    const sampleColumns = ['Customer', 'Product', 'Sales_Amount', 'Order_Date', 'Region', 'Quantity']
    const response = await apiService.buildPivotTable(description, sampleColumns)
    
    return {
      type: 'pivot_table',
      pivot_structure: response.data.pivot_structure,
      explanation: response.data.explanation,
      excel_formula: response.data.excel_formula,
      python_code: response.data.python_code,
      sql_equivalent: response.data.sql_equivalent,
      insights: response.data.insights || [],
      alternative_structures: response.data.alternative_structures || [],
      complexity: response.data.complexity || 'intermediate'
    }
  }

  const convertTextToExcel = async (textContent) => {
    const response = await apiService.convertTextToExcel(textContent, 'text')
    return {
      type: 'text_to_excel',
      structured_data: response.data.structured_data,
      headers: response.data.headers,
      data_types: response.data.data_types,
      confidence_score: response.data.confidence_score,
      extraction_method: response.data.extraction_method,
      suggestions: response.data.suggestions,
      preview: response.data.preview
    }
  }

  const analyzeSentiment = async (textData) => {
    const response = await apiService.analyzeSentiment(textData, 'detailed')
    return {
      type: 'sentiment_analysis',
      overall_sentiment: response.data.overall_sentiment,
      confidence_score: response.data.confidence_score,
      sentiment_scores: response.data.sentiment_scores,
      key_phrases: response.data.key_phrases,
      emotion_breakdown: response.data.emotion_breakdown,
      recommendations: response.data.recommendations
    }
  }

  const classifyText = async (textData) => {
    const response = await apiService.classifyText(textData)
    return {
      type: 'text_classification',
      predicted_category: response.data.predicted_category,
      confidence_score: response.data.confidence_score,
      category_scores: response.data.category_scores,
      reasoning: response.data.reasoning,
      alternative_categories: response.data.alternative_categories
    }
  }

  const genericToolCall = async (tool, input) => {
    // Generic handler for tools not yet implemented
    return {
      type: 'generic',
      message: `${tool} tool is coming soon!`,
      input_received: input,
      status: 'placeholder'
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    success('Copied to clipboard!')
  }

  const renderOutput = () => {
    if (!output) return null

    switch (output.type) {
      case 'explanation':
        return (
          <div className="space-y-4">
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                <strong>Formula Explanation:</strong> {output.explanation}
              </AlertDescription>
            </Alert>
            
            {output.breakdown && output.breakdown.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Step-by-Step Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {output.breakdown.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm flex items-center justify-center font-medium">
                          {idx + 1}
                        </div>
                        <p className="text-sm">{step}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {output.functions_used && output.functions_used.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Functions Used:</h4>
                <div className="flex flex-wrap gap-2">
                  {output.functions_used.map((func, idx) => (
                    <Badge key={idx} variant="outline">{func}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 'regex':
        return (
          <div className="space-y-4">
            <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900 dark:text-gray-100">Regex Pattern:</span>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(output.pattern)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <code className="text-blue-600">{output.pattern}</code>
            </div>
            
            <Alert>
              <AlertDescription>{output.explanation}</AlertDescription>
            </Alert>

            {output.examples && output.examples.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Examples</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {output.examples.map((example, idx) => (
                      <div key={idx} className="text-sm bg-green-50 p-2 rounded">
                        ✓ {example}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )

      case 'sql':
        return (
          <div className="space-y-4">
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900 dark:text-gray-100">SQL Query ({output.query_type}):</span>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(output.query)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <pre className="text-sm text-blue-600 overflow-x-auto whitespace-pre-wrap">{output.query}</pre>
            </div>
            
            <Alert>
              <AlertDescription>{output.explanation}</AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Query Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div><strong>Complexity:</strong> <Badge variant="outline">{output.complexity}</Badge></div>
                    <div><strong>Performance:</strong> <Badge variant="outline">{output.estimated_performance}</Badge></div>
                    <div><strong>Tables:</strong> {output.tables_used.join(', ')}</div>
                  </div>
                </CardContent>
              </Card>

              {output.optimization_tips && output.optimization_tips.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Optimization Tips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm">
                      {output.optimization_tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Lightbulb className="h-3 w-3 text-yellow-600 mt-1 flex-shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {output.alternative_queries && output.alternative_queries.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Alternative Queries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {output.alternative_queries.map((alt, idx) => (
                      <div key={idx} className="border rounded p-3">
                        <p className="text-sm text-gray-600 mb-2">{alt.description}</p>
                        <pre className="text-xs text-blue-600 bg-blue-50 p-2 rounded overflow-x-auto">
                          {alt.query}
                        </pre>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )

      case 'vba':
        return (
          <div className="space-y-4">
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900 dark:text-gray-100">VBA Code:</span>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(output.code)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <pre className="text-sm text-green-600 overflow-x-auto">{output.code}</pre>
            </div>
            
            <Alert>
              <AlertDescription>{output.explanation}</AlertDescription>
            </Alert>
          </div>
        )

      case 'optimization':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-red-600">Original Formula</CardTitle>
                </CardHeader>
                <CardContent>
                  <code className="text-sm bg-red-50 p-2 rounded block">{output.original}</code>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-green-600">Optimized Formula</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <code className="text-sm bg-green-50 p-2 rounded block">{output.optimized}</code>
                    <Button size="sm" onClick={() => copyToClipboard(output.optimized)}>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Performance Gain:</strong> {output.performance_gain}
              </AlertDescription>
            </Alert>

            {output.improvements && output.improvements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Improvements Made</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {output.improvements.map((improvement, idx) => (
                      <li key={idx} className="text-sm flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )

      case 'data_formatting':
        return (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Data Quality Score:</strong> {output.data_quality_score}/100
                {output.data_quality_score >= 80 ? ' - Excellent!' : 
                 output.data_quality_score >= 60 ? ' - Good' : ' - Needs improvement'}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Processing Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div><strong>Original rows:</strong> {output.original_rows}</div>
                    <div><strong>Cleaned rows:</strong> {output.cleaned_rows}</div>
                    <div><strong>Transformations:</strong> {output.transformations_applied.length}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Data Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div><strong>Columns:</strong> {output.preview.summary.columns}</div>
                    <div><strong>Memory:</strong> {output.preview.summary.memory_usage}</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {output.transformations_applied && output.transformations_applied.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Transformations Applied</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm">
                    {output.transformations_applied.map((transformation, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
                        {transformation}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {output.issues_found && output.issues_found.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-orange-600">Issues Found & Fixed</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm">
                    {output.issues_found.map((issue, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <AlertCircle className="h-3 w-3 text-orange-600 mt-1 flex-shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {output.suggestions && output.suggestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm">
                    {output.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Lightbulb className="h-3 w-3 text-blue-600 mt-1 flex-shrink-0" />
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {output.preview && output.preview.head && output.preview.head.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cleaned Data Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          {Object.keys(output.preview.head[0]).map((key) => (
                            <th key={key} className="border border-gray-300 px-2 py-1 text-left font-medium">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {output.preview.head.map((row, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {Object.values(row).map((value, cellIdx) => (
                              <td key={cellIdx} className="border border-gray-300 px-2 py-1">
                                {value?.toString() || ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )

      case 'code_generation':
        return (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{output.language.toUpperCase()} Code Generated</strong> - {output.explanation}
              </AlertDescription>
            </Alert>

            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900 dark:text-gray-100">{output.language.toUpperCase()} Code:</span>
                <div className="flex gap-2">
                  <Badge variant="outline">{output.complexity}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(output.code)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <pre className="text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap bg-white p-3 rounded border">
                {output.code}
              </pre>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {output.setup_instructions && output.setup_instructions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Setup Instructions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-1 text-sm">
                      {output.setup_instructions.map((instruction, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-medium flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          {instruction}
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              )}

              {output.dependencies && output.dependencies.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dependencies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {output.dependencies.map((dep, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Badge variant="outline">{dep}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {output.functions_used && output.functions_used.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Functions & Features Used</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {output.functions_used.map((func, idx) => (
                      <Badge key={idx} variant="outline">{func}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {output.best_practices && output.best_practices.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Best Practices</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm">
                    {output.best_practices.map((practice, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Lightbulb className="h-3 w-3 text-yellow-600 mt-1 flex-shrink-0" />
                        {practice}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )

      case 'pivot_table':
        return (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Pivot Table Structure:</strong> {output.explanation}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pivot Structure</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong>Rows:</strong> 
                      <div className="flex flex-wrap gap-1 mt-1">
                        {output.pivot_structure.rows.map((row, idx) => (
                          <Badge key={idx} variant="outline">{row}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    {output.pivot_structure.columns.length > 0 && (
                      <div>
                        <strong>Columns:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {output.pivot_structure.columns.map((col, idx) => (
                            <Badge key={idx} variant="outline">{col}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <strong>Values:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {output.pivot_structure.values.map((val, idx) => (
                          <Badge key={idx} variant="outline">{val}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <strong>Aggregation:</strong> <Badge variant="outline">{output.pivot_structure.aggregation}</Badge>
                    </div>
                    
                    <div>
                      <strong>Complexity:</strong> <Badge variant="outline">{output.complexity}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {output.insights && output.insights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Analysis Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm">
                      {output.insights.map((insight, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Lightbulb className="h-3 w-3 text-blue-600 mt-1 flex-shrink-0" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Excel Formula</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-green-50 p-3 rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Excel SUMIFS Formula:</span>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard(output.excel_formula)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <code className="text-sm text-green-800">{output.excel_formula}</code>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Python Code</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 p-3 rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Pandas Pivot Table:</span>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard(output.python_code)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <pre className="text-sm text-blue-800 overflow-x-auto">{output.python_code}</pre>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">SQL Equivalent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-purple-50 p-3 rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">SQL GROUP BY Query:</span>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard(output.sql_equivalent)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <pre className="text-sm text-purple-800 overflow-x-auto">{output.sql_equivalent}</pre>
                  </div>
                </CardContent>
              </Card>
            </div>

            {output.alternative_structures && output.alternative_structures.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Alternative Structures</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {output.alternative_structures.map((alt, idx) => (
                      <div key={idx} className="border rounded p-3 bg-gray-50">
                        <h4 className="font-medium mb-2">{alt.description}</h4>
                        <div className="text-sm space-y-1">
                          <div><strong>Rows:</strong> {alt.rows.join(', ')}</div>
                          <div><strong>Values:</strong> {alt.values.join(', ')}</div>
                          <div><strong>Aggregation:</strong> {alt.aggregation}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )

      case 'text_to_excel':
        return (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Text to Excel Conversion:</strong> {output.extraction_method} with {output.confidence_score * 100}% confidence
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Extraction Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div><strong>Headers Found:</strong> {output.headers.length}</div>
                    <div><strong>Data Rows:</strong> {output.structured_data.length}</div>
                    <div><strong>Method:</strong> {output.extraction_method}</div>
                    <div><strong>Confidence:</strong> {Math.round(output.confidence_score * 100)}%</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Data Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    {Object.entries(output.data_types).map(([col, type]) => (
                      <div key={col} className="flex justify-between">
                        <span>{col}:</span>
                        <Badge variant="outline">{type}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {output.preview && output.preview.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Excel Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-blue-50">
                          {output.headers.map((header) => (
                            <th key={header} className="border border-gray-300 px-2 py-1 text-left font-medium">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {output.preview.map((row, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {output.headers.map((header) => (
                              <td key={header} className="border border-gray-300 px-2 py-1">
                                {row[header] || ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {output.suggestions && output.suggestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm">
                    {output.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Lightbulb className="h-3 w-3 text-yellow-600 mt-1 flex-shrink-0" />
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )

      case 'sentiment_analysis':
        return (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Sentiment Analysis:</strong> {output.overall_sentiment.toUpperCase()} with {Math.round(output.confidence_score * 100)}% confidence
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sentiment Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(output.sentiment_scores).map(([sentiment, score]) => (
                      <div key={sentiment} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{sentiment}</span>
                          <span>{Math.round(score * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              sentiment === 'positive' ? 'bg-green-500' :
                              sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-500'
                            }`}
                            style={{ width: `${score * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Emotion Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(output.emotion_breakdown).map(([emotion, intensity]) => (
                      <div key={emotion} className="flex justify-between items-center text-sm">
                        <span className="capitalize">{emotion}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-1">
                            <div 
                              className="h-1 bg-purple-500 rounded-full"
                              style={{ width: `${Math.min(100, intensity * 20)}%` }}
                            />
                          </div>
                          <span className="w-8 text-xs">{intensity.toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {output.key_phrases && output.key_phrases.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Key Phrases</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {output.key_phrases.map((phrase, idx) => (
                      <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                        "{phrase}"
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {output.recommendations && output.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm">
                    {output.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Lightbulb className="h-3 w-3 text-blue-600 mt-1 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )

      case 'text_classification':
        return (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Classification Result:</strong> {output.predicted_category} with {Math.round(output.confidence_score * 100)}% confidence
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Primary Classification</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-2">
                        {output.predicted_category}
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        Confidence: {Math.round(output.confidence_score * 100)}%
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="h-3 bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${output.confidence_score * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 text-center">
                      {output.reasoning}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">All Category Scores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(output.category_scores)
                      .sort(([,a], [,b]) => b - a)
                      .map(([category, score]) => (
                      <div key={category} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{category}</span>
                          <span>{Math.round(score * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className={`h-1 rounded-full ${
                              category === output.predicted_category ? 'bg-blue-500' : 'bg-gray-400'
                            }`}
                            style={{ width: `${score * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {output.alternative_categories && output.alternative_categories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Alternative Classifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {output.alternative_categories.map((alt, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{alt.category}</span>
                        <Badge variant="outline">{Math.round(alt.score * 100)}%</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )

      default:
        return (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {output.message || 'Tool output format not recognized'}
            </AlertDescription>
          </Alert>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Formula Intelligence Hub</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          AI-powered tools for formulas, data processing, and code generation. 
          Transform natural language into powerful Excel formulas, regex patterns, SQL queries, and more.
        </p>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {TOOL_CATEGORIES.map((category) => {
            const IconComponent = category.icon
            return (
              <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                <IconComponent className="h-4 w-4" />
                {category.name}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {TOOL_CATEGORIES.map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-6">
            {/* Tool Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <category.icon className="h-5 w-5" />
                  {category.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.tools.map((tool) => (
                    <Card 
                      key={tool.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        activeTool === tool.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => setActiveTool(tool.id)}
                    >
                      <CardContent className="pt-4">
                        <div>
                          <h3 className="font-medium mb-1">{tool.name}</h3>
                          <p className="text-sm text-gray-600">{tool.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tool Interface */}
            {currentTool && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    {currentTool.name}
                  </CardTitle>
                  <p className="text-sm text-gray-600">{currentTool.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {activeTool === 'explain' ? 'Formula to Explain:' : 
                       activeTool === 'regex' ? 'Describe the Pattern:' :
                       activeTool === 'sql' ? 'Question in Natural Language:' :
                       activeTool === 'vba' ? 'Describe the Macro:' :
                       'Input:'}
                    </label>
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={
                        activeTool === 'explain' ? 'e.g., =VLOOKUP(A2,Sheet2!A:C,3,FALSE)' :
                        activeTool === 'regex' ? 'e.g., Match email addresses in text' :
                        activeTool === 'sql' ? 'e.g., Show me the top 10 customers by revenue' :
                        activeTool === 'vba' ? 'e.g., Create a macro that formats cells based on values' :
                        'Describe what you want to accomplish...'
                      }
                      rows={3}
                    />
                  </div>

                  <Button 
                    onClick={handleToolRun} 
                    disabled={isLoading || !input.trim()}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Run {currentTool.name}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Output */}
            {output && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderOutput()}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* History Sidebar */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.slice(0, 5).map((item) => (
                <div key={item.id} className="text-sm p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                     onClick={() => {
                       setInput(item.input)
                       setOutput(item.output)
                       // Find and set the correct tool
                       const category = TOOL_CATEGORIES.find(cat => 
                         cat.tools.some(tool => tool.id === item.tool)
                       )
                       if (category) {
                         setActiveCategory(category.id)
                         setActiveTool(item.tool)
                       }
                     }}>
                  <div className="font-medium">{item.toolName}</div>
                  <div className="text-gray-600 truncate">{item.input}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
