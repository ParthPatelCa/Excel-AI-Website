import { useState } from 'react'
import { TemplateLibrary } from '@/components/TemplateLibrary.jsx'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { BookOpen, Zap, TrendingUp, History } from 'lucide-react'
import { useToast } from '@/hooks/useToast.js'

export function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [recentTemplates, setRecentTemplates] = useState([
    {
      id: 'sales_performance',
      title: 'Sales Performance Dashboard',
      lastUsed: '2 days ago',
      category: 'sales'
    },
    {
      id: 'financial_dashboard', 
      title: 'Financial KPI Dashboard',
      lastUsed: '1 week ago',
      category: 'finance'
    }
  ])
  const { success, error: showError } = useToast()

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template)
    
    // Add to recent templates
    setRecentTemplates(prev => {
      const filtered = prev.filter(t => t.id !== template.id)
      return [{
        id: template.id,
        title: template.title,
        lastUsed: 'Just now',
        category: template.category
      }, ...filtered].slice(0, 5)
    })

    // In a real app, this would navigate to the analysis page with the template applied
    success(`Template "${template.title}" is ready! Redirecting to analysis workspace...`)
    
    // Simulate template application
    setTimeout(() => {
      // This would typically:
      // 1. Apply the template configuration
      // 2. Set up the required analysis structure  
      // 3. Navigate to the analysis page
      console.log('Template applied:', template)
    }, 1000)
  }

  const handleCreateNew = () => {
    success('Custom template creation coming soon!')
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Browse Templates
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Recent
          </TabsTrigger>
          <TabsTrigger value="featured" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Featured
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <TemplateLibrary 
            onTemplateSelect={handleTemplateSelect}
            onCreateNew={handleCreateNew}
          />
        </TabsContent>

        <TabsContent value="recent" className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Templates</h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">
              Quick access to your recently used analysis templates
            </p>
          </div>

          {recentTemplates.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No recent templates yet</p>
                  <Button onClick={() => document.querySelector('[value="browse"]').click()}>
                    Browse Templates
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-medium group-hover:text-blue-600 transition-colors">
                          {template.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Last used: {template.lastUsed}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{template.category}</Badge>
                        <Button size="sm" onClick={() => handleTemplateSelect(template)}>
                          <Zap className="h-3 w-3 mr-1" />
                          Use Again
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="featured" className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Featured Templates</h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">
              Hand-picked templates that deliver exceptional business value
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 border-blue-200 bg-blue-50/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">⭐ Template of the Month</CardTitle>
                  <Badge className="bg-blue-600">Featured</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium">Customer Behavior Analysis</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Advanced customer segmentation with RFM analysis and lifetime value calculations
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Advanced</Badge>
                  <Button size="sm">
                    Try Now
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 bg-green-50/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">🚀 Most Popular</CardTitle>
                  <Badge className="bg-green-600">Popular</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium">Sales Performance Dashboard</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Comprehensive sales metrics used by 10,000+ analysts worldwide
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Beginner</Badge>
                  <Button size="sm">
                    Try Now
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200 bg-purple-50/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">💼 Enterprise Ready</CardTitle>
                  <Badge className="bg-purple-600">Pro</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium">Financial Compliance Dashboard</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    SOX-compliant financial reporting with automated variance analysis
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Intermediate</Badge>
                  <Button size="sm">
                    Try Now
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-200 bg-orange-50/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">🆕 New Release</CardTitle>
                  <Badge className="bg-orange-600">New</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium">Marketing Attribution Analysis</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Multi-touch attribution modeling with campaign ROI tracking
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Intermediate</Badge>
                  <Button size="sm">
                    Try Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {selectedTemplate && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <h3 className="font-medium">Template Applied: {selectedTemplate.title}</h3>
                <p className="text-sm text-gray-600">
                  Setting up your analysis workspace with the selected template...
                </p>
              </div>
              <Zap className="h-8 w-8 text-blue-600 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
