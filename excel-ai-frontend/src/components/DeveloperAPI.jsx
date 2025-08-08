import { useState, useEffect } from 'react'
import { Key, Code, Copy, Eye, EyeOff, RefreshCw, FileText, Terminal, Globe, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Switch } from '@/components/ui/switch.jsx'
import { LoadingSpinner } from '@/components/ui/alerts.jsx'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'

const API_ENDPOINTS = [
  {
    method: 'POST',
    path: '/api/v1/excel/analyze',
    description: 'Analyze uploaded Excel/CSV files',
    category: 'Data Analysis'
  },
  {
    method: 'POST',
    path: '/api/v1/excel/query',
    description: 'Query data using natural language',
    category: 'Data Analysis'
  },
  {
    method: 'POST',
    path: '/api/v1/formula/generate',
    description: 'Generate Excel formulas from descriptions',
    category: 'Formula Intelligence'
  },
  {
    method: 'POST',
    path: '/api/v1/formula/explain',
    description: 'Explain existing Excel formulas',
    category: 'Formula Intelligence'
  },
  {
    method: 'POST',
    path: '/api/v1/formula/debug',
    description: 'Debug broken Excel formulas',
    category: 'Formula Intelligence'
  },
  {
    method: 'GET',
    path: '/api/v1/formula/history',
    description: 'Get formula interaction history',
    category: 'Formula Intelligence'
  },
  {
    method: 'POST',
    path: '/api/v1/features/data-cleaning',
    description: 'Clean and validate data automatically',
    category: 'Advanced Features'
  },
  {
    method: 'POST',
    path: '/api/v1/features/chart-builder',
    description: 'Generate charts with AI recommendations',
    category: 'Advanced Features'
  },
  {
    method: 'POST',
    path: '/api/v1/features/predictive-analytics',
    description: 'Run predictive analysis and forecasting',
    category: 'Advanced Features'
  },
  {
    method: 'POST',
    path: '/api/v1/features/macro-generation',
    description: 'Generate automation macros and scripts',
    category: 'Advanced Features'
  },
  {
    method: 'GET',
    path: '/api/v1/telemetry/metrics',
    description: 'Get usage metrics and analytics',
    category: 'Analytics'
  }
]

const CODE_EXAMPLES = {
  javascript: {
    name: 'JavaScript (Node.js)',
    example: `// Initialize DataSense AI client
const DataSenseAI = require('datasense-ai-sdk');

const client = new DataSenseAI({
  apiKey: 'your_api_key_here',
  baseURL: 'https://api.datasense.ai'
});

// Analyze Excel file
async function analyzeData() {
  try {
    const result = await client.analyzeFile({
      file: './sales_data.xlsx',
      includeInsights: true
    });
    
    console.log('Analysis complete:', result.insights);
    return result;
  } catch (error) {
    console.error('Analysis failed:', error);
  }
}

// Generate Excel formula
async function generateFormula() {
  const formula = await client.generateFormula({
    description: 'Sum revenue for Q4 2024',
    columns: ['Date', 'Revenue', 'Quarter'],
    platform: 'excel'
  });
  
  console.log('Generated formula:', formula.primary_formula);
  return formula;
}`
  },
  python: {
    name: 'Python',
    example: `import requests
import json

class DataSenseAI:
    def __init__(self, api_key, base_url="https://api.datasense.ai"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def analyze_file(self, file_path, include_insights=True):
        """Analyze an Excel or CSV file"""
        with open(file_path, 'rb') as f:
            files = {'file': f}
            response = requests.post(
                f"{self.base_url}/api/v1/excel/analyze",
                files=files,
                headers={"Authorization": f"Bearer {self.api_key}"}
            )
        return response.json()
    
    def generate_formula(self, description, columns, platform="excel"):
        """Generate Excel formula from description"""
        data = {
            "description": description,
            "columns": columns,
            "platform": platform
        }
        response = requests.post(
            f"{self.base_url}/api/v1/formula/generate",
            headers=self.headers,
            json=data
        )
        return response.json()

# Usage example
client = DataSenseAI('your_api_key_here')

# Analyze data
result = client.analyze_file('./sales_data.xlsx')
print(f"Found {len(result['insights'])} insights")

# Generate formula
formula = client.generate_formula(
    "Calculate average revenue per customer",
    ["Customer", "Revenue", "Orders"]
)
print(f"Formula: {formula['data']['primary_formula']}")`
  },
  curl: {
    name: 'cURL',
    example: `# Analyze Excel file
curl -X POST https://api.datasense.ai/api/v1/excel/analyze \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@sales_data.xlsx"

# Generate formula
curl -X POST https://api.datasense.ai/api/v1/formula/generate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "description": "Sum revenue for west region in 2024",
    "columns": ["Region", "Revenue", "Date"],
    "platform": "excel"
  }'

# Query data with natural language
curl -X POST https://api.datasense.ai/api/v1/excel/query \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "What was the total revenue last quarter?",
    "data": [...] // Your data array
  }'

# Get usage metrics
curl -X GET https://api.datasense.ai/api/v1/telemetry/metrics \\
  -H "Authorization: Bearer YOUR_API_KEY"`
  }
}

export function DeveloperAPI() {
  const [apiKeys, setApiKeys] = useState([])
  const [newKeyName, setNewKeyName] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('javascript')
  const [showApiKey, setShowApiKey] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [selectedEndpoint, setSelectedEndpoint] = useState(API_ENDPOINTS[0])

  useEffect(() => {
    loadApiKeys()
  }, [])

  const loadApiKeys = async () => {
    try {
      // Simulated API call - replace with actual implementation
      setApiKeys([
        {
          id: 1,
          name: 'Production API Key',
          key: 'dsa_pk_1234567890abcdef1234567890abcdef',
          created_at: '2024-01-15T10:30:00Z',
          last_used: '2024-01-20T14:22:00Z',
          calls_this_month: 1250,
          status: 'active'
        },
        {
          id: 2,
          name: 'Development Key',
          key: 'dsa_dk_abcdef1234567890abcdef1234567890',
          created_at: '2024-01-10T09:15:00Z',
          last_used: '2024-01-19T16:45:00Z',
          calls_this_month: 320,
          status: 'active'
        }
      ])
    } catch (error) {
      console.error('Failed to load API keys:', error)
    }
  }

  const generateApiKey = async () => {
    if (!newKeyName.trim()) return

    setIsLoading(true)
    try {
      // Simulated API call - replace with actual implementation
      const newKey = {
        id: Date.now(),
        name: newKeyName,
        key: `dsa_pk_${Math.random().toString(36).substr(2, 32)}`,
        created_at: new Date().toISOString(),
        last_used: null,
        calls_this_month: 0,
        status: 'active'
      }
      
      setApiKeys([...apiKeys, newKey])
      setNewKeyName('')
    } catch (error) {
      console.error('Failed to generate API key:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const revokeApiKey = async (keyId) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return
    }

    setApiKeys(apiKeys.filter(key => key.id !== keyId))
  }

  const toggleKeyVisibility = (keyId) => {
    setShowApiKey(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }))
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  const formatApiKey = (key, show) => {
    if (show) return key
    return key.substring(0, 12) + '••••••••••••••••••••'
  }

  const getMethodColor = (method) => {
    switch (method) {
      case 'GET': return 'bg-blue-100 text-blue-800'
      case 'POST': return 'bg-green-100 text-green-800'
      case 'PUT': return 'bg-yellow-100 text-yellow-800'
      case 'DELETE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Developer API</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Integrate DataSense AI into your applications with our powerful REST API
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* API Management */}
        <div className="lg:col-span-1 space-y-6">
          {/* API Keys */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2" />
                API Keys
              </CardTitle>
              <CardDescription>
                Manage your API keys for authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Create New Key */}
              <div className="space-y-2">
                <Label htmlFor="key-name">Key Name</Label>
                <div className="flex space-x-2">
                  <Input
                    id="key-name"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Production API Key"
                  />
                  <Button 
                    onClick={generateApiKey}
                    disabled={isLoading || !newKeyName.trim()}
                    size="sm"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      'Generate'
                    )}
                  </Button>
                </div>
              </div>

              {/* Existing Keys */}
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div key={key.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm">{key.name}</h4>
                      <Badge variant={key.status === 'active' ? 'default' : 'secondary'}>
                        {key.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1">
                          {formatApiKey(key.key, showApiKey[key.id])}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleKeyVisibility(key.id)}
                        >
                          {showApiKey[key.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(key.key)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        <div>Calls this month: {key.calls_this_month}</div>
                        <div>Last used: {key.last_used ? new Date(key.last_used).toLocaleDateString() : 'Never'}</div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeApiKey(key.id)}
                        className="w-full text-red-600 hover:text-red-700"
                      >
                        Revoke Key
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>API Usage This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Calls</span>
                  <span className="font-semibold">1,570</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Success Rate</span>
                  <span className="font-semibold text-green-600">99.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Latency</span>
                  <span className="font-semibold">245ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Quota Used</span>
                  <span className="font-semibold">31.4%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documentation */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="endpoints" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
              <TabsTrigger value="examples">Code Examples</TabsTrigger>
              <TabsTrigger value="testing">API Testing</TabsTrigger>
            </TabsList>

            <TabsContent value="endpoints" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Available Endpoints</CardTitle>
                  <CardDescription>
                    Complete list of DataSense AI API endpoints
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(
                      API_ENDPOINTS.reduce((acc, endpoint) => {
                        if (!acc[endpoint.category]) acc[endpoint.category] = []
                        acc[endpoint.category].push(endpoint)
                        return acc
                      }, {})
                    ).map(([category, endpoints]) => (
                      <div key={category}>
                        <h4 className="font-semibold text-lg mb-2">{category}</h4>
                        <div className="space-y-2">
                          {endpoints.map((endpoint, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                              onClick={() => setSelectedEndpoint(endpoint)}
                            >
                              <div className="flex items-center space-x-3">
                                <Badge className={getMethodColor(endpoint.method)}>
                                  {endpoint.method}
                                </Badge>
                                <code className="text-sm">{endpoint.path}</code>
                              </div>
                              <p className="text-sm text-gray-600">{endpoint.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="examples" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Code Examples</CardTitle>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="javascript">JavaScript (Node.js)</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="curl">cURL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <CardDescription>
                    Get started with these working examples
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 z-10"
                      onClick={() => copyToClipboard(CODE_EXAMPLES[selectedLanguage].example)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <SyntaxHighlighter
                      language={selectedLanguage === 'curl' ? 'bash' : selectedLanguage}
                      style={tomorrow}
                      className="rounded-lg"
                      customStyle={{
                        margin: 0,
                        paddingTop: '3rem'
                      }}
                    >
                      {CODE_EXAMPLES[selectedLanguage].example}
                    </SyntaxHighlighter>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="testing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Terminal className="h-5 w-5 mr-2" />
                    API Testing
                  </CardTitle>
                  <CardDescription>
                    Test API endpoints directly from the browser
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Endpoint Selection */}
                  <div className="space-y-2">
                    <Label>Select Endpoint</Label>
                    <Select 
                      value={selectedEndpoint.path} 
                      onValueChange={(path) => setSelectedEndpoint(API_ENDPOINTS.find(e => e.path === path))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {API_ENDPOINTS.map((endpoint) => (
                          <SelectItem key={endpoint.path} value={endpoint.path}>
                            {endpoint.method} {endpoint.path}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Request Body */}
                  {selectedEndpoint.method === 'POST' && (
                    <div className="space-y-2">
                      <Label>Request Body (JSON)</Label>
                      <Textarea
                        placeholder={'{\n  "description": "Sum revenue for Q4",\n  "columns": ["Date", "Revenue"],\n  "platform": "excel"\n}'}
                        rows={6}
                        className="font-mono text-sm"
                      />
                    </div>
                  )}

                  {/* Headers */}
                  <div className="space-y-2">
                    <Label>Headers</Label>
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <Input value="Authorization" disabled className="flex-1" />
                        <Input placeholder="Bearer your_api_key_here" className="flex-2" />
                      </div>
                      <div className="flex space-x-2">
                        <Input value="Content-Type" disabled className="flex-1" />
                        <Input value="application/json" disabled className="flex-2" />
                      </div>
                    </div>
                  </div>

                  {/* Send Request Button */}
                  <Button className="w-full">
                    <Terminal className="h-4 w-4 mr-2" />
                    Send Request
                  </Button>

                  {/* Response Area */}
                  <div className="space-y-2">
                    <Label>Response</Label>
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Response will appear here after sending a request</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
