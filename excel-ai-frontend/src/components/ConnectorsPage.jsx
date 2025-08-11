import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import apiService from '@/services/api.js'
import { 
  Plus, 
  Database, 
  FileSpreadsheet, 
  BarChart3, 
  Search, 
  TrendingUp, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Upload,
  RefreshCw
} from 'lucide-react'

const CONNECTOR_ICONS = {
  'excel': FileSpreadsheet,
  'google_sheets': FileSpreadsheet,
  'google_analytics': BarChart3,
  'google_search_console': Search,
  'google_trends': TrendingUp
}

export function ConnectorsPage() {
  const [connectors, setConnectors] = useState([])
  const [connectorTypes, setConnectorTypes] = useState({})
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newConnector, setNewConnector] = useState({
    name: '',
    connector_type: '',
    config: {}
  })
  const [error, setError] = useState(null)

  useEffect(() => {
    loadConnectors()
    loadConnectorTypes()
  }, [])

  const loadConnectors = async () => {
    try {
      setLoading(true)
      const response = await apiService.listConnectors()
      if (response.success) {
        setConnectors(response.data.items)
      } else {
        setError(response.error)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadConnectorTypes = async () => {
    try {
      const response = await apiService.getConnectorTypes()
      if (response.success) {
        setConnectorTypes(response.data)
      }
    } catch (err) {
      console.error('Failed to load connector types:', err)
    }
  }

  const handleCreateConnector = async () => {
    if (!newConnector.name || !newConnector.connector_type) {
      setError('Name and connector type are required')
      return
    }

    try {
      setCreating(true)
      setError(null)
      const response = await apiService.createConnector(newConnector)
      if (response.success) {
        setConnectors(prev => [response.data, ...prev])
        setShowCreateDialog(false)
        setNewConnector({ name: '', connector_type: '', config: {} })
      } else {
        setError(response.error)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleSync = async (connectorId) => {
    try {
      const response = await apiService.syncConnector(connectorId)
      if (response.success) {
        loadConnectors() // Refresh the list
      }
    } catch (err) {
      console.error('Sync failed:', err)
    }
  }

  const handleFileUpload = async (connectorId, file) => {
    try {
      const response = await apiService.uploadConnectorData(connectorId, file)
      if (response.success) {
        loadConnectors() // Refresh the list
      }
    } catch (err) {
      console.error('Upload failed:', err)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Error</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading connectors...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Connectors</h1>
          <p className="text-gray-600 mt-1">Connect your data in a few clicks to generate insights in seconds.</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Connector
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Connector</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  placeholder="e.g., Sales Data, Website Analytics"
                  value={newConnector.name}
                  onChange={(e) => setNewConnector(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Connector Type</label>
                <Select
                  value={newConnector.connector_type}
                  onValueChange={(value) => setNewConnector(prev => ({ ...prev, connector_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a connector type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(connectorTypes).map(([key, type]) => {
                      const Icon = CONNECTOR_ICONS[key] || Database
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center">
                            <Icon className="h-4 w-4 mr-2" />
                            {type.name}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateConnector} disabled={creating}>
                  {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Create Connector
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Available Connector Types */}
      {connectors.length === 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Available Connectors</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(connectorTypes).map(([key, type]) => {
              const Icon = CONNECTOR_ICONS[key] || Database
              return (
                <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{type.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                        {type.auth_required && (
                          <Badge variant="secondary" className="mt-2">OAuth Required</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Existing Connectors */}
      {connectors.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Connectors</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectors.map((connector) => {
              const Icon = CONNECTOR_ICONS[connector.connector_type] || Database
              const connectorType = connectorTypes[connector.connector_type] || {}
              
              return (
                <Card key={connector.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Icon className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-lg">{connector.name}</CardTitle>
                      </div>
                      {getStatusBadge(connector.status)}
                    </div>
                    <p className="text-sm text-gray-600">{connectorType.name}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Records:</span>
                      <span className="font-medium">{connector.records_count.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Columns:</span>
                      <span className="font-medium">{connector.columns_count}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Last Sync:</span>
                      <span className="font-medium">
                        {connector.last_sync 
                          ? new Date(connector.last_sync).toLocaleDateString()
                          : 'Never'
                        }
                      </span>
                    </div>
                    
                    <div className="flex space-x-2 pt-2">
                      {connector.connector_type === 'excel' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const input = document.createElement('input')
                            input.type = 'file'
                            input.accept = '.xlsx,.xls,.csv'
                            input.onchange = (e) => {
                              const file = e.target.files[0]
                              if (file) handleFileUpload(connector.id, file)
                            }
                            input.click()
                          }}
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          Upload
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSync(connector.id)}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Sync
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {error && connectors.length === 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
