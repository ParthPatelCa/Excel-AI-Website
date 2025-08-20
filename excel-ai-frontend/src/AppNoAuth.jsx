import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'

function NoAuthApp() {
  const [currentView, setCurrentView] = useState('landing')

  if (currentView === 'demo') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              DataSense AI
            </h1>
            <Button onClick={() => setCurrentView('landing')} variant="outline">
              Back to Home
            </Button>
          </div>
        </nav>
        
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Demo Mode</h1>
          <p className="text-xl text-gray-600 mb-8">Experience DataSense AI features</p>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-blue-600">Analyze</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">AI-powered data analysis and insights</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-green-600">Visualize</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Create beautiful charts and dashboards</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-purple-600">Data Prep</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Clean and transform your data</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            DataSense AI
          </h1>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => setCurrentView('demo')}
            >
              Demo
            </Button>
            <Button
              variant="ghost"
              onClick={() => alert('Authentication temporarily disabled for deployment testing')}
            >
              Sign In
            </Button>
            <Button
              onClick={() => alert('Authentication temporarily disabled for deployment testing')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Transform Data Into Insights
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            DataSense AI is your comprehensive business intelligence platform. Upload, analyze, visualize, and gain actionable insights from your data with the power of artificial intelligence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => alert('Authentication temporarily disabled for deployment testing')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
            >
              Start Free Trial
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setCurrentView('demo')}
              className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3"
            >
              Try Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Data Success
            </h2>
            <p className="text-xl text-gray-600">
              Six powerful sections working together to transform your data workflow
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Connect",
                description: "Upload files or connect data sources seamlessly",
                color: "bg-blue-500",
                status: "Coming Soon"
              },
              {
                title: "Analyze", 
                description: "AI-powered analysis with natural language queries",
                color: "bg-purple-500",
                status: "Ready"
              },
              {
                title: "Visualize",
                description: "Create beautiful charts and dashboards",
                color: "bg-orange-500", 
                status: "Ready"
              },
              {
                title: "Data Prep",
                description: "Clean and transform your data efficiently", 
                color: "bg-green-500",
                status: "Ready"
              },
              {
                title: "Enrich",
                description: "AI text analysis and enhancement tools",
                color: "bg-pink-500",
                status: "Coming Soon"
              },
              {
                title: "Tools",
                description: "Generate formulas, queries, and scripts",
                color: "bg-indigo-500", 
                status: "Coming Soon"
              }
            ].map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${feature.color}`}></div>
                      {feature.title}
                    </CardTitle>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      feature.status === 'Ready' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-orange-100 text-orange-600'
                    }`}>
                      {feature.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-4">DataSense AI</h3>
          <p className="text-gray-400 mb-6">Transform your data into actionable insights</p>
          <p className="text-sm text-gray-500">
            Deployment Test Version - Authentication features temporarily disabled
          </p>
        </div>
      </footer>
    </div>
  )
}

export default NoAuthApp
