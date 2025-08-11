import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Copy, Eye, EyeOff } from 'lucide-react'

export function FormulaDisplay({ formula, validation, onCopy, className = '' }) {
  const [showHighlighting, setShowHighlighting] = useState(true)

  if (!formula) return null

  const highlightFormula = (text, invalidColumns = []) => {
    if (!showHighlighting || !invalidColumns.length) {
      return text
    }

    let highlightedText = text
    
    invalidColumns.forEach(col => {
      // Create a regex that matches the column name with word boundaries
      const regex = new RegExp(`\\b${col.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      highlightedText = highlightedText.replace(regex, (match) => 
        `<mark class="bg-red-200 text-red-800 px-1 py-0.5 rounded border-l-2 border-red-400">${match}</mark>`
      )
    })

    return highlightedText
  }

  const invalidColumns = validation?.invalid_columns || []
  const displayFormula = highlightFormula(formula, invalidColumns)

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Formula</span>
          {invalidColumns.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowHighlighting(!showHighlighting)}
              className="h-6 px-2 text-xs"
            >
              {showHighlighting ? (
                <>
                  <EyeOff className="h-3 w-3 mr-1" />
                  Hide Issues
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3 mr-1" />
                  Show Issues
                </>
              )}
            </Button>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            onCopy?.(formula)
            navigator.clipboard.writeText(formula)
          }}
          className="h-6 px-2"
        >
          <Copy className="h-3 w-3 mr-1" />
          Copy
        </Button>
      </div>
      
      <div className="relative">
        <div 
          className="p-3 rounded-md bg-gray-100 font-mono text-sm break-all border border-gray-200"
          dangerouslySetInnerHTML={{ __html: displayFormula }}
        />
        
        {invalidColumns.length > 0 && showHighlighting && (
          <div className="absolute top-1 right-1">
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {invalidColumns.length} issue{invalidColumns.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
      
      {invalidColumns.length > 0 && (
        <div className="text-xs text-red-600 flex items-center gap-1">
          <span className="w-2 h-2 bg-red-400 rounded-full inline-block"></span>
          Highlighted sections show columns not found in your dataset
        </div>
      )}
    </div>
  )
}
