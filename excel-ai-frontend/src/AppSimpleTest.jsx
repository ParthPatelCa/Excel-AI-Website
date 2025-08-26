import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'

function AppSimpleTest() {
  const [stage, setStage] = useState('init')
  const [error, setError] = useState(null)
  const [logs, setLogs] = useState([])

  const log = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { message, type, timestamp }])
    console.log(`[${timestamp}] ${message}`)
  }

  const testSupabase = async () => {
    try {
      setStage('testing-supabase')
      log('🔍 Testing Supabase import...')
      
      const { supabase } = await import('@/lib/supabaseClient.js')
      log('✅ Supabase client imported successfully')
      
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        log(`⚠️ Supabase auth error: ${error.message}`, 'warn')
      } else {
        log('✅ Supabase auth session check successful')
      }
      
    } catch (err) {
      log(`❌ Supabase test failed: ${err.message}`, 'error')
      setError(err)
    }
  }

  const testAuthContext = async () => {
    try {
      setStage('testing-auth-context')
      log('🔍 Testing AuthContext import...')
      
      const { AuthProvider, useAuth } = await import('@/contexts/AuthContext.jsx')
      log('✅ AuthContext imported successfully')
      
      // Try to render AuthProvider
      log('🔍 Testing AuthProvider rendering...')
      
    } catch (err) {
      log(`❌ AuthContext test failed: ${err.message}`, 'error')
      setError(err)
    }
  }

  const testThemeContext = async () => {
    try {
      setStage('testing-theme-context')
      log('🔍 Testing ThemeContext import...')
      
      const { ThemeProvider } = await import('@/contexts/ThemeContext.jsx')
      log('✅ ThemeContext imported successfully')
      
    } catch (err) {
      log(`❌ ThemeContext test failed: ${err.message}`, 'error')
      setError(err)
    }
  }

  const testMainApp = async () => {
    try {
      setStage('testing-main-app')
      log('🔍 Testing main App.jsx import...')
      
      const { default: App } = await import('./App.jsx')
      log('✅ Main App imported successfully')
      
      log('🔍 Checking App component type...')
      log(`App type: ${typeof App}`)
      
    } catch (err) {
      log(`❌ Main App test failed: ${err.message}`, 'error')
      setError(err)
    }
  }

  const runAllTests = async () => {
    setLogs([])
    setError(null)
    
    log('🚀 Starting comprehensive app tests...')
    
    await testSupabase()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await testThemeContext()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await testAuthContext()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await testMainApp()
    
    log('🎉 All tests completed!')
    setStage('complete')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            🧪 Simple App Tester
          </h1>
          <p className="text-gray-600 mb-6">
            This tool tests each component individually to isolate the crash.
          </p>
          
          <div className="flex flex-wrap gap-4 mb-6">
            <Button onClick={testSupabase}>
              Test Supabase
            </Button>
            <Button onClick={testThemeContext}>
              Test ThemeContext
            </Button>
            <Button onClick={testAuthContext}>
              Test AuthContext
            </Button>
            <Button onClick={testMainApp}>
              Test Main App
            </Button>
            <Button onClick={runAllTests} variant="default">
              Run All Tests
            </Button>
            <Button onClick={() => {setLogs([]); setError(null); setStage('init')}} variant="outline">
              Clear
            </Button>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2">
              <strong>Current Stage:</strong> 
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                {stage}
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
              <div className="font-bold">Error Details:</div>
              <div className="mt-2">{error.message}</div>
              {error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer font-semibold">Stack Trace</summary>
                  <pre className="mt-2 text-xs bg-red-50 p-2 rounded overflow-auto">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📊 Test Results ({logs.length} logs)
          </h2>
          
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">No test results yet. Run a test to see output.</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`mb-1 ${
                  log.type === 'error' ? 'text-red-400' : 
                  log.type === 'warn' ? 'text-yellow-400' : 
                  'text-green-400'
                }`}>
                  <span className="text-gray-400">[{log.timestamp}]</span> {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppSimpleTest
