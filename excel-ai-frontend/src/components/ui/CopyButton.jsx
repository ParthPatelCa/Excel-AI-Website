import { useState } from 'react'
import { Copy, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'

export const CopyButton = ({ 
  text, 
  size = "sm", 
  variant = "outline", 
  className = "" 
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={`transition-all duration-200 ${className}`}
      disabled={copied}
    >
      {copied ? (
        <>
          <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 mr-1" />
          Copy
        </>
      )}
    </Button>
  )
}

// Usage example component for formulas
export const FormulaOutput = ({ formula, explanation }) => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Generated Formula:</h4>
        <CopyButton text={formula} />
      </div>
      
      <div className="bg-white border rounded p-3">
        <code className="text-indigo-600 font-mono text-sm break-all">
          {formula}
        </code>
      </div>
      
      {explanation && (
        <div className="text-sm text-gray-600">
          <strong>Explanation:</strong> {explanation}
        </div>
      )}
    </div>
  )
}

// Usage example for any text content
export const CopyableText = ({ children, text, label = "Copy text" }) => {
  return (
    <div className="relative group">
      {children}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton text={text} size="xs" className="bg-white/90 hover:bg-white" />
      </div>
    </div>
  )
}
