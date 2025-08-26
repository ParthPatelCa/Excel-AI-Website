import React, { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'

function AppMinimal() {
  const [step, setStep] = useState(0)
  const [error, setError] = useState(null)

  const TestComponent = ({ children, title }) => (
    <div className="border rounded p-4 mb-4">
      <h3 className="font-bold mb-2">{title}</h3>
      {children}
    </div>
  )

  const testUseAuthWithoutProvider = () => {
    try {
      // This will likely cause an error
      const { useAuth } = require('@/contexts/AuthContext.jsx')
      const auth = useAuth() // This should throw an error if not wrapped in provider
      setStep(1)
    } catch (err) {
      setError({ step: 1, error: err })
    }
  }

  const testAppDirectly = () => {
    try {
      // Try to render the App component directly without contexts
      const App = require('./App.jsx').default
      setStep(2)
    } catch (err) {
      setError({ step: 2, error: err })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-4">🔬 Minimal Error Test</h1>
          <p className="text-gray-600 mb-6">
            Testing specific scenarios that might cause runtime crashes.
          </p>

          <div className="space-y-4">
            <TestComponent title="Test 1: useAuth Hook Without Provider">
              <p className="text-sm text-gray-600 mb-2">
                This tests if the app crashes when useAuth is called outside AuthProvider.
              </p>
              <Button onClick={testUseAuthWithoutProvider}>
                Test useAuth Hook
              </Button>
              {step >= 1 && <div className="text-green-600 mt-2">✅ Passed</div>}
            </TestComponent>

            <TestComponent title="Test 2: Direct App Import">
              <p className="text-sm text-gray-600 mb-2">
                This tests if importing the App component directly causes issues.
              </p>
              <Button onClick={testAppDirectly}>
                Test App Import
              </Button>
              {step >= 2 && <div className="text-green-600 mt-2">✅ Passed</div>}
            </TestComponent>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <div className="font-bold">Error at Step {error.step}:</div>
                <div className="mt-2">{error.error.message}</div>
                <details className="mt-2">
                  <summary className="cursor-pointer">Stack Trace</summary>
                  <pre className="text-xs mt-2 bg-red-50 p-2 rounded overflow-auto">
                    {error.error.stack}
                  </pre>
                </details>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded">
              <h3 className="font-bold mb-2">💡 Theory</h3>
              <p className="text-sm">
                Since all imports work but the app crashes during rendering, the issue is likely:
              </p>
              <ul className="text-sm mt-2 list-disc list-inside">
                <li>useAuth hook called before AuthProvider mounts</li>
                <li>Context initialization timing issue</li>
                <li>Component lifecycle error during first render</li>
                <li>Environment variable access during render</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppMinimal
