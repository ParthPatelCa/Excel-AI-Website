import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'

export function UserProfilePageSimple({ onNavigateBack }) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
              <p className="text-gray-600 mt-1">Manage your profile and account settings</p>
            </div>
            <Button onClick={onNavigateBack} variant="outline">
              Back to Dashboard
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is a simplified profile page to test the component.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default UserProfilePageSimple
