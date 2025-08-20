import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  BarChart3, 
  Brain, 
  Sparkles, 
  FileSpreadsheet,
  TrendingUp,
  Plus,
  ArrowRight,
  Play,
  BookOpen,
  Clock,
  Activity,
  Zap,
  Database,
  PieChart
} from 'lucide-react'

const Dashboard = ({ user, onNavigate, onShowWelcome, onStartDemo }) => {
  const [recentActivity] = useState([
    { id: 1, action: "Uploaded sales_data.xlsx", time: "2 hours ago", type: "upload" },
    { id: 2, action: "Created bar chart visualization", time: "1 day ago", type: "chart" },
    { id: 3, action: "Generated Excel formula", time: "2 days ago", type: "tool" },
  ])

  const quickStats = [
    { label: "Files Uploaded", value: "3", icon: Upload, color: "text-blue-600" },
    { label: "Charts Created", value: "7", icon: BarChart3, color: "text-green-600" },
    { label: "AI Insights", value: "12", icon: Brain, color: "text-purple-600" },
    { label: "Tools Used", value: "5", icon: Sparkles, color: "text-orange-600" },
  ]

  const platformFeatures = [
    {
      icon: Database,
      title: "Connect",
      description: "Upload files or connect data sources",
      action: () => onNavigate('connect'),
      color: "bg-blue-500",
      status: "Coming Soon"
    },
    {
      icon: Brain,
      title: "Analyze",
      description: "Get AI-powered insights from your data",
      action: () => onNavigate('analyze'),
      color: "bg-purple-500",
      status: "Ready"
    },
    {
      icon: BarChart3,
      title: "Visualize",
      description: "Create beautiful charts and dashboards",
      action: () => onNavigate('visualize'),
      color: "bg-orange-500",
      status: "Ready"
    },
    {
      icon: Zap,
      title: "Data Prep",
      description: "Clean and transform your data",
      action: () => onNavigate('data-prep'),
      color: "bg-green-500",
      status: "Ready"
    },
    {
      icon: Sparkles,
      title: "Enrich",
      description: "AI text analysis and enhancement",
      action: () => onNavigate('enrich'),
      color: "bg-pink-500",
      status: "Coming Soon"
    },
    {
      icon: FileSpreadsheet,
      title: "Tools",
      description: "Generate formulas, queries, and scripts",
      action: () => onNavigate('tools'),
      color: "bg-indigo-500",
      status: "Coming Soon"
    }
  ]

  const getUserDisplayName = () => {
    // Priority 1: First name + Last name from user_metadata
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
    }
    
    // Priority 2: Full name if available
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
    }
    
    // Priority 3: Name field
    if (user?.user_metadata?.name) {
      return user.user_metadata.name
    }
    
    // Priority 4: Extract name from email (improved logic)
    if (user?.email) {
      const emailName = user.email.split('@')[0]
      // Convert emails like "john.doe" or "john_doe" to "John Doe"
      return emailName
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase())
    }
    
    return 'there'
  }

  const getUserFirstName = () => {
    // Get just the first name for welcome messages
    if (user?.user_metadata?.first_name) {
      return user.user_metadata.first_name
    }
    
    const fullName = getUserDisplayName()
    if (fullName !== 'there') {
      return fullName.split(' ')[0]
    }
    
    return 'there'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {getUserFirstName()}! 👋
              </h1>
              <p className="text-lg text-gray-600">
                Ready to transform your data into insights?
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={onStartDemo}
                variant="outline"
                className="flex items-center"
              >
                <Play className="mr-2 h-4 w-4" />
                Try Demo
              </Button>
              <Button
                onClick={onShowWelcome}
                variant="ghost"
                className="flex items-center"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Welcome Guide
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Platform Features */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Platform Features
                </CardTitle>
                <CardDescription>
                  Explore the powerful capabilities of DataSense AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {platformFeatures.map((feature, index) => (
                    <Card 
                      key={index} 
                      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 hover:border-purple-300"
                      onClick={feature.action}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`p-3 rounded-lg ${feature.color} transition-all duration-200 group-hover:scale-110`}>
                            <feature.icon className="h-6 w-6 text-white" />
                          </div>
                          <Badge 
                            variant={feature.status === 'Ready' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {feature.status}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                        <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
                        <Button 
                          size="sm" 
                          className="w-full"
                          disabled={feature.status === 'Coming Soon'}
                        >
                          {feature.status === 'Coming Soon' ? 'Coming Soon' : 'Get Started'}
                          {feature.status !== 'Coming Soon' && <ArrowRight className="ml-2 h-4 w-4" />}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="mr-2 h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => onNavigate('connect')}
                  className="w-full justify-start bg-blue-500 hover:bg-blue-600"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload New File
                </Button>
                <Button 
                  onClick={() => onNavigate('analyze')}
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Brain className="mr-2 h-4 w-4" />
                  Start Analysis
                </Button>
                <Button 
                  onClick={() => onNavigate('visualize')}
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <PieChart className="mr-2 h-4 w-4" />
                  Create Chart
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Activity className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.action}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full mt-4">
                    View All Activity
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Getting Started */}
            <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <div className="bg-white/20 p-3 rounded-full w-fit mx-auto mb-3">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold mb-2">New to DataSense AI?</h3>
                  <p className="text-sm text-blue-100">
                    Check out our welcome guide to get started quickly.
                  </p>
                </div>
                <Button 
                  onClick={onShowWelcome}
                  size="sm"
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  Get Started Guide
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
