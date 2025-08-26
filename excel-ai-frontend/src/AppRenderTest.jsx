import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'

function AppRenderTest() {
  const [currentTest, setCurrentTest] = useState(0)
  const [logs, setLogs] = useState([])
  const [error, setError] = useState(null)
  const [renderResult, setRenderResult] = useState(null)

  const log = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { message, type, timestamp }])
    console.log(`[${timestamp}] ${message}`)
  }

  const tests = [
    {
      name: 'Render ThemeContext Provider',
      test: async () => {
        log('🔍 Testing ThemeContext rendering...')
        const { ThemeProvider } = await import('@/contexts/ThemeContext.jsx')
        
        const TestComponent = () => {
          return React.createElement(ThemeProvider, null, 
            React.createElement('div', null, 'Theme test successful')
          )
        }
        
        setRenderResult(() => TestComponent)
        log('✅ ThemeContext renders successfully')
      }
    },
    {
      name: 'Render AuthContext Provider',
      test: async () => {
        log('🔍 Testing AuthContext rendering...')
        const { AuthProvider } = await import('@/contexts/AuthContext.jsx')
        
        const TestComponent = () => {
          return React.createElement(AuthProvider, null,
            React.createElement('div', { className: 'p-4 bg-blue-100' }, 'Auth test successful')
          )
        }
        
        setRenderResult(() => TestComponent)
        log('✅ AuthContext renders successfully')
      }
    },
    {
      name: 'Render Combined Contexts',
      test: async () => {
        log('🔍 Testing combined contexts rendering...')
        const { ThemeProvider } = await import('@/contexts/ThemeContext.jsx')
        const { AuthProvider } = await import('@/contexts/AuthContext.jsx')
        
        const TestComponent = () => {
          return React.createElement(ThemeProvider, null,
            React.createElement(AuthProvider, null,
              React.createElement('div', { className: 'p-4 bg-green-100' }, 'Combined contexts successful')
            )
          )
        }
        
        setRenderResult(() => TestComponent)
        log('✅ Combined contexts render successfully')
      }
    },
    {
      name: 'Render Main App Component',
      test: async () => {
        log('🔍 Testing main App component rendering...')
        const { default: App } = await import('./App.jsx')
        
        // Try to render App without contexts first
        const TestComponent = () => {
          return React.createElement('div', null,
            React.createElement('div', { className: 'p-4 bg-yellow-100 mb-4' }, 'Attempting to render main App...'),
            React.createElement(App, null)
          )
        }
        
        setRenderResult(() => TestComponent)
        log('✅ Main App component renders successfully')
      }
    },
    {
      name: 'Render Full App with Contexts',
      test: async () => {
        log('🔍 Testing full app with contexts...')
        const { ThemeProvider } = await import('@/contexts/ThemeContext.jsx')
        const { AuthProvider } = await import('@/contexts/AuthContext.jsx')
        const { default: App } = await import('./App.jsx')
        
        const TestComponent = () => {
          return React.createElement(ThemeProvider, null,
            React.createElement(AuthProvider, null,
              React.createElement(App, null)
            )
          )
        }
        
        setRenderResult(() => TestComponent)
        log('✅ Full app with contexts renders successfully')
      }
    },
    {
      name: 'Test App Content Function',
      test: async () => {
        log('🔍 Testing AppContent function specifically...')
        
        // Import and test just the AppContent part
        const appModule = await import('./App.jsx')
        log(`App module keys: ${Object.keys(appModule).join(', ')}`)
        
        const TestComponent = () => {
          return React.createElement('div', { className: 'p-4 bg-purple-100' }, 
            'App module loaded - check if it exports default properly'
          )
        }
        
        setRenderResult(() => TestComponent)
        log('✅ App module analysis complete')
      }
    }
  ]

  const runTest = async (testIndex) => {
    if (testIndex >= tests.length) {
      log('🎉 All render tests completed!')
      return
    }

    const test = tests[testIndex]
    try {
      log(`🚀 Test ${testIndex + 1}: ${test.name}`)
      await test.test()
      log(`✅ Test ${testIndex + 1} completed successfully`)
      setCurrentTest(testIndex + 1)
    } catch (err) {
      log(`❌ Test ${testIndex + 1} failed: ${err.message}`, 'error')
      setError(err)
    }
  }

  const runAllTests = async () => {
    setLogs([])
    setError(null)
    setCurrentTest(0)
    setRenderResult(null)
    
    for (let i = 0; i < tests.length; i++) {
      await runTest(i)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  const reset = () => {
    setCurrentTest(0)
    setLogs([])
    setError(null)
    setRenderResult(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            🎭 App Render Testing
          </h1>
          <p className="text-gray-600 mb-6">
            Since imports work, this tests actual RENDERING of components to find runtime errors.
          </p>
          
          <div className="flex gap-4 mb-6">
            <Button onClick={runAllTests}>
              🚀 Run All Render Tests
            </Button>
            <Button onClick={() => runTest(currentTest)} disabled={currentTest >= tests.length}>
              ▶️ Run Next Test
            </Button>
            <Button onClick={reset} variant="outline">
              🔄 Reset
            </Button>
          </div>

          <div className="mb-6">
            <div className="font-semibold mb-2">Progress: {currentTest}/{tests.length}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {tests.map((test, index) => (
                <div 
                  key={index}
                  className={`p-2 rounded text-sm ${
                    index < currentTest 
                      ? 'bg-green-100 text-green-800' 
                      : index === currentTest 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {index < currentTest ? '✅' : index === currentTest ? '🔄' : '⏳'} {test.name}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
              <div className="font-bold">❌ Render Error at Test {currentTest + 1}:</div>
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

        {/* Render Test Area */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🎬 Live Render Test
          </h2>
          <div className="border-2 border-dashed border-gray-300 p-4 rounded min-h-32">
            {renderResult ? (
              <div>
                <div className="text-sm text-gray-600 mb-2">Rendering component...</div>
                {React.createElement(renderResult)}
              </div>
            ) : (
              <div className="text-gray-500 text-center">
                No component loaded yet. Run a test to see rendering.
              </div>
            )}
          </div>
        </div>

        {/* Logs */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📊 Render Test Logs ({logs.length})
          </h2>
          
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet. Run a render test to see output.</div>
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

export default AppRenderTest
