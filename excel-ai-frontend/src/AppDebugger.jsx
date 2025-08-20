import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'

function AppDebugger() {
  const [logs, setLogs] = useState([])
  const [stage, setStage] = useState('init')
  const [error, setError] = useState(null)

  // Capture console logs
  useEffect(() => {
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn

    console.log = (...args) => {
      setLogs(prev => [...prev, { type: 'log', message: args.join(' '), time: new Date().toLocaleTimeString() }])
      originalLog(...args)
    }

    console.error = (...args) => {
      setLogs(prev => [...prev, { type: 'error', message: args.join(' '), time: new Date().toLocaleTimeString() }])
      originalError(...args)
    }

    console.warn = (...args) => {
      setLogs(prev => [...prev, { type: 'warn', message: args.join(' '), time: new Date().toLocaleTimeString() }])
      originalWarn(...args)
    }

    // Capture uncaught errors
    const handleError = (event) => {
      setError(event.error)
      setLogs(prev => [...prev, { 
        type: 'error', 
        message: `Uncaught Error: ${event.error?.message || event.error}`, 
        time: new Date().toLocaleTimeString() 
      }])
    }

    window.addEventListener('error', handleError)

    return () => {
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
      window.removeEventListener('error', handleError)
    }
  }, [])

  const testMainApp = async () => {
    try {
      setStage('testing-main-app')
      setLogs(prev => [...prev, { type: 'log', message: '🚀 Starting main app test...', time: new Date().toLocaleTimeString() }])

      // Try to import the main app
      const { default: App } = await import('./App.jsx')
      setLogs(prev => [...prev, { type: 'log', message: '✅ Main app imported successfully', time: new Date().toLocaleTimeString() }])

      // Try to render it (this is where it might crash)
      setStage('rendering-main-app')
      
    } catch (err) {
      setError(err)
      setLogs(prev => [...prev, { 
        type: 'error', 
        message: `❌ Failed to load main app: ${err.message}`, 
        time: new Date().toLocaleTimeString() 
      }])
    }
  }

  const testContexts = async () => {
    try {
      setStage('testing-contexts')
      setLogs(prev => [...prev, { type: 'log', message: '🔍 Testing contexts...', time: new Date().toLocaleTimeString() }])

      // Test ThemeContext
      const { ThemeProvider } = await import('@/contexts/ThemeContext.jsx')
      setLogs(prev => [...prev, { type: 'log', message: '✅ ThemeContext imported', time: new Date().toLocaleTimeString() }])

      // Test AuthContext  
      const { AuthProvider } = await import('@/contexts/AuthContext.jsx')
      setLogs(prev => [...prev, { type: 'log', message: '✅ AuthContext imported', time: new Date().toLocaleTimeString() }])

      // Test Supabase
      const { default: supabase } = await import('@/lib/supabaseClient.js')
      setLogs(prev => [...prev, { type: 'log', message: '✅ Supabase client imported', time: new Date().toLocaleTimeString() }])

    } catch (err) {
      setError(err)
      setLogs(prev => [...prev, { 
        type: 'error', 
        message: `❌ Context test failed: ${err.message}`, 
        time: new Date().toLocaleTimeString() 
      }])
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            🔧 App Debugger
          </h1>
          <p className="text-gray-600 mb-4">
            This tool captures console logs and errors to help debug the main app crash.
          </p>
          
          <div className="flex gap-4 mb-6">
            <Button onClick={testContexts}>
              Test Contexts
            </Button>
            <Button onClick={testMainApp}>
              Test Main App
            </Button>
            <Button onClick={() => {setLogs([]); setError(null); setStage('init')}}>
              Clear Logs
            </Button>
          </div>

          <div className="mb-4">
            <strong>Current Stage:</strong> <span className="text-blue-600">{stage}</span>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Error:</strong> {error.message}
              {error.stack && (
                <pre className="mt-2 text-xs overflow-auto">
                  {error.stack}
                </pre>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Console Logs ({logs.length})
          </h2>
          
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet. Click a test button to start.</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`mb-1 ${
                  log.type === 'error' ? 'text-red-400' : 
                  log.type === 'warn' ? 'text-yellow-400' : 
                  'text-green-400'
                }`}>
                  <span className="text-gray-400">[{log.time}]</span> {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppDebugger
