import { useState } from 'react'
import { Code, Download, Play, Copy, FileText, Terminal, Zap, BookOpen, Settings, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Switch } from '@/components/ui/switch.jsx'
import { LoadingSpinner } from '@/components/ui/alerts.jsx'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'

const MACRO_TYPES = [
  {
    id: 'vba',
    name: 'VBA (Excel)',
    description: 'Visual Basic for Applications macros for Excel',
    icon: FileText,
    color: 'green',
    fileExtension: '.vba'
  },
  {
    id: 'python',
    name: 'Python Script',
    description: 'Python automation scripts with pandas/openpyxl',
    icon: Terminal,
    color: 'blue',
    fileExtension: '.py'
  },
  {
    id: 'google_apps_script',
    name: 'Google Apps Script',
    description: 'JavaScript automation for Google Sheets',
    icon: Zap,
    color: 'orange',
    fileExtension: '.gs'
  }
]

const PRESET_TASKS = [
  {
    id: 'data_cleaning',
    name: 'Data Cleaning',
    description: 'Remove duplicates, handle missing values, standardize formats',
    example: 'Clean customer data by removing duplicates and standardizing phone numbers'
  },
  {
    id: 'report_generation',
    name: 'Report Generation',
    description: 'Create formatted reports with charts and summaries',
    example: 'Generate monthly sales report with pivot tables and charts'
  },
  {
    id: 'data_import_export',
    name: 'Data Import/Export',
    description: 'Automate data transfer between systems',
    example: 'Import CSV files and export filtered results to PDF'
  },
  {
    id: 'calculations',
    name: 'Complex Calculations',
    description: 'Perform advanced mathematical operations',
    example: 'Calculate compound interest and loan amortization schedules'
  },
  {
    id: 'formatting',
    name: 'Conditional Formatting',
    description: 'Apply dynamic formatting based on conditions',
    example: 'Highlight cells based on performance thresholds'
  },
  {
    id: 'email_automation',
    name: 'Email Automation',
    description: 'Send automated emails with attachments',
    example: 'Send weekly reports to stakeholders automatically'
  }
]

export function MacroGenerator() {
  const [selectedType, setSelectedType] = useState('vba')
  const [selectedTask, setSelectedTask] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [includeComments, setIncludeComments] = useState(true)
  const [includeErrorHandling, setIncludeErrorHandling] = useState(true)
  const [optimizePerformance, setOptimizePerformance] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [codeExplanation, setCodeExplanation] = useState('')
  const [error, setError] = useState(null)

  const [additionalOptions, setAdditionalOptions] = useState({
    workbook_name: '',
    worksheet_name: '',
    data_range: '',
    output_format: 'xlsx'
  })

  const handleTaskSelect = (taskId) => {
    setSelectedTask(taskId)
    const task = PRESET_TASKS.find(t => t.id === taskId)
    if (task) {
      setTaskDescription(task.example)
    }
  }

  const generateMacro = async () => {
    if (!taskDescription.trim()) {
      setError('Please provide a task description')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const requestData = {
        macro_type: selectedType,
        task_description: taskDescription,
        preset_task: selectedTask,
        options: {
          include_comments: includeComments,
          include_error_handling: includeErrorHandling,
          optimize_performance: optimizePerformance,
          ...additionalOptions
        }
      }

      const response = await fetch('/api/v1/features/macro-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(requestData)
      })

      const result = await response.json()

      if (result.success) {
        setGeneratedCode(result.generated_code)
        setCodeExplanation(result.explanation)
      } else {
        throw new Error(result.error || 'Failed to generate macro')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode)
    // You could add a toast notification here
  }

  const downloadCode = () => {
    const selectedMacroType = MACRO_TYPES.find(t => t.id === selectedType)
    const filename = `generated_macro${selectedMacroType?.fileExtension || '.txt'}`
    
    const blob = new Blob([generatedCode], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getSyntaxLanguage = () => {
    switch (selectedType) {
      case 'vba': return 'vbnet'
      case 'python': return 'python'
      case 'google_apps_script': return 'javascript'
      default: return 'text'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Macro Generator</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Generate automation scripts for Excel, Google Sheets, and Python to streamline your workflows
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* Macro Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="h-5 w-5 mr-2" />
                Choose Macro Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MACRO_TYPES.map((type) => (
                  <div
                    key={type.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedType === type.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedType(type.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-${type.color}-100`}>
                        <type.icon className={`h-5 w-5 text-${type.color}-600`} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{type.name}</h3>
                        <p className="text-sm text-gray-600">{type.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Task Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Task Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preset Tasks */}
              <div className="space-y-2">
                <Label>Common Tasks</Label>
                <Select value={selectedTask} onValueChange={handleTaskSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a preset task or describe your own" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Custom Task</SelectItem>
                    {PRESET_TASKS.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Task Description */}
              <div className="space-y-2">
                <Label htmlFor="task-description">Task Description</Label>
                <Textarea
                  id="task-description"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Describe what you want the macro to do..."
                  rows={4}
                />
              </div>

              {/* Additional Options */}
              <div className="space-y-4">
                <h4 className="font-semibold">Additional Options</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="workbook">Workbook Name</Label>
                    <Input
                      id="workbook"
                      value={additionalOptions.workbook_name}
                      onChange={(e) => setAdditionalOptions(prev => ({ ...prev, workbook_name: e.target.value }))}
                      placeholder="MyWorkbook.xlsx"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="worksheet">Worksheet Name</Label>
                    <Input
                      id="worksheet"
                      value={additionalOptions.worksheet_name}
                      onChange={(e) => setAdditionalOptions(prev => ({ ...prev, worksheet_name: e.target.value }))}
                      placeholder="Sheet1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data-range">Data Range</Label>
                  <Input
                    id="data-range"
                    value={additionalOptions.data_range}
                    onChange={(e) => setAdditionalOptions(prev => ({ ...prev, data_range: e.target.value }))}
                    placeholder="A1:Z100"
                  />
                </div>
              </div>

              {/* Code Options */}
              <div className="space-y-4">
                <h4 className="font-semibold">Code Options</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="comments">Include Comments</Label>
                    <Switch
                      id="comments"
                      checked={includeComments}
                      onCheckedChange={setIncludeComments}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="error-handling">Include Error Handling</Label>
                    <Switch
                      id="error-handling"
                      checked={includeErrorHandling}
                      onCheckedChange={setIncludeErrorHandling}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="optimize">Optimize Performance</Label>
                    <Switch
                      id="optimize"
                      checked={optimizePerformance}
                      onCheckedChange={setOptimizePerformance}
                    />
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <Button 
                onClick={generateMacro} 
                disabled={isLoading || !taskDescription.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate Macro
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-red-700">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Generated Code */}
          {generatedCode && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Generated Code</CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadCode}>
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {MACRO_TYPES.find(t => t.id === selectedType)?.name} code for your task
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="code" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="code">Code</TabsTrigger>
                    <TabsTrigger value="explanation">Explanation</TabsTrigger>
                  </TabsList>

                  <TabsContent value="code" className="space-y-4">
                    <div className="relative">
                      <SyntaxHighlighter
                        language={getSyntaxLanguage()}
                        style={tomorrow}
                        className="rounded-lg"
                        customStyle={{
                          margin: 0,
                          maxHeight: '500px',
                          fontSize: '14px'
                        }}
                      >
                        {generatedCode}
                      </SyntaxHighlighter>
                    </div>
                  </TabsContent>

                  <TabsContent value="explanation" className="space-y-4">
                    <div className="prose prose-sm max-w-none">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">How this code works:</h4>
                        <div className="text-sm text-gray-700 whitespace-pre-line">
                          {codeExplanation}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Usage Instructions */}
          {generatedCode && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Usage Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {selectedType === 'vba' && (
                    <div>
                      <h4 className="font-semibold">For VBA (Excel):</h4>
                      <ol className="list-decimal list-inside space-y-1 text-gray-600">
                        <li>Open Excel and press Alt + F11 to open VBA editor</li>
                        <li>Insert a new module (Insert → Module)</li>
                        <li>Paste the generated code into the module</li>
                        <li>Close VBA editor and run the macro (Alt + F8)</li>
                      </ol>
                    </div>
                  )}

                  {selectedType === 'python' && (
                    <div>
                      <h4 className="font-semibold">For Python Script:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-gray-600">
                        <li>Save the code to a .py file</li>
                        <li>Install required libraries: pip install pandas openpyxl</li>
                        <li>Run the script: python your_script.py</li>
                        <li>Make sure Excel files are in the correct path</li>
                      </ol>
                    </div>
                  )}

                  {selectedType === 'google_apps_script' && (
                    <div>
                      <h4 className="font-semibold">For Google Apps Script:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-gray-600">
                        <li>Open Google Sheets and go to Extensions → Apps Script</li>
                        <li>Replace the default code with the generated code</li>
                        <li>Save the project and authorize permissions</li>
                        <li>Run the function from the Apps Script editor</li>
                      </ol>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          {!generatedCode && !isLoading && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Tips for Better Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Be specific about what data you're working with</li>
                  <li>• Mention column names and data types if known</li>
                  <li>• Describe the expected output format</li>
                  <li>• Include any special requirements or constraints</li>
                  <li>• Test generated code in a safe environment first</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
