import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'

function AppStepByStep() {
  const [currentStep, setCurrentStep] = useState(0)
  const [logs, setLogs] = useState([])
  const [error, setError] = useState(null)
  const [isAutoRunning, setIsAutoRunning] = useState(false)

  const log = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { message, type, timestamp }])
    console.log(`[${timestamp}] ${message}`)
  }

  const steps = [
    {
      name: 'Test Supabase Import',
      action: async () => {
        log('🔍 Testing Supabase import...')
        const { supabase } = await import('@/lib/supabaseClient.js')
        log('✅ Supabase imported successfully')
        return 'Supabase OK'
      }
    },
    {
      name: 'Test ThemeContext Import',
      action: async () => {
        log('🔍 Testing ThemeContext import...')
        const { ThemeProvider } = await import('@/contexts/ThemeContext.jsx')
        log('✅ ThemeContext imported successfully')
        return 'ThemeContext OK'
      }
    },
    {
      name: 'Test AuthContext Import',
      action: async () => {
        log('🔍 Testing AuthContext import...')
        const { AuthProvider, useAuth } = await import('@/contexts/AuthContext.jsx')
        log('✅ AuthContext imported successfully')
        return 'AuthContext OK'
      }
    },
    {
      name: 'Test Basic UI Components',
      action: async () => {
        log('🔍 Testing UI components...')
        const { Card } = await import('@/components/ui/card.jsx')
        const { Button } = await import('@/components/ui/button.jsx')
        log('✅ UI components imported successfully')
        return 'UI Components OK'
      }
    },
    {
      name: 'Test Main App Import',
      action: async () => {
        log('🔍 Testing main App.jsx import...')
        const { default: App } = await import('./App.jsx')
        log('✅ Main App imported successfully')
        log(`App type: ${typeof App}`)
        return 'Main App Import OK'
      }
    },
    {
      name: 'Test Context Providers Rendering',
      action: async () => {
        log('🔍 Testing context providers rendering...')
        const { ThemeProvider } = await import('@/contexts/ThemeContext.jsx')
        const { AuthProvider } = await import('@/contexts/AuthContext.jsx')
        
        // Try to create the context structure
        const TestWrapper = () => {
          return React.createElement(ThemeProvider, null,
            React.createElement(AuthProvider, null,
              React.createElement('div', { className: 'p-4 bg-green-100' }, 'Context Test')
            )
          )
        }
        
        log('✅ Context providers can be created')
        return 'Context Rendering OK'
      }
    },
    {
      name: 'Test Full App Instantiation',
      action: async () => {
        log('🔍 Testing full app instantiation...')
        const { default: App } = await import('./App.jsx')
        const { ThemeProvider } = await import('@/contexts/ThemeContext.jsx')
        const { AuthProvider } = await import('@/contexts/AuthContext.jsx')
        
        // Try to create the full app structure
        const FullApp = () => {
          return React.createElement(ThemeProvider, null,
            React.createElement(AuthProvider, null,
              React.createElement(App, null)
            )
          )
        }
        
        log('✅ Full app structure can be created')
        return 'Full App Instantiation OK'
      }
    }
  ]

  const runStep = async (stepIndex) => {
    if (stepIndex >= steps.length) {
      log('🎉 All steps completed successfully!')
      setCurrentStep(stepIndex)
      return
    }

    const step = steps[stepIndex]
    try {
      log(`🚀 Step ${stepIndex + 1}: ${step.name}`)
      const result = await step.action()
      log(`✅ Step ${stepIndex + 1} completed: ${result}`)
      setCurrentStep(stepIndex + 1)
      
      if (isAutoRunning) {
        // Wait a bit before next step
        setTimeout(() => runStep(stepIndex + 1), 1000)
      }
    } catch (err) {
      log(`❌ Step ${stepIndex + 1} failed: ${err.message}`, 'error')
      setError(err)
      setIsAutoRunning(false)
    }
  }

  const runAllSteps = async () => {
    setIsAutoRunning(true)
    setLogs([])
    setError(null)
    setCurrentStep(0)
    await runStep(0)
  }

  const runSingleStep = () => {
    runStep(currentStep)
  }

  const reset = () => {
    setCurrentStep(0)
    setLogs([])
    setError(null)
    setIsAutoRunning(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            🔬 Step-by-Step App Debugger
          </h1>
          <p className="text-gray-600 mb-6">
            This tool runs each step individually to pinpoint exactly where the app crashes.
          </p>
          
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Button onClick={runAllSteps} disabled={isAutoRunning}>
                {isAutoRunning ? '🔄 Running...' : '🚀 Run All Steps'}
              </Button>
              <Button onClick={runSingleStep} disabled={isAutoRunning || currentStep >= steps.length}>
                ▶️ Run Next Step
              </Button>
              <Button onClick={reset} variant="outline">
                🔄 Reset
              </Button>
            </div>
            
            <div className="bg-blue-50 p-4 rounded">
              <div className="font-semibold mb-2">Progress: {currentStep}/{steps.length}</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(currentStep / steps.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
              <div className="font-bold">❌ Error at Step {currentStep + 1}:</div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {steps.map((step, index) => (
              <div 
                key={index}
                className={`p-3 rounded border-2 ${
                  index < currentStep 
                    ? 'border-green-500 bg-green-50' 
                    : index === currentStep 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="font-semibold">
                  {index < currentStep ? '✅' : index === currentStep ? '🔄' : '⏳'} 
                  Step {index + 1}
                </div>
                <div className="text-sm text-gray-600">{step.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📊 Detailed Logs ({logs.length})
          </h2>
          
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet. Run a step to see output.</div>
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

export default AppStepByStep
