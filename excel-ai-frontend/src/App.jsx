import { useState, useEffect } from 'react'
import { ThemeProvider } from '@/contexts/ThemeContext.jsx'
import { AuthProvider, useAuth } from '@/contexts/AuthContext.jsx'
import SupabaseAuth from '@/components/SupabaseAuth.jsx'
import { ConnectorsPage } from '@/components/ConnectorsPage.jsx'
import LandingPage from '@/components/LandingPage.jsx'
import DemoMode from '@/components/DemoMode.jsx'
import WelcomePage from '@/components/WelcomePage.jsx'
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
        return <ConnectorsPage />
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-16">
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  Welcome back, {user.email?.split('@')[0] || 'there'}!
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  Your DataSense AI Platform Dashboard
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
                  <Button
                    onClick={() => setCurrentView('connect')}
                    className="h-24 text-lg bg-blue-500 hover:bg-blue-600"
                    size="lg"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-2xl mb-2">🔗</span>
                      Connect Data
                    </div>
                  </Button>
                  <Button
                    onClick={() => setCurrentView('analyze')}
                    className="h-24 text-lg bg-purple-500 hover:bg-purple-600"
                    size="lg"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-2xl mb-2">📊</span>
                      Analyze
                    </div>
                  </Button>
                  <Button
                    onClick={() => setCurrentView('visualize')}
                    className="h-24 text-lg bg-orange-500 hover:bg-orange-600"
                    size="lg"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-2xl mb-2">📈</span>
                      Visualize
                    </div>
                  </Button>
                </div>
                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={() => setCurrentView('demo')}
                    variant="outline"
                    size="lg"
                  >
                    Try Demo Mode
                  </Button>
                  <Button
                    onClick={() => setShowWelcome(true)}
                    variant="ghost"
                    size="lg"
                  >
                    Show Welcome Guide
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
    }
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
            <span className="text-sm text-gray-600">{user.email}</span>
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

