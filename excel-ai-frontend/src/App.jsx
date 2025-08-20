import { useState, useEffect } from 'react'
import { ThemeProvider } from '@/contexts/ThemeContext.jsx'
import { AuthProvider, useAuth } from '@/contexts/AuthContext.jsx'
import SupabaseAuth from '@/components/SupabaseAuth.jsx'
import { VisualizePage } from '@/components/VisualizePage.jsx'
import { AnalysisPage } from '@/components/AnalysisPage.jsx'
import { EnrichPage } from '@/components/EnrichPage.jsx'
import { ToolsPage } from '@/components/ToolsPage.jsx'
import { DataPrepPage } from '@/components/DataPrepPage.jsx'
import LandingPage from '@/components/LandingPage.jsx'
import DemoMode from '@/components/DemoMode.jsx'
import WelcomePage from '@/components/WelcomePage.jsx'
import Dashboard from '@/components/Dashboard.jsx'
import { Button } from '@/components/ui/button.jsx'

function AppContent() {
  const { user, loading, signOut } = useAuth()
  const [currentView, setCurrentView] = useState('landing') // Start with landing page
  const [showAuth, setShowAuth] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)

  // Check if user just authenticated and show welcome page
  useEffect(() => {
    if (user && !showWelcome && currentView === 'landing') {
      // Check if this is a new user (you can customize this logic)
      const isNewUser = localStorage.getItem(`welcomed_${user.id}`) !== 'true'
      if (isNewUser) {
        setShowWelcome(true)
        localStorage.setItem(`welcomed_${user.id}`, 'true')
      }
    }
  }, [user, showWelcome, currentView])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading DataSense AI...</p>
        </div>
      </div>
    )
  }

  // Show demo mode when requested
  if (!user && currentView === 'demo') {
    return (
      <DemoMode
        onBack={() => setCurrentView('landing')}
        onSignUp={() => setShowAuth(true)}
      />
    )
  }

  // Show landing page for non-authenticated users
  if (!user && !showAuth && currentView === 'landing') {
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
                onClick={() => setShowAuth(true)}
              >
                Sign In
              </Button>
              <Button
                onClick={() => setShowAuth(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Get Started
              </Button>
            </div>
          </div>
        </nav>

        <LandingPage
          onGetStarted={() => setShowAuth(true)}
          onTryDemo={() => setCurrentView('demo')}
          onLearnMore={() => setCurrentView('features')}
        />
      </div>
    )
  }

  // Show authentication forms when user clicks "Get Started" or "Sign In"
  if (!user && showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Back to landing page option */}
        <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <button
              onClick={() => setShowAuth(false)}
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              ← DataSense AI
            </button>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to DataSense AI
            </h1>
            <p className="text-xl text-gray-600">
              Sign in or create your account to get started
            </p>
          </div>
          <div className="max-w-md mx-auto">
            <SupabaseAuth onAuthSuccess={() => console.log('Auth success')} />
          </div>
        </div>
      </div>
    )
  }

  // Show welcome page for newly authenticated users
  if (user && showWelcome) {
    return (
      <WelcomePage
        user={user}
        onGetStarted={(action) => {
          setShowWelcome(false)
          if (action === 'upload') {
            setCurrentView('connect')
          } else {
            setCurrentView('home')
          }
        }}
        onStartDemo={() => {
          setShowWelcome(false)
          setCurrentView('demo')
        }}
      />
    )
  }

  const renderView = () => {
    // Show demo mode for authenticated users
    if (currentView === 'demo') {
      return (
        <DemoMode
          onBack={() => setCurrentView('home')}
          onSignUp={() => {}} // Already signed up
        />
      )
    }

    switch (currentView) {
      case 'connect':
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-16 text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Connect</h1>
              <p className="text-xl text-gray-600 mb-8">Coming Soon!</p>
              <p className="text-gray-500 mb-8">Data source connections and file upload management</p>
              <Button onClick={() => setCurrentView('home')} className="bg-blue-600 hover:bg-blue-700">
                Back to Dashboard
              </Button>
            </div>
          </div>
        )
      case 'analyze':
        return <AnalysisPage />
      case 'visualize':
        return <VisualizePage />
      case 'data-prep':
        return <DataPrepPage />
      case 'enrich':
        return <EnrichPage />
      case 'tools':
        return <ToolsPage />
      default:
        return (
          <Dashboard
            user={user}
            onNavigate={(view) => setCurrentView(view)}
            onShowWelcome={() => setShowWelcome(true)}
            onStartDemo={() => setCurrentView('demo')}
          />
        )
    }
  }

  // Helper function to get user display name
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
    <div className="min-h-screen">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 
            className="text-xl font-bold text-blue-600 cursor-pointer"
            onClick={() => setCurrentView('home')}
          >
            DataSense AI
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Hi, {getUserDisplayName()}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </nav>
      {renderView()}
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App

