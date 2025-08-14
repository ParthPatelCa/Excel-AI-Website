import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { FormulaIntelligenceHub } from '@/components/FormulaIntelligenceHub.jsx'
import { 
  Brain, Zap, TrendingUp, Users, Star, ArrowRight, 
  Calculator, Code2, Database, FileText, Regex, 
  Settings, Lightbulb, Target, Clock
} from 'lucide-react'

const FEATURED_TOOLS = [
  {
    id: 'formula-explainer',
    name: 'Formula Explainer',
    description: 'Understand any Excel formula in plain English',
    icon: Calculator,
    category: 'Formula Tools',
    difficulty: 'Beginner',
    popularity: 98,
    timeToComplete: '30 seconds',
    features: ['Step-by-step breakdown', 'Function explanations', 'Best practices'],
    color: 'blue'
  },
  {
    id: 'regex-generator',
    name: 'Regex Generator',
    description: 'Create regex patterns from natural language',
    icon: Regex,
    category: 'Text Tools',
    difficulty: 'Intermediate',
    popularity: 89,
    timeToComplete: '1 minute',
    features: ['Pattern testing', 'Examples included', 'Multiple formats'],
    color: 'green'
  },
  {
    id: 'sql-builder',
    name: 'SQL Query Builder',
    description: 'Convert questions to SQL queries',
    icon: Database,
    category: 'Data Tools',
    difficulty: 'Intermediate',
    popularity: 92,
    timeToComplete: '45 seconds',
    features: ['Natural language input', 'Query optimization', 'Multiple databases'],
    color: 'purple'
  },
  {
    id: 'vba-generator',
    name: 'VBA Generator',
    description: 'Create Excel macros from descriptions',
    icon: Code2,
    category: 'Automation',
    difficulty: 'Advanced',
    popularity: 85,
    timeToComplete: '2 minutes',
    features: ['Complete macros', 'Installation guide', 'Error handling'],
    color: 'orange'
  },
  {
    id: 'formula-optimizer',
    name: 'Formula Optimizer',
    description: 'Make your formulas faster and more efficient',
    icon: Settings,
    category: 'Performance',
    difficulty: 'Intermediate',
    popularity: 87,
    timeToComplete: '1 minute',
    features: ['Performance analysis', 'Optimization suggestions', 'Before/after comparison'],
    color: 'red'
  },
  {
    id: 'text-extractor',
    name: 'Text Extractor',
    description: 'Extract patterns from text using AI',
    icon: FileText,
    category: 'Text Tools',
    difficulty: 'Beginner',
    popularity: 83,
    timeToComplete: '45 seconds',
    features: ['Pattern recognition', 'Batch processing', 'Multiple formats'],
    color: 'teal'
  }
]

const TOOL_CATEGORIES = [
  { 
    id: 'formula', 
    name: 'Formula Tools', 
    icon: Calculator, 
    count: 4,
    description: 'Excel and Google Sheets formula assistance'
  },
  { 
    id: 'text', 
    name: 'Text & Patterns', 
    icon: FileText, 
    count: 4,
    description: 'Text processing and pattern matching'
  },
  { 
    id: 'data', 
    name: 'Data Tools', 
    icon: Database, 
    count: 4,
    description: 'SQL, pivot tables, and data manipulation'
  },
  { 
    id: 'code', 
    name: 'Code Generation', 
    icon: Code2, 
    count: 4,
    description: 'VBA, Python, and JavaScript automation'
  }
]

const USAGE_STATS = [
  { label: 'Tools Available', value: '16', icon: Zap },
  { label: 'Monthly Users', value: '25K+', icon: Users },
  { label: 'Success Rate', value: '94%', icon: TrendingUp },
  { label: 'Avg Rating', value: '4.8', icon: Star }
]

export function AIToolsPage() {
  const [selectedTool, setSelectedTool] = useState(null)
  const [activeView, setActiveView] = useState('overview')

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getToolColor = (color) => {
    const colors = {
      blue: 'border-blue-200 bg-blue-50',
      green: 'border-green-200 bg-green-50',
      purple: 'border-purple-200 bg-purple-50',
      orange: 'border-orange-200 bg-orange-50',
      red: 'border-red-200 bg-red-50',
      teal: 'border-teal-200 bg-teal-50'
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">AI-Powered Tools</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Transform your productivity with our comprehensive suite of AI tools. 
          From formula explanations to code generation, we've got everything you need.
        </p>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tools">All Tools</TabsTrigger>
          <TabsTrigger value="hub">Intelligence Hub</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {/* Usage Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {USAGE_STATS.map((stat, idx) => {
              const IconComponent = stat.icon
              return (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-8 w-8 text-blue-600" />
                      <div>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-sm text-gray-600">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Featured Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Featured Tools
              </CardTitle>
              <p className="text-sm text-gray-600">
                Most popular and powerful AI tools to boost your productivity
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {FEATURED_TOOLS.map((tool) => {
                  const IconComponent = tool.icon
                  return (
                    <Card 
                      key={tool.id} 
                      className={`hover:shadow-lg transition-all cursor-pointer ${getToolColor(tool.color)}`}
                      onClick={() => setActiveView('hub')}
                    >
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <IconComponent className="h-8 w-8 text-gray-700" />
                            <Badge className={getDifficultyColor(tool.difficulty)}>
                              {tool.difficulty}
                            </Badge>
                          </div>
                          
                          <div>
                            <h3 className="font-semibold mb-2">{tool.name}</h3>
                            <p className="text-sm text-gray-600 mb-3">{tool.description}</p>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3" />
                                  {tool.popularity}% popularity
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {tool.timeToComplete}
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-1">
                                {tool.features.slice(0, 2).map((feature, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                                {tool.features.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{tool.features.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <Button size="sm" className="w-full">
                            <ArrowRight className="h-3 w-3 mr-1" />
                            Try Now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Tool Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Tool Categories
              </CardTitle>
              <p className="text-sm text-gray-600">
                Explore tools organized by functionality and use case
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {TOOL_CATEGORIES.map((category) => {
                  const IconComponent = category.icon
                  return (
                    <Card 
                      key={category.id} 
                      className="hover:shadow-md transition-all cursor-pointer"
                      onClick={() => setActiveView('hub')}
                    >
                      <CardContent className="pt-6">
                        <div className="text-center space-y-3">
                          <IconComponent className="h-12 w-12 text-blue-600 mx-auto" />
                          <div>
                            <h3 className="font-semibold">{category.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                          </div>
                          <Badge variant="outline">{category.count} tools</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Getting Started */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Lightbulb className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Ready to Get Started?</h3>
                  <p className="text-gray-600 mb-4">
                    Jump into our Intelligence Hub and start using AI tools to transform your workflow
                  </p>
                  <Button onClick={() => setActiveView('hub')} size="lg">
                    <Brain className="h-4 w-4 mr-2" />
                    Open Intelligence Hub
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All AI Tools</CardTitle>
              <p className="text-sm text-gray-600">
                Complete list of available AI-powered tools with detailed information
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {FEATURED_TOOLS.map((tool) => {
                  const IconComponent = tool.icon
                  return (
                    <Card key={tool.id} className="hover:shadow-md transition-all">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <IconComponent className="h-6 w-6 text-gray-700" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold">{tool.name}</h3>
                                <p className="text-sm text-gray-600">{tool.description}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getDifficultyColor(tool.difficulty)}>
                                  {tool.difficulty}
                                </Badge>
                                <Badge variant="outline">{tool.category}</Badge>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-6 text-sm text-gray-500 mb-3">
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {tool.popularity}% popularity
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {tool.timeToComplete}
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex flex-wrap gap-1">
                                {tool.features.map((feature, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                              <Button size="sm" onClick={() => setActiveView('hub')}>
                                Try Tool
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hub" className="space-y-6">
          <FormulaIntelligenceHub />
        </TabsContent>
      </Tabs>
    </div>
  )
}
