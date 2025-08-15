import { useEffect, useState } from 'react'
import apiService from '@/services/api.js'

export const UsageBadge = () => {
  const [usage, setUsage] = useState(null)
  const [tier, setTier] = useState('free')

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        const res = await apiService.getTelemetryMetrics(7)
        if (isMounted && res?.success) {
          setUsage(res.data?.usage_limits)
        }
      } catch {}
    })()
    const userData = JSON.parse(localStorage.getItem('user_data') || 'null')
    if (userData?.subscription_tier) setTier(userData.subscription_tier)
    return () => { isMounted = false }
  }, [])

  if (!usage) return null

  const queries = usage.monthly_queries
  const uploads = usage.monthly_uploads
  const qLimit = usage.limits.queries
  const uLimit = usage.limits.uploads
  const qPct = qLimit === 'unlimited' ? 0 : Math.min(100, Math.round((queries / qLimit) * 100))
  const uPct = uLimit === 'unlimited' ? 0 : Math.min(100, Math.round((uploads / uLimit) * 100))
  const color = qLimit !== 'unlimited' && qPct >= 90 ? 'text-red-600' : qPct >= 70 ? 'text-amber-600' : 'text-green-600'

  return (
    <div className="hidden md:flex items-center text-xs px-2 py-1 rounded-md bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700">
      <span className="mr-2 capitalize">{tier}</span>
      <span className={`mr-3 ${color}`}>Q: {queries}/{qLimit === 'unlimited' ? '∞' : qLimit}</span>
      <span className="text-gray-600">U: {uploads}/{uLimit === 'unlimited' ? '∞' : uLimit}</span>
    </div>
  )
}


