import { useEffect, useState } from 'react'
import apiService from '@/services/api.js'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Loader2, History, RefreshCw } from 'lucide-react'

export function FormulaHistory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const limit = 20

  const load = async (reset = false) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiService.listFormulaHistory({ limit, offset: reset ? 0 : offset })
      if (res.success) {
        setHasMore(res.pagination.has_more)
        if (reset) {
          setItems(res.data)
          setOffset(limit)
        } else {
          setItems(prev => [...prev, ...res.data])
          setOffset(prev => prev + limit)
        }
      } else {
        setError(res.error || 'Failed to load history')
      }
    } catch (e) {
      setError(e.message)
    } finally { setLoading(false) }
  }

  useEffect(() => { load(true) }, [])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center space-x-2">
          <History className="h-4 w-4" />
          <span>Formula History</span>
          <Badge variant="outline">Beta</Badge>
        </CardTitle>
        <Button size="sm" variant="ghost" onClick={() => load(true)} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent>
        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {items.map(item => (
            <div key={item.id} className="p-3 border rounded-md bg-white shadow-sm text-xs space-y-1">
              <div className="flex items-center justify-between">
                <div className="font-medium capitalize">{item.interaction_type}</div>
                <div className="flex items-center space-x-2">
                  {item.fallback_used && <Badge variant="secondary" className="text-[10px]">Fallback</Badge>}
                  <Badge variant="outline" className="text-[10px]">{new Date(item.created_at).toLocaleTimeString()}</Badge>
                </div>
              </div>
              {item.input_payload?.description && (
                <div className="line-clamp-2 text-gray-600">{item.input_payload.description}</div>
              )}
              {item.input_payload?.formula && (
                <div className="font-mono bg-gray-50 p-1 rounded overflow-x-auto">{item.input_payload.formula}</div>
              )}
              {item.output_payload?.primary_formula && (
                <div className="font-mono bg-blue-50 p-1 rounded text-blue-800 overflow-x-auto">{item.output_payload.primary_formula}</div>
              )}
            </div>
          ))}
          {!loading && items.length === 0 && <div className="text-sm text-gray-500">No history yet.</div>}
        </div>
        {hasMore && (
          <Button variant="outline" size="sm" className="mt-3" onClick={() => load(false)} disabled={loading}>
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
