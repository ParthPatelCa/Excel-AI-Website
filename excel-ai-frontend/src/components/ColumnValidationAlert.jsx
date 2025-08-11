import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Button } from '@/components/ui/button.jsx'
import { AlertTriangle, CheckCircle, XCircle, ArrowRight } from 'lucide-react'

export function ColumnValidationAlert({ validation, onSuggestionApply }) {
  if (!validation || (!validation.invalid_columns?.length && !validation.warnings?.length)) {
    return null
  }

  const hasIssues = validation.invalid_columns?.length > 0
  const hasSuggestions = Object.keys(validation.suggestions || {}).length > 0

  return (
    <Alert className={hasIssues ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"}>
      <AlertTriangle className={`h-4 w-4 ${hasIssues ? 'text-amber-600' : 'text-green-600'}`} />
      <AlertDescription className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {hasIssues ? 'Column Validation Issues' : 'Column Validation'}
          </span>
          {hasIssues && (
            <Badge variant="destructive" className="text-xs">
              {validation.invalid_columns.length} issue{validation.invalid_columns.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Invalid Columns with Diff-Style Display */}
        {validation.invalid_columns?.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-amber-800">Referenced columns not found:</div>
            <div className="space-y-1">
              {validation.invalid_columns.map((col, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-red-500" />
                    <code className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-xs font-mono border-l-2 border-red-400">
                      {col}
                    </code>
                  </div>
                  
                  {validation.suggestions?.[col] && (
                    <>
                      <ArrowRight className="h-3 w-3 text-gray-400" />
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <code className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-xs font-mono border-l-2 border-green-400">
                          {validation.suggestions[col]}
                        </code>
                        {onSuggestionApply && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs text-green-700 hover:text-green-900 hover:bg-green-100"
                            onClick={() => onSuggestionApply(col, validation.suggestions[col])}
                          >
                            Apply
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Warnings */}
        {validation.warnings?.length > 0 && (
          <div className="space-y-1">
            <div className="text-sm font-medium text-amber-800">Validation Details:</div>
            <ul className="text-sm space-y-1">
              {validation.warnings.map((warning, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-amber-600">•</span>
                  <span className="text-amber-800">{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-600 border-t border-gray-200 pt-2">
          <strong>Tip:</strong> Column names are case-sensitive and must match your dataset exactly.
          {hasSuggestions && " Click 'Apply' to use suggested corrections."}
        </div>
      </AlertDescription>
    </Alert>
  )
}
