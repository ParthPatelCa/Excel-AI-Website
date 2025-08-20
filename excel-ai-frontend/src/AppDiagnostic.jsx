import React, { useState, useEffect } from 'react'

function DiagnosticApp() {
  const [diagnostics, setDiagnostics] = useState([])
  const [currentTest, setCurrentTest] = useState('Starting...')

  const addDiagnostic = (test, status, details = '') => {
    setDiagnostics(prev => [...prev, { test, status, details, timestamp: new Date().toISOString() }])
  }

  useEffect(() => {
    const runDiagnostics = async () => {
      try {
        // Test 1: Basic React functionality
        setCurrentTest('Testing React')
        addDiagnostic('React Hooks', 'PASS', 'useState and useEffect working')

        // Test 2: Environment variables
        setCurrentTest('Checking Environment Variables')
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
        
        addDiagnostic('Supabase URL', supabaseUrl ? 'PASS' : 'FAIL', supabaseUrl || 'Not set')
        addDiagnostic('Supabase Key', supabaseKey ? 'PASS' : 'FAIL', supabaseKey ? 'Present' : 'Not set')

        // Test 3: Basic imports
        setCurrentTest('Testing Basic Imports')
        try {
          const { Button } = await import('@/components/ui/button.jsx')
          addDiagnostic('Button Component', 'PASS', 'Successfully imported')
        } catch (err) {
          addDiagnostic('Button Component', 'FAIL', err.message)
        }

        try {
          const { Card } = await import('@/components/ui/card.jsx')
          addDiagnostic('Card Component', 'PASS', 'Successfully imported')
        } catch (err) {
          addDiagnostic('Card Component', 'FAIL', err.message)
        }

        // Test 4: Context imports
        setCurrentTest('Testing Context Imports')
        try {
          const { AuthProvider } = await import('@/contexts/AuthContext.jsx')
          addDiagnostic('AuthContext', 'PASS', 'Successfully imported')
        } catch (err) {
          addDiagnostic('AuthContext', 'FAIL', err.message)
        }

        try {
          const { ThemeProvider } = await import('@/contexts/ThemeContext.jsx')
          addDiagnostic('ThemeContext', 'PASS', 'Successfully imported')
        } catch (err) {
          addDiagnostic('ThemeContext', 'FAIL', err.message)
        }

        // Test 5: Supabase client
        setCurrentTest('Testing Supabase Client')
        try {
          const { supabase } = await import('@/lib/supabaseClient.js')
          addDiagnostic('Supabase Client', 'PASS', 'Successfully imported')
        } catch (err) {
          addDiagnostic('Supabase Client', 'FAIL', err.message)
        }

        // Test 6: Profile components
        setCurrentTest('Testing Profile Components')
        try {
          const { UserProfilePageWorking } = await import('@/components/UserProfilePageWorking.jsx')
          addDiagnostic('Profile Component', 'PASS', 'Successfully imported')
        } catch (err) {
          addDiagnostic('Profile Component', 'FAIL', err.message)
        }

        setCurrentTest('Diagnostics Complete')
      } catch (error) {
        addDiagnostic('Global Error', 'FAIL', error.message)
        setCurrentTest('Diagnostics Failed')
      }
    }

    runDiagnostics()
  }, [])

  const failedTests = diagnostics.filter(d => d.status === 'FAIL')
  const passedTests = diagnostics.filter(d => d.status === 'PASS')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">DataSense AI - Deployment Diagnostics</h1>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Current Test: {currentTest}</h2>
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded">
              Total Tests: {diagnostics.length} | 
              Passed: <span className="font-bold text-green-600">{passedTests.length}</span> | 
              Failed: <span className="font-bold text-red-600">{failedTests.length}</span>
            </div>
          </div>

          {failedTests.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-red-600 mb-3">❌ Failed Tests</h3>
              <div className="space-y-2">
                {failedTests.map((diagnostic, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                    <div className="font-medium text-red-800">{diagnostic.test}</div>
                    <div className="text-sm text-red-600">{diagnostic.details}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-green-600 mb-3">✅ Passed Tests</h3>
            <div className="grid md:grid-cols-2 gap-2">
              {passedTests.map((diagnostic, index) => (
                <div key={index} className="bg-green-50 border border-green-200 rounded p-2">
                  <div className="font-medium text-green-800">{diagnostic.test}</div>
                  <div className="text-xs text-green-600">{diagnostic.details}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-100 rounded p-4">
            <h3 className="font-semibold mb-2">Environment Info</h3>
            <div className="text-sm space-y-1">
              <div>User Agent: {navigator.userAgent}</div>
              <div>URL: {window.location.href}</div>
              <div>Timestamp: {new Date().toISOString()}</div>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-2"
            >
              Reload Page
            </button>
            <button
              onClick={() => window.location.href = window.location.origin + '?mode=simple'}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Switch to Simple Mode
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DiagnosticApp
