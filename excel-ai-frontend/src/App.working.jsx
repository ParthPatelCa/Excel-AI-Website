import { useState } from 'react'
import { ThemeProvider } from '@/contexts/ThemeContext.jsx'
import { AuthProvider, useAuth } from '@/contexts/AuthContext.jsx'
import SupabaseAuth from '@/components/SupabaseAuth.jsx'
import { ConnectorsPage } from '@/components/ConnectorsPage.jsx'
import { Button } from '@/components/ui/button.jsx'

function AppContent() {
  const { user, loading } = useAuth()
  const [currentView, setCurrentView] = useState('home')

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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to DataSense AI
            </h1>
            <p className="text-xl text-gray-600">
              Transform your data into actionable insights with AI
            </p>
          </div>
          <div className="max-w-md mx-auto">
            <SupabaseAuth onAuthSuccess={() => console.log('Auth success')} />
          </div>
        </div>
      </div>
    )
  }

  const renderView = () => {
    switch (currentView) {
      case 'connect':
        return <ConnectorsPage />
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-16">
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  Welcome back, {user.email}!
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  Your DataSense AI Platform
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  <Button
                    onClick={() => setCurrentView('connect')}
                    className="h-24 text-lg"
                    variant="outline"
                  >
                    🔗 Connect Data
                  </Button>
                  <Button
                    onClick={() => setCurrentView('analyze')}
                    className="h-24 text-lg"
                    variant="outline"
                  >
                    📊 Analyze
                  </Button>
                  <Button
                    onClick={() => setCurrentView('visualize')}
                    className="h-24 text-lg"
                    variant="outline"
                  >
                    📈 Visualize
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
              onClick={() => {
                const { signOut } = useAuth()
                signOut()
              }}
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
