import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { Zap, Clock, Star, Sparkles, AlertTriangle } from 'lucide-react'
import apiService from '@/services/api.js'

export const ModelSelector = ({ value = 'balanced', onChange, disabled = false }) => {
  const [selectedModel, setSelectedModel] = useState(value)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchPreference() {
      setLoading(true)
      setError(null)
      try {
        const resp = await apiService.getModelPreference()
        if (resp.success && resp.preferred_model) {
          setSelectedModel(resp.preferred_model)
        }
      } catch (e) {
        setError('Failed to load model preference')
      } finally {
        setLoading(false)
      }
    }
    fetchPreference()
  }, [])

  const modelOptions = [
    {
      id: 'speed',
      name: 'Speed',
      description: 'Fastest responses for quick analysis',
      icon: Zap,
      color: 'text-green-600',
      badgeColor: 'bg-green-100 text-green-800',
      features: ['Ultra-fast responses (< 2s)', 'Good for simple queries', 'Cost-efficient'],
      tradeoffs: ['Less detailed analysis', 'May miss nuanced insights'],
      models: ['gpt-4.1-mini', 'gpt-4o-mini'],
      recommended: 'Quick data exploration'
    },
    {
      id: 'balanced',
      name: 'Balanced',
      description: 'Best balance of speed and quality',
      icon: Clock,
      color: 'text-blue-600',
      badgeColor: 'bg-blue-100 text-blue-800',
      features: ['Good response times (2-5s)', 'Comprehensive analysis', 'Reliable results'],
      tradeoffs: ['Moderate response time', 'Balanced token usage'],
      models: ['gpt-4o', 'gpt-4.1-mini', 'gpt-4o-mini'],
      recommended: 'Most use cases',
      default: true
    },
    {
      id: 'quality',
      name: 'Quality',
      description: 'Highest quality analysis and insights',
      icon: Star,
      color: 'text-purple-600',
      badgeColor: 'bg-purple-100 text-purple-800',
      features: ['Detailed analysis', 'Advanced reasoning', 'Complex problem solving'],
      tradeoffs: ['Slower responses (5-10s)', 'Higher token usage'],
      models: ['gpt-4o', 'gpt-4.1-mini'],
      recommended: 'Complex analysis, reports'
    },
    {
      id: 'preview',
      name: 'Preview',
      description: 'Latest AI models with cutting-edge capabilities',
      icon: Sparkles,
      color: 'text-orange-600',
      badgeColor: 'bg-orange-100 text-orange-800',
      features: ['Latest model capabilities', 'Advanced reasoning', 'Experimental features'],
      tradeoffs: ['May have occasional issues', 'Variable response times'],
      models: ['gpt-5-preview', 'gpt-4o'],
      recommended: 'Advanced users, experimentation',
      beta: true
    }
  ]

  const handleModelChange = (modelId) => {
    setSelectedModel(modelId)
    onChange?.(modelId)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const resp = await apiService.setModelPreference(selectedModel)
      if (!resp.success) throw new Error(resp.error || 'Failed to save')
    } catch (e) {
      setError('Failed to save model preference')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-gray-500 p-4">Loading model preferences...</div>
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5" />
          <span>AI Model Preference</span>
        </CardTitle>
        <CardDescription>
          Choose your preferred AI model based on your needs for speed vs. quality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={selectedModel}
          onValueChange={handleModelChange}
          disabled={disabled}
          className="space-y-4"
        >
          {modelOptions.map((option) => {
            const Icon = option.icon
            return (
              <div key={option.id} className="space-y-3">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label
                    htmlFor={option.id}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-5 w-5 ${option.color}`} />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{option.name}</span>
                            {option.default && (
                              <Badge variant="outline" className="text-xs">
                                Recommended
                              </Badge>
                            )}
                            {option.beta && (
                              <Badge className="text-xs bg-orange-100 text-orange-800">
                                Preview
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{option.description}</p>
                        </div>
                      </div>
                      <Badge className={`${option.badgeColor} text-xs`}>
                        {option.recommended}
                      </Badge>
                    </div>
                  </Label>
                </div>

                {selectedModel === option.id && (
                  <div className="ml-6 pl-4 border-l-2 border-blue-200 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-green-700 mb-2">Features</h4>
                        <ul className="text-sm space-y-1">
                          {option.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center space-x-2">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-amber-700 mb-2">Considerations</h4>
                        <ul className="text-sm space-y-1">
                          {option.tradeoffs.map((tradeoff, idx) => (
                            <li key={idx} className="flex items-center space-x-2">
                              <AlertTriangle className="w-3 h-3 text-amber-500" />
                              <span>{tradeoff}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Model Fallback Chain</h4>
                      <div className="flex items-center space-x-2">
                        {option.models.map((model, idx) => (
                          <div key={model} className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {model}
                            </Badge>
                            {idx < option.models.length - 1 && (
                              <span className="text-gray-400">→</span>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        If the primary model is unavailable, we'll automatically use the next model in the chain
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </RadioGroup>

        {!disabled && (
          <div className="pt-4 border-t">
            <Button
              onClick={handleSave}
              className="w-full"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Apply Model Preference'}
            </Button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Your selection will be used for all future AI interactions
            </p>
            {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
          </div>
        )}

        {disabled && (
          <div className="pt-4 border-t">
            <div className="flex items-center space-x-2 text-gray-500">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Model selection is not available in your current plan</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
