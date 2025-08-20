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
  CheckCircle,
  ArrowRight,
  Play,
  BookOpen
} from 'lucide-react'

const WelcomePage = ({ user, onGetStarted, onStartDemo }) => {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: "Welcome to DataSense AI!",
      description: "You're all set up and ready to transform your data into insights.",
      icon: CheckCircle,
      color: "text-green-500"
    },
    {
      title: "Upload Your Data",
      description: "Start by uploading an Excel file, CSV, or connecting Google Sheets.",
      icon: Upload,
      color: "text-blue-500"
    },
    {
      title: "Get AI Insights",
      description: "Our AI will analyze your data and provide actionable insights.",
      icon: Brain,
      color: "text-purple-500"
    },
    {
      title: "Create Visualizations",
      description: "Build beautiful charts and dashboards from your data.",
      icon: BarChart3,
      color: "text-orange-500"
    }
  ]

  const features = [
    {
      icon: Upload,
      title: "Connect",
      description: "Upload Excel, CSV files or connect Google Sheets",
      badge: "File Upload",
      color: "bg-blue-500"
    },
    {
      icon: Brain,
      title: "Analyze",
      description: "AI-powered insights and statistical analysis",
      badge: "AI Powered",
      color: "bg-purple-500"
    },
    {
      icon: BarChart3,
      title: "Visualize",
      description: "Create interactive charts and dashboards",
      badge: "7 Chart Types",
      color: "bg-orange-500"
    },
    {
      icon: Sparkles,
      title: "Enrich",
      description: "Sentiment analysis and text classification",
      badge: "Text AI",
      color: "bg-pink-500"
    },
    {
      icon: FileSpreadsheet,
      title: "Tools",
      description: "Generate Excel formulas and SQL queries",
      badge: "Code Gen",
      color: "bg-green-500"
    },
    {
      icon: TrendingUp,
      title: "Insights",
      description: "Advanced analytics and pattern detection",
      badge: "Smart AI",
      color: "bg-indigo-500"
    }
  ]

  const quickActions = [
    {
      title: "Upload Your First File",
      description: "Start with Excel or CSV data",
      icon: Upload,
      action: () => onGetStarted('upload'),
      primary: true
    },
    {
      title: "Try the Demo",
      description: "Explore with sample data",
      icon: Play,
      action: onStartDemo,
      primary: false
    },
    {
      title: "View Documentation",
      description: "Learn about features",
      icon: BookOpen,
      action: () => window.open('/docs', '_blank'),
      primary: false
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to DataSense AI, {user?.email?.split('@')[0] || 'there'}! 🎉
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your account is confirmed and ready. Let's turn your data into actionable insights.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {quickActions.map((action, index) => (
            <Card key={index} className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${action.primary ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}>
              <CardHeader className="text-center pb-4">
                <div className={`mx-auto p-3 rounded-full w-fit ${action.primary ? 'bg-blue-500' : 'bg-gray-100'}`}>
                  <action.icon className={`h-6 w-6 ${action.primary ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <CardTitle className={`text-lg ${action.primary ? 'text-blue-900' : 'text-gray-900'}`}>
                  {action.title}
                </CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  onClick={action.action}
                  className={`w-full ${action.primary ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                >
                  {action.title}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Overview */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            What You Can Do with DataSense AI
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${feature.color}`}>
                      <feature.icon className="h-5 w-5 text-white" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Getting Started Steps */}
        <Card className="mb-12">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Quick Start Guide</CardTitle>
            <CardDescription>Follow these steps to get the most out of DataSense AI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              {steps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className={`mx-auto p-3 rounded-full w-fit bg-gray-100 mb-4 ${currentStep >= index ? step.color : 'text-gray-400'}`}>
                    <step.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
              <p className="text-blue-100 mb-6">
                Upload your first file and see the power of AI-driven data analysis in action.
              </p>
              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={() => onGetStarted('upload')}
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  Upload Your Data
                  <Upload className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  onClick={onStartDemo}
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-blue-600"
                >
                  Try Demo First
                  <Play className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Info (for debugging) */}
        {user && (
          <div className="mt-8 text-center text-sm text-gray-500">
            Logged in as: {user.email}
          </div>
        )}
      </div>
    </div>
  )
}

export default WelcomePage
