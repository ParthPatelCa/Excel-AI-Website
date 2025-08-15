import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs.jsx'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { ColumnValidationAlert } from '@/components/ColumnValidationAlert.jsx'
import { FormulaDisplay } from '@/components/FormulaDisplay.jsx'
import { BatchFormulaGenerator } from '@/components/BatchFormulaGenerator.jsx'
import apiService from '@/services/api.js'
import { Loader2, Beaker, Bug, Lightbulb, AlertCircle, Zap } from 'lucide-react'

export function FormulaWorkspace({ columns = [] }) {
  const [activeTab, setActiveTab] = useState('generate')
  const [description, setDescription] = useState('')
  const [platform, setPlatform] = useState('excel') // New state for platform
  const [generateResult, setGenerateResult] = useState(null)
  const [generateFallback, setGenerateFallback] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [explainFormulaInput, setExplainFormulaInput] = useState('')
  const [explainResult, setExplainResult] = useState(null)
  const [explainFallback, setExplainFallback] = useState(false)

  const [debugFormulaInput, setDebugFormulaInput] = useState('')
  const [debugError, setDebugError] = useState('')
  const [debugResult, setDebugResult] = useState(null)
  const [debugFallback, setDebugFallback] = useState(false)
  const [quotaError, setQuotaError] = useState(null)

  const handleGenerate = async () => {
    if (!description.trim()) return
    setIsLoading(true)
    setGenerateResult(null)
    try {
      setQuotaError(null)
      const res = await apiService.generateFormula(description, { columns, platform })
      if (res.limit_reached) {
        setQuotaError('Query limit reached for your plan. Upgrade to continue.')
      } else if (res.success) {
        setGenerateResult(res.data)
        setGenerateFallback(!!res.fallback_used)
      } else {
        setGenerateResult({ error: res.error })
      }
    } catch (e) {
      setGenerateResult({ error: e.message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExplain = async () => {
    if (!explainFormulaInput.trim()) return
    setIsLoading(true)
    setExplainResult(null)
    try {
      setQuotaError(null)
      const res = await apiService.explainFormula(explainFormulaInput, { columns, platform })
      if (res.limit_reached) {
        setQuotaError('Query limit reached for your plan. Upgrade to continue.')
      } else if (res.success) { setExplainResult(res.data); setExplainFallback(!!res.fallback_used) } else setExplainResult({ error: res.error })
    } catch (e) {
      setExplainResult({ error: e.message })
    } finally { setIsLoading(false) }
  }

  const handleDebug = async () => {
    if (!debugFormulaInput.trim()) return
    setIsLoading(true)
    setDebugResult(null)
    try {
      setQuotaError(null)
      const res = await apiService.debugFormula(debugFormulaInput, { error_message: debugError, columns, platform })
      if (res.limit_reached) {
        setQuotaError('Query limit reached for your plan. Upgrade to continue.')
      } else if (res.success) { setDebugResult(res.data); setDebugFallback(!!res.fallback_used) } else setDebugResult({ error: res.error })
    } catch (e) { setDebugResult({ error: e.message }) } finally { setIsLoading(false) }
  }

  const handleSuggestionApply = (invalidColumn, suggestedColumn) => {
    // Apply suggestion to the current formula/description based on active tab
    if (activeTab === 'generate' && generateResult?.primary_formula) {
      const regex = new RegExp(`\\b${invalidColumn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      const updatedFormula = generateResult.primary_formula.replace(regex, suggestedColumn)
      
      setGenerateResult(prev => ({
        ...prev,
        primary_formula: updatedFormula,
        validation: {
          ...prev.validation,
          invalid_columns: prev.validation.invalid_columns.filter(col => col !== invalidColumn),
          suggestions: Object.fromEntries(
            Object.entries(prev.validation.suggestions || {}).filter(([key]) => key !== invalidColumn)
          )
        }
      }))
    } else if (activeTab === 'explain') {
      const regex = new RegExp(`\\b${invalidColumn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      setExplainFormulaInput(prev => prev.replace(regex, suggestedColumn))
    } else if (activeTab === 'debug') {
      const regex = new RegExp(`\\b${invalidColumn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      setDebugFormulaInput(prev => prev.replace(regex, suggestedColumn))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Formula Intelligence</span>
          <Badge variant="outline">Beta</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {quotaError && (
          <div className="mb-4 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <span>{quotaError}</span>
          </div>
        )}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Batch
            </TabsTrigger>
            <TabsTrigger value="explain">Explain</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
          </TabsList>

          <TabsContent value="batch" className="space-y-4">
            <BatchFormulaGenerator columns={columns} />
          </TabsContent>

          <TabsContent value="generate" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Platform</label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excel">Microsoft Excel</SelectItem>
                      <SelectItem value="google_sheets">Google Sheets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Available Columns</label>
                  <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded border min-h-[40px] flex items-center">
                    {columns.join(', ') || 'No columns available'}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Describe what you need</label>
                <Textarea
                  placeholder="e.g. Sum Revenue for rows where Region is 'West' and Date is in 2024"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                />
                <div className="text-xs text-blue-600">
                  💡 {platform === 'excel' 
                    ? 'Excel: Will use modern functions like XLOOKUP, FILTER, LET when appropriate' 
                    : 'Google Sheets: Will prefer ARRAYFORMULA, INDEX/MATCH, QUERY functions'}
                </div>
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={isLoading}>{isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Beaker className="h-4 w-4 mr-2"/>}Generate</Button>
            {generateResult && (
              <div className="mt-4 space-y-4">
                {generateFallback && !generateResult.error && (
                  <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 p-2 rounded-md">Model fallback used for this response – performance model engaged.</div>
                )}
                {generateResult.error && <div className="text-sm text-red-600">{generateResult.error}</div>}
                
                {/* Enhanced Validation Alert */}
                {generateResult.validation && (
                  <ColumnValidationAlert 
                    validation={generateResult.validation} 
                    onSuggestionApply={handleSuggestionApply}
                  />
                )}
                
                {/* Enhanced Formula Display */}
                {generateResult.primary_formula && (
                  <FormulaDisplay 
                    formula={generateResult.primary_formula}
                    validation={generateResult.validation}
                  />
                )}
                {generateResult.explanation && (
                  <div>
                    <h4 className="font-semibold mb-1 text-sm">Explanation</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{generateResult.explanation}</p>
                  </div>
                )}
                {generateResult.tips && generateResult.tips.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-1 text-sm">Tips</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {generateResult.tips.map((t,i) => <li key={i}>{t}</li>)}
                    </ul>
                  </div>
                )}
                {generateResult.variants && generateResult.variants.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-1 text-sm">Variants</h4>
                    <div className="space-y-2">
                      {generateResult.variants.map((v,i) => (
                        <div key={i} className="p-3 border rounded-md bg-white space-y-2">
                          <FormulaDisplay 
                            formula={v.formula}
                            validation={generateResult.validation}
                            className="mb-2"
                          />
                          <div className="text-xs text-gray-700 mb-1">{v.description}</div>
                          {v.tradeoffs && <div className="text-[11px] text-gray-500">Tradeoffs: {v.tradeoffs}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="explain" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Formula to explain</label>
              <Input placeholder="Paste a formula" value={explainFormulaInput} onChange={e=>setExplainFormulaInput(e.target.value)} />
            </div>
            <Button onClick={handleExplain} disabled={isLoading}>{isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Lightbulb className="h-4 w-4 mr-2"/>}Explain</Button>
            {explainResult && (
              <div className="mt-4 space-y-4">
                {explainFallback && !explainResult.error && (
                  <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 p-2 rounded-md">Model fallback used for this explanation.</div>
                )}
                {explainResult.error && <div className="text-sm text-red-600">{explainResult.error}</div>}
                
                {/* Enhanced Validation for Explain */}
                {explainResult.validation && (
                  <ColumnValidationAlert 
                    validation={explainResult.validation} 
                    onSuggestionApply={handleSuggestionApply}
                  />
                )}
                
                {explainResult.purpose && <div><h4 className="font-semibold text-sm mb-1">Purpose</h4><p className="text-sm text-gray-700">{explainResult.purpose}</p></div>}
                {explainResult.steps && explainResult.steps.length>0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Steps</h4>
                    <ol className="list-decimal pl-5 text-sm space-y-1">
                      {explainResult.steps.map((s,i)=><li key={i}>{s}</li>)}
                    </ol>
                  </div>
                )}
                {explainResult.optimization_suggestions && explainResult.optimization_suggestions.length>0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Optimization Suggestions</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {explainResult.optimization_suggestions.map((s,i)=><li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {explainResult.edge_cases && explainResult.edge_cases.length>0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Edge Cases</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {explainResult.edge_cases.map((s,i)=><li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {explainResult.simplified_alternative && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Simplified Alternative</h4>
                    <div className="font-mono text-xs bg-gray-50 p-2 rounded break-all">{explainResult.simplified_alternative}</div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="debug" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Formula to debug</label>
              <Input placeholder="Paste a formula" value={debugFormulaInput} onChange={e=>setDebugFormulaInput(e.target.value)} />
              <Input placeholder="Optional error message shown in Excel" value={debugError} onChange={e=>setDebugError(e.target.value)} />
            </div>
            <Button onClick={handleDebug} disabled={isLoading}>{isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Bug className="h-4 w-4 mr-2"/>}Debug</Button>
            {debugResult && (
              <div className="mt-4 space-y-4">
                {debugFallback && !debugResult.error && (
                  <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 p-2 rounded-md">Model fallback used for this debug session.</div>
                )}
                {debugResult.error && <div className="text-sm text-red-600">{debugResult.error}</div>}
                
                {/* Enhanced Validation for Debug */}
                {debugResult.validation && (
                  <ColumnValidationAlert 
                    validation={debugResult.validation} 
                    onSuggestionApply={handleSuggestionApply}
                  />
                )}
                
                {debugResult.likely_issues && debugResult.likely_issues.length>0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Likely Issues</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">{debugResult.likely_issues.map((s,i)=><li key={i}>{s}</li>)}</ul>
                  </div>
                )}
                {debugResult.fixes && debugResult.fixes.length>0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Fixes</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">{debugResult.fixes.map((s,i)=><li key={i}>{s}</li>)}</ul>
                  </div>
                )}
                {debugResult.diagnostic_steps && debugResult.diagnostic_steps.length>0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Diagnostic Steps</h4>
                    <ol className="list-decimal pl-5 text-sm space-y-1">{debugResult.diagnostic_steps.map((s,i)=><li key={i}>{s}</li>)}</ol>
                  </div>
                )}
                {debugResult.optimized_formula && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Optimized Formula</h4>
                    <FormulaDisplay 
                      formula={debugResult.optimized_formula}
                      validation={debugResult.validation}
                    />
                  </div>
                )}
                {debugResult.notes && debugResult.notes.length>0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Notes</h4>
                    <ul className="list-disc pl-5 text-sm space-y-1">{debugResult.notes.map((s,i)=><li key={i}>{s}</li>)}</ul>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
