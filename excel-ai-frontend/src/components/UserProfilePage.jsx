import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Switch } from '@/components/ui/switch.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { 
  User, Mail, Lock, Bell, Shield, CreditCard, Download, Trash2, 
  Eye, EyeOff, Camera, Settings, Globe, Smartphone, Monitor,
  CheckCircle, AlertCircle, Calendar, Activity, BarChart3,
  FileText, HelpCircle, ExternalLink, Save, Upload
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext.jsx'

export function UserProfilePage({ onNavigateBack }) {
  const { user, updateProfile, changePassword, deleteAccount } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [message, setMessage] = useState({ type: '', content: '' })

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    bio: '',
    company: '',
    jobTitle: '',
    website: '',
    location: '',
    phone: ''
  })

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Preferences state
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
    weeklyDigest: true,
    dataProcessingUpdates: true,
    securityAlerts: true,
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    defaultChartType: 'bar'
  })

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'private',
    showEmail: false,
    showActivity: false,
    allowAnalytics: true,
    dataSharingOptOut: false
  })

  // Usage stats (mock data)
  const [usageStats] = useState({
    filesUploaded: 247,
    chartsCreated: 156,
    aiQueriesUsed: 1234,
    dataProcessed: '45.2 GB',
    accountAge: '8 months',
    lastLogin: '2 hours ago',
    mostUsedFeature: 'Data Analysis',
    averageSessionTime: '24 minutes'
  })

  // Subscription info (mock data)
  const [subscriptionInfo] = useState({
    plan: 'Pro',
    status: 'Active',
    billingCycle: 'Monthly',
    nextBilling: '2024-02-15',
    amount: '$29.99',
    features: [
      'Unlimited AI queries',
      'Advanced analytics',
      'Priority support',
      'Custom integrations',
      'Team collaboration'
    ]
  })

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
        email: user.email || '',
        bio: user.user_metadata?.bio || '',
        company: user.user_metadata?.company || '',
        jobTitle: user.user_metadata?.job_title || '',
        website: user.user_metadata?.website || '',
        location: user.user_metadata?.location || '',
        phone: user.user_metadata?.phone || ''
      })
    }
  }, [user])

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage({ type: '', content: '' })

    try {
      await updateProfile({
        first_name: profileForm.firstName,
        last_name: profileForm.lastName,
        bio: profileForm.bio,
        company: profileForm.company,
        job_title: profileForm.jobTitle,
        website: profileForm.website,
        location: profileForm.location,
        phone: profileForm.phone
      })
      
      setMessage({ type: 'success', content: 'Profile updated successfully!' })
    } catch (error) {
      setMessage({ type: 'error', content: 'Failed to update profile. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage({ type: '', content: '' })

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', content: 'New passwords do not match.' })
      setIsLoading(false)
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setMessage({ type: 'error', content: 'Password must be at least 8 characters long.' })
      setIsLoading(false)
      return
    }

    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword)
      setMessage({ type: 'success', content: 'Password changed successfully!' })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      setMessage({ type: 'error', content: 'Failed to change password. Please check your current password.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await deleteAccount()
        setMessage({ type: 'success', content: 'Account deletion initiated. You will receive a confirmation email.' })
      } catch (error) {
        setMessage({ type: 'error', content: 'Failed to delete account. Please contact support.' })
      }
    }
  }

  const downloadAccountData = () => {
    // Mock download functionality
    setMessage({ type: 'success', content: 'Account data export initiated. You will receive an email with download link.' })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
              <p className="text-gray-600 mt-1">Manage your profile, preferences, and account settings</p>
            </div>
            <Button onClick={onNavigateBack} variant="outline">
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Messages */}
        {message.content && (
          <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            {message.type === 'success' ? 
              <CheckCircle className="h-4 w-4 text-green-600" /> : 
              <AlertCircle className="h-4 w-4 text-red-600" />
            }
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.content}
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Privacy & Data
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Update your personal details and contact information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={profileForm.firstName}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                            placeholder="Enter your first name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={profileForm.lastName}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                            placeholder="Enter your last name"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileForm.email}
                          disabled
                          className="bg-gray-50"
                        />
                        <p className="text-xs text-gray-500">Email cannot be changed. Contact support if needed.</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={profileForm.bio}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                          placeholder="Tell us about yourself..."
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="company">Company</Label>
                          <Input
                            id="company"
                            value={profileForm.company}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, company: e.target.value }))}
                            placeholder="Company name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="jobTitle">Job Title</Label>
                          <Input
                            id="jobTitle"
                            value={profileForm.jobTitle}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                            placeholder="Your job title"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            value={profileForm.website}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, website: e.target.value }))}
                            placeholder="https://yourwebsite.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="Your phone number"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={profileForm.location}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="City, Country"
                        />
                      </div>

                      <Button type="submit" disabled={isLoading} className="w-full">
                        <Save className="mr-2 h-4 w-4" />
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Profile Avatar & Stats */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Picture</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="relative inline-block">
                      <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <User className="h-12 w-12 text-blue-600" />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute bottom-3 right-0 rounded-full w-8 h-8 p-0"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload New Photo
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Account Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Member since:</span>
                      <span className="text-sm font-medium">{usageStats.accountAge}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Plan:</span>
                      <Badge variant="secondary">{subscriptionInfo.plan}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Files uploaded:</span>
                      <span className="text-sm font-medium">{usageStats.filesUploaded}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Charts created:</span>
                      <span className="text-sm font-medium">{usageStats.chartsCreated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Last active:</span>
                      <span className="text-sm font-medium">{usageStats.lastLogin}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Ensure your account is secure with a strong password
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          placeholder="Enter current password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="Enter new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                      />
                    </div>

                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Updating...' : 'Update Password'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Additional security options for your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-500">Add an extra layer of security</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Enable 2FA
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Login Notifications</Label>
                      <p className="text-sm text-gray-500">Get notified of new logins</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Session Timeout</Label>
                      <p className="text-sm text-gray-500">Auto-logout after inactivity</p>
                    </div>
                    <Select defaultValue="1hour">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30min">30 minutes</SelectItem>
                        <SelectItem value="1hour">1 hour</SelectItem>
                        <SelectItem value="4hours">4 hours</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Active Sessions</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">Current Session</p>
                            <p className="text-xs text-gray-500">Chrome on Windows</p>
                          </div>
                        </div>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <Switch 
                      checked={preferences.emailNotifications}
                      onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-gray-500">Receive browser push notifications</p>
                    </div>
                    <Switch 
                      checked={preferences.pushNotifications}
                      onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, pushNotifications: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Marketing Emails</Label>
                      <p className="text-sm text-gray-500">Product updates and promotional content</p>
                    </div>
                    <Switch 
                      checked={preferences.marketingEmails}
                      onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, marketingEmails: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Weekly Digest</Label>
                      <p className="text-sm text-gray-500">Summary of your weekly activity</p>
                    </div>
                    <Switch 
                      checked={preferences.weeklyDigest}
                      onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, weeklyDigest: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Data Processing Updates</Label>
                      <p className="text-sm text-gray-500">Notifications about data analysis completion</p>
                    </div>
                    <Switch 
                      checked={preferences.dataProcessingUpdates}
                      onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, dataProcessingUpdates: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Security Alerts</Label>
                      <p className="text-sm text-gray-500">Important security notifications</p>
                    </div>
                    <Switch 
                      checked={preferences.securityAlerts}
                      onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, securityAlerts: checked }))}
                    />
                  </div>
                </div>

                <Button className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Save Notification Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Display Preferences</CardTitle>
                  <CardDescription>
                    Customize your interface experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <Select value={preferences.theme} onValueChange={(value) => setPreferences(prev => ({ ...prev, theme: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System Default</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select value={preferences.language} onValueChange={(value) => setPreferences(prev => ({ ...prev, language: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select value={preferences.timezone} onValueChange={(value) => setPreferences(prev => ({ ...prev, timezone: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="EST">Eastern Time</SelectItem>
                        <SelectItem value="PST">Pacific Time</SelectItem>
                        <SelectItem value="GMT">GMT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Date Format</Label>
                    <Select value={preferences.dateFormat} onValueChange={(value) => setPreferences(prev => ({ ...prev, dateFormat: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Preferences</CardTitle>
                  <CardDescription>
                    Default settings for data analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Default Chart Type</Label>
                    <Select value={preferences.defaultChartType} onValueChange={(value) => setPreferences(prev => ({ ...prev, defaultChartType: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bar">Bar Chart</SelectItem>
                        <SelectItem value="line">Line Chart</SelectItem>
                        <SelectItem value="pie">Pie Chart</SelectItem>
                        <SelectItem value="scatter">Scatter Plot</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-save Results</Label>
                      <p className="text-sm text-gray-500">Automatically save analysis results</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Smart Suggestions</Label>
                      <p className="text-sm text-gray-500">AI-powered analysis suggestions</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Button className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>
                    Your subscription details and usage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Plan:</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {subscriptionInfo.plan}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status:</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {subscriptionInfo.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium">Billing Cycle:</span>
                    <span>{subscriptionInfo.billingCycle}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium">Amount:</span>
                    <span className="font-semibold">{subscriptionInfo.amount}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium">Next Billing:</span>
                    <span>{subscriptionInfo.nextBilling}</span>
                  </div>

                  <Separator />

                  <div>
                    <Label className="font-medium">Plan Features:</Label>
                    <ul className="mt-2 space-y-1">
                      {subscriptionInfo.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      Change Plan
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Cancel Subscription
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Usage Statistics</CardTitle>
                  <CardDescription>
                    Your current period usage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>AI Queries Used</span>
                      <span>{usageStats.aiQueriesUsed} / Unlimited</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Data Processed</span>
                      <span>{usageStats.dataProcessed}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{usageStats.filesUploaded}</div>
                      <div className="text-sm text-gray-500">Files Uploaded</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{usageStats.chartsCreated}</div>
                      <div className="text-sm text-gray-500">Charts Created</div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download Invoice
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Privacy & Data Tab */}
          <TabsContent value="data" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>
                    Control your privacy and data sharing preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Profile Visibility</Label>
                    <Select value={privacySettings.profileVisibility} onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, profileVisibility: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="team">Team Only</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Email in Profile</Label>
                      <p className="text-sm text-gray-500">Make your email visible to others</p>
                    </div>
                    <Switch 
                      checked={privacySettings.showEmail}
                      onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showEmail: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Activity Status</Label>
                      <p className="text-sm text-gray-500">Let others see when you're active</p>
                    </div>
                    <Switch 
                      checked={privacySettings.showActivity}
                      onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showActivity: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Analytics Tracking</Label>
                      <p className="text-sm text-gray-500">Help improve our service</p>
                    </div>
                    <Switch 
                      checked={privacySettings.allowAnalytics}
                      onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, allowAnalytics: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Data Sharing Opt-out</Label>
                      <p className="text-sm text-gray-500">Opt out of data sharing for research</p>
                    </div>
                    <Switch 
                      checked={privacySettings.dataSharingOptOut}
                      onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, dataSharingOptOut: checked }))}
                    />
                  </div>

                  <Button className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    Save Privacy Settings
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>
                    Export, backup, or delete your data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="font-medium">Export Account Data</Label>
                      <p className="text-sm text-gray-500 mb-2">
                        Download a copy of all your data including analyses, charts, and settings
                      </p>
                      <Button onClick={downloadAccountData} variant="outline" className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Request Data Export
                      </Button>
                    </div>

                    <Separator />

                    <div>
                      <Label className="font-medium">Data Retention</Label>
                      <p className="text-sm text-gray-500 mb-2">
                        Configure how long we keep your data
                      </p>
                      <Select defaultValue="1year">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30days">30 Days</SelectItem>
                          <SelectItem value="90days">90 Days</SelectItem>
                          <SelectItem value="1year">1 Year</SelectItem>
                          <SelectItem value="indefinite">Indefinite</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div>
                      <Label className="font-medium text-red-600">Delete Account</Label>
                      <p className="text-sm text-gray-500 mb-2">
                        Permanently delete your account and all associated data
                      </p>
                      <Button 
                        onClick={handleDeleteAccount} 
                        variant="destructive" 
                        className="w-full"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Privacy Policy & Terms</CardTitle>
                <CardDescription>
                  Important information about your data and our policies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Privacy Policy
                    <ExternalLink className="ml-auto h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Terms of Service
                    <ExternalLink className="ml-auto h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Data Policy
                    <ExternalLink className="ml-auto h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default UserProfilePage
