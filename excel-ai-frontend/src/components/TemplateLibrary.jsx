import { useState, useEffect } from 'react'
import { Search, Filter, Download, Eye, Star, Plus, Edit, Trash2, BookOpen, TrendingUp, DollarSign, Users, Building } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { LoadingSpinner } from '@/components/ui/alerts.jsx'

const INDUSTRY_ICONS = {
  finance: DollarSign,
  healthcare: Plus,
  retail: Building,
  manufacturing: Building,
  marketing: TrendingUp,
  hr: Users,
  general: BookOpen
}

const INDUSTRY_COLORS = {
  finance: 'bg-green-100 text-green-800',
  healthcare: 'bg-red-100 text-red-800',
  retail: 'bg-blue-100 text-blue-800',
  manufacturing: 'bg-purple-100 text-purple-800',
  marketing: 'bg-orange-100 text-orange-800',
  hr: 'bg-indigo-100 text-indigo-800',
  general: 'bg-gray-100 text-gray-800'
}

export function TemplateLibrary({ onApplyTemplate }) {
  const [templates, setTemplates] = useState([])
  const [filteredTemplates, setFilteredTemplates] = useState([])
  const [selectedIndustry, setSelectedIndustry] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    industry: 'general',
    category: 'analysis',
    template_data: {
      columns: [],
      formulas: [],
      charts: []
    }
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    filterTemplates()
  }, [templates, selectedIndustry, selectedCategory, searchQuery])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/features/template-library', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      const result = await response.json()
      
      if (result.success) {
        setTemplates(result.templates)
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterTemplates = () => {
    let filtered = templates

    if (selectedIndustry !== 'all') {
      filtered = filtered.filter(template => template.industry === selectedIndustry)
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory)
    }

    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredTemplates(filtered)
  }

  const applyTemplate = async (template) => {
    try {
      const response = await fetch(`/api/v1/features/template-library/${template.id}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      const result = await response.json()
      
      if (result.success && onApplyTemplate) {
        onApplyTemplate(result.applied_template)
      }
    } catch (error) {
      console.error('Failed to apply template:', error)
    }
  }

  const saveTemplate = async () => {
    try {
      const response = await fetch('/api/v1/features/template-library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(newTemplate)
      })
      const result = await response.json()
      
      if (result.success) {
        setTemplates([result.template, ...templates])
        setShowCreateDialog(false)
        setNewTemplate({
          name: '',
          description: '',
          industry: 'general',
          category: 'analysis',
          template_data: {
            columns: [],
            formulas: [],
            charts: []
          }
        })
      }
    } catch (error) {
      console.error('Failed to save template:', error)
    }
  }

  const deleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const response = await fetch(`/api/v1/features/template-library/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        setTemplates(templates.filter(t => t.id !== templateId))
      }
    } catch (error) {
      console.error('Failed to delete template:', error)
    }
  }

  const downloadTemplate = (template) => {
    const templateData = {
      ...template,
      downloaded_at: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(templateData, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.name.replace(/\s+/g, '_')}_template.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getUniqueIndustries = () => {
    const industries = [...new Set(templates.map(t => t.industry))]
    return industries.sort()
  }

  const getUniqueCategories = () => {
    const categories = [...new Set(templates.map(t => t.category))]
    return categories.sort()
  }

  const addColumn = () => {
    const columnName = prompt('Enter column name:')
    if (columnName) {
      setNewTemplate(prev => ({
        ...prev,
        template_data: {
          ...prev.template_data,
          columns: [...prev.template_data.columns, { name: columnName, type: 'text' }]
        }
      }))
    }
  }

  const addFormula = () => {
    const formulaName = prompt('Enter formula name:')
    const formulaExpression = prompt('Enter formula expression:')
    if (formulaName && formulaExpression) {
      setNewTemplate(prev => ({
        ...prev,
        template_data: {
          ...prev.template_data,
          formulas: [...prev.template_data.formulas, { name: formulaName, expression: formulaExpression }]
        }
      }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Template Library</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Access pre-built analysis templates for common business scenarios and industry-specific use cases
        </p>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Industry Filter */}
            <div className="w-full lg:w-48">
              <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="All Industries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {getUniqueIndustries().map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry.charAt(0).toUpperCase() + industry.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="w-full lg:w-48">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {getUniqueCategories().map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Create Template Button */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Template</DialogTitle>
                  <DialogDescription>
                    Create a reusable analysis template for your team or organization
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-name">Template Name</Label>
                      <Input
                        id="template-name"
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Sales Performance Analysis"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="template-industry">Industry</Label>
                      <Select 
                        value={newTemplate.industry} 
                        onValueChange={(value) => setNewTemplate(prev => ({ ...prev, industry: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="hr">Human Resources</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template-description">Description</Label>
                    <Textarea
                      id="template-description"
                      value={newTemplate.description}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what this template analyzes and how it can be used..."
                      rows={3}
                    />
                  </div>

                  <Tabs defaultValue="columns">
                    <TabsList>
                      <TabsTrigger value="columns">Columns</TabsTrigger>
                      <TabsTrigger value="formulas">Formulas</TabsTrigger>
                      <TabsTrigger value="charts">Charts</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="columns" className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Expected Columns</Label>
                        <Button size="sm" onClick={addColumn}>Add Column</Button>
                      </div>
                      <div className="space-y-2">
                        {newTemplate.template_data.columns.map((column, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <span>{column.name}</span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                const updatedColumns = newTemplate.template_data.columns.filter((_, i) => i !== index)
                                setNewTemplate(prev => ({
                                  ...prev,
                                  template_data: { ...prev.template_data, columns: updatedColumns }
                                }))
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="formulas" className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Suggested Formulas</Label>
                        <Button size="sm" onClick={addFormula}>Add Formula</Button>
                      </div>
                      <div className="space-y-2">
                        {newTemplate.template_data.formulas.map((formula, index) => (
                          <div key={index} className="p-2 border rounded">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{formula.name}</span>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  const updatedFormulas = newTemplate.template_data.formulas.filter((_, i) => i !== index)
                                  setNewTemplate(prev => ({
                                    ...prev,
                                    template_data: { ...prev.template_data, formulas: updatedFormulas }
                                  }))
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <code className="text-xs text-gray-600">{formula.expression}</code>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="charts">
                      <p className="text-sm text-gray-500">Chart configuration coming soon...</p>
                    </TabsContent>
                  </Tabs>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={saveTemplate}>
                      Save Template
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const IndustryIcon = INDUSTRY_ICONS[template.industry] || BookOpen
          return (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-lg ${INDUSTRY_COLORS[template.industry] || INDUSTRY_COLORS.general}`}>
                      <IndustryIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {template.category}
                        </Badge>
                        {template.popularity_score && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Star className="h-3 w-3 mr-1" />
                            {template.popularity_score}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <CardDescription className="mt-2">
                  {template.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {/* Template Preview */}
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Columns: {template.template_data?.columns?.length || 0}</span>
                      <span>Formulas: {template.template_data?.formulas?.length || 0}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>{template.name}</DialogTitle>
                          <DialogDescription>{template.description}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Tabs defaultValue="overview">
                            <TabsList>
                              <TabsTrigger value="overview">Overview</TabsTrigger>
                              <TabsTrigger value="columns">Columns</TabsTrigger>
                              <TabsTrigger value="formulas">Formulas</TabsTrigger>
                            </TabsList>
                            <TabsContent value="overview">
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Industry</Label>
                                    <p className="text-sm text-gray-600 capitalize">{template.industry}</p>
                                  </div>
                                  <div>
                                    <Label>Category</Label>
                                    <p className="text-sm text-gray-600 capitalize">{template.category}</p>
                                  </div>
                                </div>
                                {template.use_cases && (
                                  <div>
                                    <Label>Use Cases</Label>
                                    <ul className="text-sm text-gray-600 list-disc list-inside">
                                      {template.use_cases.map((useCase, index) => (
                                        <li key={index}>{useCase}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </TabsContent>
                            <TabsContent value="columns">
                              <div className="space-y-2">
                                {template.template_data?.columns?.map((column, index) => (
                                  <div key={index} className="p-2 border rounded flex justify-between">
                                    <span>{column.name}</span>
                                    <Badge variant="outline">{column.type}</Badge>
                                  </div>
                                ))}
                              </div>
                            </TabsContent>
                            <TabsContent value="formulas">
                              <div className="space-y-2">
                                {template.template_data?.formulas?.map((formula, index) => (
                                  <div key={index} className="p-2 border rounded">
                                    <div className="font-medium">{formula.name}</div>
                                    <code className="text-xs text-gray-600">{formula.expression}</code>
                                  </div>
                                ))}
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => applyTemplate(template)}
                    >
                      Apply
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadTemplate(template)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {!isLoading && filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your filters or create a new template
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Template
          </Button>
        </div>
      )}
    </div>
  )
}
