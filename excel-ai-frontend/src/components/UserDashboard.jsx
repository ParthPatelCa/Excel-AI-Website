import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { User, LogOut, Settings, BarChart3, MessageSquare, Crown, Zap, TrendingUp, Code, Users } from 'lucide-react'
import authService from '@/services/auth.js'
import { UsageDashboard } from './UsageDashboard.jsx'
import { ModelSelector } from './ModelSelector.jsx'
import { DeveloperAPI } from './DeveloperAPI.jsx'
import { TeamCollaboration } from './TeamCollaboration.jsx'

export const UserDashboard = ({ user, onLogout }) => {
  const [usage, setUsage] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUsageStats()
  }, [])

  const loadUsageStats = async () => {
    try {
      const result = await authService.getUsageStats()
      if (result.success) {
        setUsage(result.usage)
      }
    } catch (error) {
      console.error('Failed to load usage stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await authService.logout()
    onLogout()
  }

  const getSubscriptionBadge = (tier) => {
    const badges = {
      free: { color: 'bg-gray-100 text-gray-800', icon: User, label: 'Free' },
      pro: { color: 'bg-blue-100 text-blue-800', icon: Zap, label: 'Pro' },
      enterprise: { color: 'bg-purple-100 text-purple-800', icon: Crown, label: 'Enterprise' }
    }
    
    const badge = badges[tier] || badges.free
    const Icon = badge.icon
    
    return (
      <Badge className={badge.color}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.label}
      </Badge>
    )
  }

  const getProgressColor = (current, limit) => {
    if (limit === 'unlimited') return 'bg-green-500'
    const percentage = (current / limit) * 100
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getProgressPercentage = (current, limit) => {
    if (limit === 'unlimited') return 0
    return Math.min((current / limit) * 100, 100)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4" data-testid="user-dashboard">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600" data-testid="welcome-message">Welcome back, {user.first_name}!</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} data-testid="logout-button">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* User Info Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>{user.full_name}</CardTitle>
                      <CardDescription>{user.email}</CardDescription>
                    </div>
                  </div>
                  {getSubscriptionBadge(user.subscription_tier)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Member since:</span>
                    <span className="ml-2">{new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Account Status:</span>
                    <span className="ml-2 text-green-600">Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Statistics */}
            {usage && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AI Queries Usage */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                      AI Queries
                    </CardTitle>
                    <CardDescription>
                      Monthly AI chat and analysis queries
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {usage.monthly_queries} / {usage.limits.queries === 'unlimited' ? '∞' : usage.limits.queries}
                      </span>
                      <span className="text-sm text-gray-500">
                        {usage.limits.queries === 'unlimited' ? 'Unlimited' : 
                         `${Math.max(0, usage.limits.queries - usage.monthly_queries)} remaining`}
                      </span>
                    </div>
                    <Progress 
                      value={getProgressPercentage(usage.monthly_queries, usage.limits.queries)} 
                      className="h-2"
                    />
                    <div className="text-xs text-gray-500">
                      Resets monthly • Last reset: {new Date(usage.last_reset_date).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>

                {/* File Uploads Usage */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                      File Uploads
                    </CardTitle>
                    <CardDescription>
                      Monthly file uploads and analyses
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {usage.monthly_uploads} / {usage.limits.uploads === 'unlimited' ? '∞' : usage.limits.uploads}
                      </span>
                      <span className="text-sm text-gray-500">
                        {usage.limits.uploads === 'unlimited' ? 'Unlimited' : 
                         `${Math.max(0, usage.limits.uploads - usage.monthly_uploads)} remaining`}
                      </span>
                    </div>
                    <Progress 
                      value={getProgressPercentage(usage.monthly_uploads, usage.limits.uploads)} 
                      className="h-2"
                    />
                    <div className="text-xs text-gray-500">
                      Resets monthly • Last reset: {new Date(usage.last_reset_date).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks and shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-20 flex-col">
                    <BarChart3 className="h-6 w-6 mb-2" />
                    Upload Data
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <MessageSquare className="h-6 w-6 mb-2" />
                    AI Chat
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Settings className="h-6 w-6 mb-2" />
                    Account Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <UsageDashboard user={user} />
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <ModelSelector 
              value="balanced" 
              onChange={(model) => console.log('Model selected:', model)}
              disabled={user.subscription_tier === 'free'}
            />
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <DeveloperAPI />
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <TeamCollaboration user={user} />
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            {/* Subscription Info */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription Details</CardTitle>
                <CardDescription>
                  Your current plan and benefits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Current Plan</span>
                    {getSubscriptionBadge(user.subscription_tier)}
                  </div>
                  
                  <Separator />
                  
                  {user.subscription_tier === 'free' && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Free Plan Includes:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• 20 AI queries per month</li>
                        <li>• 5 file uploads per month</li>
                        <li>• Basic data analysis</li>
                        <li>• Export to PDF/Excel</li>
                      </ul>
                      <Button className="w-full mt-4">
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade to Pro
                      </Button>
                    </div>
                  )}
                  
                  {user.subscription_tier === 'pro' && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Pro Plan Includes:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• 500 AI queries per month</li>
                        <li>• 100 file uploads per month</li>
                        <li>• Advanced data analysis</li>
                        <li>• Priority support</li>
                        <li>• Advanced visualizations</li>
                        <li>• Model selection preferences</li>
                      </ul>
                    </div>
                  )}
                  
                  {user.subscription_tier === 'enterprise' && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Enterprise Plan Includes:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Unlimited AI queries</li>
                        <li>• Unlimited file uploads</li>
                        <li>• Advanced analytics</li>
                        <li>• Dedicated support</li>
                        <li>• Custom integrations</li>
                        <li>• Team collaboration</li>
                        <li>• Advanced model preferences</li>
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
