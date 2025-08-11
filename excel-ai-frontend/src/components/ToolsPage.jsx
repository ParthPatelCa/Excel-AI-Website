import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Calculator, Database, Code, FileText, Type, Search, Download, Copy, History } from 'lucide-react'
import apiService from '@/services/api.js'

export function ToolsPage() {
  const [activeTool, setActiveTool] = useState('excel')
  const [tools, setTools] = useState({})
  const [description, setDescription] = useState('')
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [toolHistory, setToolHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  // Tool-specific states
  const [columns, setColumns] = useState([])
  const [exampleData, setExampleData] = useState([])
  const [tableSchema, setTableSchema] = useState({})
  const [databaseType, setDatabaseType] = useState('mysql')
  const [workbookContext, setWorkbookContext] = useState({})
  const [textData, setTextData] = useState('')
  const [delimiter, setDelimiter] = useState('auto')
  const [testStrings, setTestStrings] = useState([])
  const [newColumn, setNewColumn] = useState('')
  const [newTestString, setNewTestString] = useState('')

  useEffect(() => {
    loadTools()
    loadToolHistory()
  }, [])

  const loadTools = async () => {
    try {
      const response = await apiService.getTools()
      if (response.success) {
        setTools(response.data)
      }
    } catch (error) {
      console.error('Failed to load tools:', error)
    }
  }

  const loadToolHistory = async () => {
    try {
      const response = await apiService.getToolHistory()
      if (response.success) {
        setToolHistory(response.data.items)
      }
    } catch (error) {
      console.error('Failed to load tool history:', error)
    }
  }

  const generateExcelFormula = async () => {
    if (!description.trim()) return

    setIsLoading(true)
    try {
      const response = await apiService.generateExcelFormula({
        description,
        columns,
        example_data: exampleData
      })

      if (response.success) {
        setResult(response.data)
        loadToolHistory() // Refresh history
      }
    } catch (error) {
      console.error('Failed to generate Excel formula:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateSQLQuery = async () => {
    if (!description.trim()) return

    setIsLoading(true)
    try {
      const response = await apiService.generateSQLQuery({
        description,
        table_schema: tableSchema,
        database_type: databaseType
      })

      if (response.success) {
        setResult(response.data)
        loadToolHistory()
      }
    } catch (error) {
      console.error('Failed to generate SQL query:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateVBAScript = async () => {
    if (!description.trim()) return

    setIsLoading(true)
    try {
      const response = await apiService.generateVBAScript({
        description,
        workbook_context: workbookContext
      })

      if (response.success) {
        setResult(response.data)
        loadToolHistory()
      }
    } catch (error) {
      console.error('Failed to generate VBA script:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const convertTextToExcel = async () => {
    if (!textData.trim()) return

    setIsLoading(true)
    try {
      const response = await apiService.convertTextToExcel({
        text: textData,
        delimiter
      })

      if (response.success) {
        setResult(response.data)
        loadToolHistory()
      }
    } catch (error) {
      console.error('Failed to convert text to Excel:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateRegex = async () => {
    if (!description.trim()) return

    setIsLoading(true)
    try {
      const response = await apiService.generateRegex({
        description,
        test_strings: testStrings
      })

      if (response.success) {
        setResult(response.data)
        loadToolHistory()
      }
    } catch (error) {
      console.error('Failed to generate regex:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerate = () => {
    switch (activeTool) {
      case 'excel':
        generateExcelFormula()
        break
      case 'sql':
        generateSQLQuery()
        break
      case 'vba':
        generateVBAScript()
        break
      case 'text_convert':
        convertTextToExcel()
        break
      case 'regex':
        generateRegex()
        break
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  const addColumn = () => {
    if (newColumn.trim() && !columns.includes(newColumn.trim())) {
      setColumns([...columns, newColumn.trim()])
      setNewColumn('')
    }
  }

  const removeColumn = (column) => {
    setColumns(columns.filter(col => col !== column))
  }

  const addTestString = () => {
    if (newTestString.trim() && !testStrings.includes(newTestString.trim())) {
      setTestStrings([...testStrings, newTestString.trim()])
      setNewTestString('')
    }
  }

  const removeTestString = (testString) => {
    setTestStrings(testStrings.filter(str => str !== testString))
  }

  const getToolIcon = (toolKey) => {
    const icons = {
      excel: Calculator,
      sql: Database,
      vba: Code,
      pdf_convert: FileText,
      text_convert: Type,
      regex: Search
    }
    return icons[toolKey] || Calculator
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">More Tools</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Convert your text into Excel formulas, templated spreadsheets, SQL queries, VBA, regex and more.
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Tabs value={activeTool} onValueChange={setActiveTool}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="excel" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Excel
              </TabsTrigger>
              <TabsTrigger value="sql" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                SQL
              </TabsTrigger>
              <TabsTrigger value="vba" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                VBA
              </TabsTrigger>
              <TabsTrigger value="pdf_convert" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                PDF
              </TabsTrigger>
              <TabsTrigger value="text_convert" className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Text
              </TabsTrigger>
              <TabsTrigger value="regex" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Regex
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            History
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Tool Interface */}
          <div className="lg:col-span-2 space-y-6">
            <TabsContent value="excel">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-blue-600" />
                    Excel Formula Generator
                  </CardTitle>
                  <CardDescription>
                    Generate Excel formulas from natural language descriptions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <Textarea
                      placeholder="Describe what you want the formula to do... (e.g., 'sum revenue for west region in 2024')"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Available Columns</label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Add column name..."
                        value={newColumn}
                        onChange={(e) => setNewColumn(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addColumn()}
                      />
                      <Button onClick={addColumn} variant="outline">Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {columns.map((column, index) => (
                        <Badge key={index} variant="secondary" className="cursor-pointer">
                          {column}
                          <button 
                            onClick={() => removeColumn(column)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={handleGenerate} 
                    disabled={!description.trim() || isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Generating Formula...' : 'Generate Excel Formula'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sql">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-green-600" />
                    SQL Query Generator
                  </CardTitle>
                  <CardDescription>
                    Create SQL queries from plain English descriptions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <Textarea
                      placeholder="Describe the query you need... (e.g., 'find all customers who purchased more than $1000 last month')"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Database Type</label>
                    <Select value={databaseType} onValueChange={setDatabaseType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mysql">MySQL</SelectItem>
                        <SelectItem value="postgresql">PostgreSQL</SelectItem>
                        <SelectItem value="sqlite">SQLite</SelectItem>
                        <SelectItem value="sqlserver">SQL Server</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Table Schema (Optional)</label>
                    <Textarea
                      placeholder="Describe your tables and columns... (e.g., 'customers table with id, name, email; orders table with id, customer_id, amount, date')"
                      rows={2}
                    />
                  </div>

                  <Button 
                    onClick={handleGenerate} 
                    disabled={!description.trim() || isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Generating Query...' : 'Generate SQL Query'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vba">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-purple-600" />
                    VBA Script Generator
                  </CardTitle>
                  <CardDescription>
                    Generate VBA scripts for Excel automation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <Textarea
                      placeholder="Describe the automation you need... (e.g., 'create a button that copies data from Sheet1 to Sheet2 and formats it')"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button 
                    onClick={handleGenerate} 
                    disabled={!description.trim() || isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Generating Script...' : 'Generate VBA Script'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pdf_convert">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-red-600" />
                    PDF to Excel Converter
                  </CardTitle>
                  <CardDescription>
                    Extract data from PDF files and convert to Excel
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">PDF Conversion Coming Soon</h3>
                    <p className="text-gray-600 mb-4">
                      This feature is currently under development. For now, please convert your PDFs manually or use Excel's built-in data import features.
                    </p>
                    <Button disabled>
                      Upload PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="text_convert">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="h-5 w-5 text-orange-600" />
                    Text to Excel Converter
                  </CardTitle>
                  <CardDescription>
                    Convert structured text data to Excel format
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Text Data</label>
                    <Textarea
                      placeholder="Paste your structured text here... (e.g., CSV data, table data, etc.)"
                      value={textData}
                      onChange={(e) => setTextData(e.target.value)}
                      rows={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Delimiter</label>
                    <Select value={delimiter} onValueChange={setDelimiter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto-detect</SelectItem>
                        <SelectItem value=",">Comma (,)</SelectItem>
                        <SelectItem value="\t">Tab</SelectItem>
                        <SelectItem value=";">Semicolon (;)</SelectItem>
                        <SelectItem value="|">Pipe (|)</SelectItem>
                        <SelectItem value=" ">Space</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleGenerate} 
                    disabled={!textData.trim() || isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Converting...' : 'Convert to Excel'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="regex">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-indigo-600" />
                    Regex Generator
                  </CardTitle>
                  <CardDescription>
                    Generate regex patterns from descriptions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <Textarea
                      placeholder="Describe what you want to match... (e.g., 'email addresses', 'phone numbers', 'dates in MM/DD/YYYY format')"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Test Strings</label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Add test string..."
                        value={newTestString}
                        onChange={(e) => setNewTestString(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTestString()}
                      />
                      <Button onClick={addTestString} variant="outline">Add</Button>
                    </div>
                    <div className="space-y-2">
                      {testStrings.map((testString, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <code className="text-sm">{testString}</code>
                          <button 
                            onClick={() => removeTestString(testString)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={handleGenerate} 
                    disabled={!description.trim() || isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Generating Pattern...' : 'Generate Regex'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Results */}
            {result && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Generated Result
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(result.formula || result.query || result.script || result.pattern || '')}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Formula/Query/Script Display */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {activeTool === 'excel' ? 'Formula' : 
                       activeTool === 'sql' ? 'Query' : 
                       activeTool === 'vba' ? 'Script' :
                       activeTool === 'regex' ? 'Pattern' : 'Result'}
                    </label>
                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                      <pre>{result.formula || result.query || result.script || result.pattern || JSON.stringify(result, null, 2)}</pre>
                    </div>
                  </div>

                  {/* Explanation */}
                  {result.explanation && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Explanation</label>
                      <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">{result.explanation}</p>
                    </div>
                  )}

                  {/* Examples/Variants */}
                  {result.examples && result.examples.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Examples</label>
                      <div className="space-y-2">
                        {result.examples.map((example, index) => (
                          <div key={index} className="bg-gray-50 p-2 rounded text-sm font-mono">
                            {example}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Test Results for Regex */}
                  {result.test_results && result.test_results.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Test Results</label>
                      <div className="space-y-2">
                        {result.test_results.map((test, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <code className="text-sm">{test.string}</code>
                            <Badge variant={test.matches ? 'default' : 'secondary'}>
                              {test.matches ? 'Match' : 'No Match'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Converted Data for Text Convert */}
                  {result.excel_data && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Converted Data Preview</label>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse border border-gray-200 text-sm">
                          <thead>
                            <tr>
                              {result.columns.map(header => (
                                <th key={header} className="border border-gray-200 p-2 bg-gray-50 text-left">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.excel_data.slice(0, 5).map((row, index) => (
                              <tr key={index}>
                                {result.columns.map(col => (
                                  <td key={col} className="border border-gray-200 p-2">
                                    {row[col]}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        Showing first 5 rows of {result.rows_processed} total rows
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Tool Categories & History Sidebar */}
          <div className="space-y-6">
            {/* Tool Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(tools).map(([key, tool]) => {
                    const IconComponent = getToolIcon(key)
                    return (
                      <div
                        key={key}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          activeTool === key ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setActiveTool(key)}
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="font-medium text-sm">{tool.name}</div>
                            <div className="text-xs text-gray-600">{tool.description}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent History */}
            {showHistory && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Generation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {toolHistory.map(item => (
                      <div key={item.id} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {item.tool_type}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{item.input_description}</p>
                      </div>
                    ))}
                  </div>

                  {toolHistory.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No history yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
