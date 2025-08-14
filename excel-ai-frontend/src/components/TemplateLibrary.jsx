import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { 
  BookOpen, TrendingUp, PieChart, Users, DollarSign, Calendar, 
  Download, Play, Star, Search, Filter, Plus, Settings
} from 'lucide-react'
import { useToast } from '@/hooks/useToast.js'

const TEMPLATE_CATEGORIES = {
  sales: {
    name: 'Sales & Marketing',
    icon: TrendingUp,
    color: 'blue'
  },
  finance: {
    name: 'Finance & Accounting', 
    icon: DollarSign,
    color: 'green'
  },
  hr: {
    name: 'Human Resources',
    icon: Users,
    color: 'purple'
  },
  operations: {
    name: 'Operations',
    icon: Settings,
    color: 'orange'
  },
  analytics: {
    name: 'Analytics & Insights',
    icon: PieChart,
    color: 'indigo'
  }
}

const PREDEFINED_TEMPLATES = [
  {
    id: 'sales_performance',
    title: 'Sales Performance Dashboard',
    description: 'Comprehensive sales metrics including revenue trends, conversion rates, and team performance',
    category: 'sales',
    difficulty: 'beginner',
    estimatedTime: '5-10 min',
    popularity: 95,
    requiredColumns: ['sales_amount', 'date', 'salesperson', 'region'],
    optionalColumns: ['product', 'customer_type', 'lead_source'],
    analyses: [
      'Monthly revenue trends',
      'Top performing salespeople',
      'Regional performance comparison',
      'Product mix analysis',
      'Conversion rate by source'
    ],
    formulas: [
      'Monthly growth rate calculation',
      'Running total formulas',
      'Ranking functions',
      'Conditional formatting rules'
    ],
    visualizations: [
      'Revenue trend line chart',
      'Sales by region pie chart',
      'Performance leaderboard',
      'Monthly comparison bar chart'
    ]
  },
  {
    id: 'financial_dashboard',
    title: 'Financial KPI Dashboard',
    description: 'Track key financial metrics including cash flow, profitability, and budget variance',
    category: 'finance',
    difficulty: 'intermediate',
    estimatedTime: '10-15 min',
    popularity: 87,
    requiredColumns: ['amount', 'category', 'date', 'type'],
    optionalColumns: ['budget', 'department', 'vendor'],
    analyses: [
      'Cash flow analysis',
      'Budget vs actual variance',
      'Expense categorization',
      'Profitability trends',
      'Cost center analysis'
    ],
    formulas: [
      'Variance calculations',
      'Percentage growth formulas',
      'Cumulative totals',
      'Budget deviation alerts'
    ],
    visualizations: [
      'Cash flow waterfall chart',
      'Budget variance dashboard',
      'Expense breakdown pie chart',
      'Trend analysis line graphs'
    ]
  },
  {
    id: 'hr_analytics',
    title: 'HR Analytics Dashboard',
    description: 'Employee metrics including turnover, performance, and diversity analytics',
    category: 'hr',
    difficulty: 'beginner',
    estimatedTime: '8-12 min',
    popularity: 78,
    requiredColumns: ['employee_id', 'department', 'hire_date', 'salary'],
    optionalColumns: ['performance_rating', 'gender', 'position', 'manager'],
    analyses: [
      'Employee turnover rate',
      'Department headcount',
      'Salary analysis',
      'Performance distribution',
      'Diversity metrics'
    ],
    formulas: [
      'Turnover rate calculations',
      'Average tenure formulas',
      'Salary percentile rankings',
      'Performance scoring'
    ],
    visualizations: [
      'Headcount by department',
      'Turnover trend analysis',
      'Salary distribution histogram',
      'Performance rating charts'
    ]
  },
  {
    id: 'customer_analysis',
    title: 'Customer Behavior Analysis',
    description: 'Deep dive into customer segments, lifetime value, and purchasing patterns',
    category: 'analytics',
    difficulty: 'advanced',
    estimatedTime: '15-20 min',
    popularity: 82,
    requiredColumns: ['customer_id', 'purchase_date', 'amount', 'product'],
    optionalColumns: ['channel', 'segment', 'geography', 'age_group'],
    analyses: [
      'Customer lifetime value',
      'RFM segmentation',
      'Purchase frequency analysis',
      'Product affinity',
      'Churn risk scoring'
    ],
    formulas: [
      'CLV calculations',
      'Recency/Frequency/Monetary scores',
      'Cohort analysis formulas',
      'Predictive scoring models'
    ],
    visualizations: [
      'Customer segment matrix',
      'CLV distribution charts',
      'Purchase pattern heatmaps',
      'Cohort analysis tables'
    ]
  },
  {
    id: 'inventory_optimization',
    title: 'Inventory Management Dashboard',
    description: 'Optimize stock levels with demand forecasting and reorder point analysis',
    category: 'operations',
    difficulty: 'intermediate',
    estimatedTime: '12-18 min',
    popularity: 71,
    requiredColumns: ['product_id', 'current_stock', 'sales_velocity', 'lead_time'],
    optionalColumns: ['cost', 'supplier', 'category', 'seasonality'],
    analyses: [
      'ABC inventory classification',
      'Reorder point calculation',
      'Stock turnover analysis',
      'Dead stock identification',
      'Demand forecasting'
    ],
    formulas: [
      'Economic order quantity',
      'Safety stock calculations',
      'Turnover ratio formulas',
      'Demand trend analysis'
    ],
    visualizations: [
      'ABC analysis chart',
      'Stock level dashboard',
      'Turnover rate comparisons',
      'Demand forecast graphs'
    ]
  },
  {
    id: 'marketing_roi',
    title: 'Marketing ROI Analysis',
    description: 'Measure campaign effectiveness, channel performance, and attribution analysis',
    category: 'sales',
    difficulty: 'intermediate',
    estimatedTime: '10-15 min',
    popularity: 89,
    requiredColumns: ['campaign', 'channel', 'spend', 'conversions', 'revenue'],
    optionalColumns: ['impressions', 'clicks', 'audience', 'geography'],
    analyses: [
      'ROI by campaign',
      'Channel effectiveness',
      'Cost per acquisition',
      'Attribution analysis',
      'Budget optimization'
    ],
    formulas: [
      'ROI calculations',
      'CPA formulas',
      'Attribution weights',
      'Efficiency ratios'
    ],
    visualizations: [
      'ROI comparison charts',
      'Channel performance dashboard',
      'Campaign timeline analysis',
      'Budget allocation pie charts'
    ]
  }
]

export function TemplateLibrary({ onTemplateSelect, onCreateNew }) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('popularity')
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const { success, error: showError } = useToast()

  const filteredTemplates = PREDEFINED_TEMPLATES.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  }).sort((a, b) => {
    switch (sortBy) {
      case 'popularity':
        return b.popularity - a.popularity
      case 'difficulty':
        const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 }
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
      case 'title':
        return a.title.localeCompare(b.title)
      default:
        return 0
    }
  })

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category) => {
    const IconComponent = TEMPLATE_CATEGORIES[category]?.icon || BookOpen
    return <IconComponent className="h-4 w-4" />
  }

  const handleUseTemplate = (template) => {
    if (onTemplateSelect) {
      onTemplateSelect(template)
      success(`Applied template: ${template.title}`)
    }
  }

  const handleCreateCustom = () => {
    setShowCreateDialog(true)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Template Library</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Jump-start your analysis with proven templates for common business scenarios. 
          From sales dashboards to financial reports - get insights in minutes, not hours.
        </p>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Search Templates</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(TEMPLATE_CATEGORIES).map(([key, category]) => (
                    <SelectItem key={key} value={key}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Popularity</SelectItem>
                  <SelectItem value="difficulty">Difficulty</SelectItem>
                  <SelectItem value="title">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreateCustom} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Custom
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(template.category)}
                  <div>
                    <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                      {template.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getDifficultyColor(template.difficulty)}>
                        {template.difficulty}
                      </Badge>
                      <Badge variant="outline">
                        <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                        {template.popularity}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 line-clamp-2">
                {template.description}
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  {template.estimatedTime}
                </div>
                
                <div className="text-xs">
                  <span className="font-medium">Required columns:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {template.requiredColumns.slice(0, 3).map((col, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {col}
                      </Badge>
                    ))}
                    {template.requiredColumns.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.requiredColumns.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => handleUseTemplate(template)}
                  className="flex-1"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Use Template
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <BookOpen className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        {getCategoryIcon(template.category)}
                        {template.title}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-gray-600">{template.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Template Details</h4>
                          <div className="space-y-1 text-sm">
                            <div>Difficulty: <Badge className={getDifficultyColor(template.difficulty)}>{template.difficulty}</Badge></div>
                            <div>Estimated time: {template.estimatedTime}</div>
                            <div>Popularity: {template.popularity}%</div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Category</h4>
                          <Badge variant="outline">
                            {TEMPLATE_CATEGORIES[template.category]?.name}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Required Columns</h4>
                        <div className="flex flex-wrap gap-1">
                          {template.requiredColumns.map((col, idx) => (
                            <Badge key={idx} variant="secondary">{col}</Badge>
                          ))}
                        </div>
                      </div>

                      {template.optionalColumns && (
                        <div>
                          <h4 className="font-medium mb-2">Optional Columns</h4>
                          <div className="flex flex-wrap gap-1">
                            {template.optionalColumns.map((col, idx) => (
                              <Badge key={idx} variant="outline">{col}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <Tabs defaultValue="analyses" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="analyses">Analyses</TabsTrigger>
                          <TabsTrigger value="formulas">Formulas</TabsTrigger>
                          <TabsTrigger value="visualizations">Charts</TabsTrigger>
                        </TabsList>
                        <TabsContent value="analyses" className="space-y-2">
                          {template.analyses.map((analysis, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                              {analysis}
                            </div>
                          ))}
                        </TabsContent>
                        <TabsContent value="formulas" className="space-y-2">
                          {template.formulas.map((formula, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                              {formula}
                            </div>
                          ))}
                        </TabsContent>
                        <TabsContent value="visualizations" className="space-y-2">
                          {template.visualizations.map((viz, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                              {viz}
                            </div>
                          ))}
                        </TabsContent>
                      </Tabs>

                      <div className="flex gap-2">
                        <Button onClick={() => handleUseTemplate(template)} className="flex-1">
                          <Play className="h-4 w-4 mr-2" />
                          Use This Template
                        </Button>
                        <Button variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No templates found matching your criteria.</p>
          <Button onClick={() => { setSearchTerm(''); setSelectedCategory('all') }} className="mt-4">
            Clear Filters
          </Button>
        </div>
      )}

      {/* Create Custom Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Custom Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Template Name</label>
                <Input placeholder="My Custom Template" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TEMPLATE_CATEGORIES).map(([key, category]) => (
                      <SelectItem key={key} value={key}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea placeholder="Describe what this template does and when to use it..." />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowCreateDialog(false)} className="flex-1">
                Create Template
              </Button>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}