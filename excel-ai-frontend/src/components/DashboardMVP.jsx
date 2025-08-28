import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  BarChart3, 
  Brain, 
  FileSpreadsheet,
  TrendingUp,
  Plus,
  ArrowRight,
  Play,
  BookOpen,
  Clock,
  Activity,
  Database,
  PieChart
} from 'lucide-react'

const DashboardMVP = ({ user, onNavigate, onShowWelcome, onStartDemo }) => {
  const [recentActivity] = useState([
    { id: 1, action: "Uploaded sales_data.xlsx", time: "2 hours ago", type: "upload" },
    { id: 2, action: "Created bar chart visualization", time: "1 day ago", type: "chart" },
    { id: 3, action: "Generated AI insights", time: "2 days ago", type: "analysis" },
  ])

  // MVP: Simplified stats focusing on core functionality
  const quickStats = [
    { label: "Files Analyzed", value: "3", icon: Upload, color: "text-blue-600" },
    { label: "Charts Created", value: "7", icon: BarChart3, color: "text-green-600" },
    { label: "AI Insights", value: "12", icon: Brain, color: "text-purple-600" },
  ]

  // MVP: Focus on core value proposition - only Analyze and Visualize
  const platformFeatures = [
    {
      icon: Brain,
      title: "Analyze",
      description: "Upload data and get AI-powered insights instantly",
      action: () => onNavigate('analyze'),
      color: "bg-purple-500",
      status: "Ready",
      featured: true // MVP: This is our main feature
    },
    {
      icon: BarChart3,
      title: "Visualize", 
      description: "Create beautiful charts from your data",
      action: () => onNavigate('visualize'),
      color: "bg-orange-500",
      status: "Ready"
    }
    // MVP: Comment out non-MVP features for initial release
    // {
    //   icon: Database,
    //   title: "Connect",
    //   description: "Upload files or connect data sources", 
    //   action: () => onNavigate('connect'),
    //   color: "bg-blue-500",
    //   status: "Coming Soon"
    // },
    // {
    //   icon: Zap,
    //   title: "Data Prep",
    //   description: "Clean and transform your data",
    //   action: () => onNavigate('data-prep'),
    //   color: "bg-green-500", 
    //   status: "Ready"
    // },
    // {
    //   icon: Sparkles,
    //   title: "Enrich",
    //   description: "AI text analysis and enhancement",
    //   action: () => onNavigate('enrich'),
    //   color: "bg-pink-500",
    //   status: "Coming Soon"
    // },
    // {
    //   icon: FileSpreadsheet,
    //   title: "Tools",
    //   description: "Generate formulas, queries, and scripts",
    //   action: () => onNavigate('tools'),
    //   color: "bg-indigo-500",
    //   status: "Coming Soon"
    // }
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
    
    return 'User'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {getUserDisplayName()}!
          </h1>
          <p className="text-gray-600">
            Transform your data into actionable insights with AI-powered analysis
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <Card key={index} className="bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* MVP: Streamlined Platform Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {platformFeatures.map((feature, index) => (
            <Card 
              key={index} 
              className={`bg-white hover:shadow-lg transition-shadow cursor-pointer group ${
                feature.featured ? 'ring-2 ring-purple-200 shadow-lg' : ''
              }`}
              onClick={feature.action}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-3 rounded-lg ${feature.color} text-white group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <Badge variant={feature.status === 'Ready' ? 'default' : 'secondary'}>
                    {feature.status}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                  {feature.title}
                  {feature.featured && (
                    <Badge variant="outline" className="ml-2 text-xs bg-purple-50 text-purple-600 border-purple-200">
                      Featured
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  className="w-full group-hover:bg-gray-900 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    feature.action()
                  }}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Get Started Card */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Play className="h-5 w-5 mr-2 text-blue-600" />
                Quick Start
              </CardTitle>
              <CardDescription>
                New to DataSense AI? Start with these essential features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => onNavigate('analyze')} 
                className="w-full justify-start bg-purple-600 hover:bg-purple-700"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload & Analyze Your First File
              </Button>
              <Button 
                onClick={onStartDemo} 
                variant="outline" 
                className="w-full justify-start"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Try Interactive Demo
              </Button>
              <Button 
                onClick={onShowWelcome} 
                variant="ghost" 
                className="w-full justify-start"
              >
                <Activity className="mr-2 h-4 w-4" />
                Show Welcome Guide
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Clock className="h-5 w-5 mr-2 text-gray-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your latest actions on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="flex-shrink-0">
                      {activity.type === 'upload' && <Upload className="h-4 w-4 text-blue-600" />}
                      {activity.type === 'chart' && <BarChart3 className="h-4 w-4 text-green-600" />}
                      {activity.type === 'analysis' && <Brain className="h-4 w-4 text-purple-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.action}
                      </p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No recent activity. Start by uploading a file!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* MVP: Value Proposition Banner */}
        <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white mt-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">Ready to unlock your data insights?</h3>
                <p className="text-purple-100">
                  Upload any Excel or CSV file and get AI-powered analysis in seconds
                </p>
              </div>
              <Button 
                onClick={() => onNavigate('analyze')}
                className="bg-white text-purple-600 hover:bg-gray-100"
              >
                Start Analyzing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DashboardMVP
