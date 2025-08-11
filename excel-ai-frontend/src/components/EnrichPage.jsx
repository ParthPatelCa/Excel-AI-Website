import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Heart, Tag, BookOpen, FileText, Sparkles, Download, Upload, Brain } from 'lucide-react'
import apiService from '@/services/api.js'

export function EnrichPage() {
  const [activeEnrichment, setActiveEnrichment] = useState('sentiment')
  const [inputText, setInputText] = useState('')
  const [uploadedData, setUploadedData] = useState([])
  const [selectedColumn, setSelectedColumn] = useState('')
  const [results, setResults] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [categories, setCategories] = useState(['positive', 'negative', 'neutral'])
  const [maxKeywords, setMaxKeywords] = useState(10)
  const [summaryLength, setSummaryLength] = useState('medium')

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target.result
          const lines = text.split('\n')
          const headers = lines[0].split(',')
          const data = lines.slice(1).map(line => {
            const values = line.split(',')
            const row = {}
            headers.forEach((header, index) => {
              row[header.trim()] = values[index]?.trim()
            })
            return row
          }).filter(row => Object.values(row).some(val => val))
          
          setUploadedData(data)
          if (data.length > 0) {
            setSelectedColumn(Object.keys(data[0])[0])
          }
        } catch (error) {
          console.error('Failed to parse file:', error)
        }
      }
      reader.readAsText(file)
    }
  }

  const performSentimentAnalysis = async () => {
    setIsLoading(true)
    try {
      const requestData = inputText 
        ? { text: inputText }
        : { data: uploadedData, text_column: selectedColumn }

      const response = await apiService.analyzeSentiment(requestData)
      if (response.success) {
        setResults(response.data)
      }
    } catch (error) {
      console.error('Failed to analyze sentiment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const extractKeywords = async () => {
    setIsLoading(true)
    try {
      const requestData = inputText 
        ? { text: inputText, max_keywords: maxKeywords }
        : { data: uploadedData, text_column: selectedColumn, max_keywords: maxKeywords }

      const response = await apiService.extractKeywords(requestData)
      if (response.success) {
        setResults(response.data)
      }
    } catch (error) {
      console.error('Failed to extract keywords:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const classifyText = async () => {
    setIsLoading(true)
    try {
      const requestData = inputText 
        ? { text: inputText, categories: categories }
        : { data: uploadedData, text_column: selectedColumn, categories: categories }

      const response = await apiService.classifyText(requestData)
      if (response.success) {
        setResults(response.data)
      }
    } catch (error) {
      console.error('Failed to classify text:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const summarizeText = async () => {
    setIsLoading(true)
    try {
      const requestData = inputText 
        ? { text: inputText, summary_length: summaryLength }
        : { data: uploadedData, text_column: selectedColumn, summary_length: summaryLength }

      const response = await apiService.summarizeText(requestData)
      if (response.success) {
        setResults(response.data)
      }
    } catch (error) {
      console.error('Failed to summarize text:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const performCustomEnrichment = async () => {
    if (!customPrompt.trim()) return

    setIsLoading(true)
    try {
      const requestData = inputText 
        ? { text: inputText, prompt: customPrompt }
        : { data: uploadedData, text_column: selectedColumn, prompt: customPrompt }

      const response = await apiService.customEnrichment(requestData)
      if (response.success) {
        setResults(response.data)
      }
    } catch (error) {
      console.error('Failed to perform custom enrichment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProcess = () => {
    switch (activeEnrichment) {
      case 'sentiment':
        performSentimentAnalysis()
        break
      case 'keywords':
        extractKeywords()
        break
      case 'classify':
        classifyText()
        break
      case 'summarize':
        summarizeText()
        break
      case 'custom':
        performCustomEnrichment()
        break
    }
  }

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50'
      case 'negative': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const addCategory = () => {
    const newCategory = prompt('Enter new category:')
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory])
    }
  }

  const removeCategory = (category) => {
    setCategories(categories.filter(cat => cat !== category))
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Enrich Your Data</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Enrich your data with AI-powered analysis such as sentiment analysis, keyword extraction, 
          text classification & more.
        </p>
      </div>

      <Tabs value={activeEnrichment} onValueChange={setActiveEnrichment} className="max-w-6xl mx-auto">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sentiment" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Sentiment
          </TabsTrigger>
          <TabsTrigger value="keywords" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Keywords
          </TabsTrigger>
          <TabsTrigger value="classify" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Classify
          </TabsTrigger>
          <TabsTrigger value="summarize" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Summarize
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Custom
          </TabsTrigger>
        </TabsList>

        {/* Input Section - Common to all tabs */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Input Data</CardTitle>
            <CardDescription>Provide text data for enrichment analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="text" className="w-full">
              <TabsList>
                <TabsTrigger value="text">Single Text</TabsTrigger>
                <TabsTrigger value="file">Upload File</TabsTrigger>
              </TabsList>
              
              <TabsContent value="text" className="space-y-4">
                <Textarea
                  placeholder="Enter text to analyze..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={4}
                />
              </TabsContent>
              
              <TabsContent value="file" className="space-y-4">
                <div className="space-y-4">
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                  />
                  
                  {uploadedData.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Select Text Column</label>
                      <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(uploadedData[0] || {}).map(col => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-600">
                        Loaded {uploadedData.length} rows
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <TabsContent value="sentiment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Sentiment Analysis
              </CardTitle>
              <CardDescription>
                Analyze emotional tone and sentiment in text data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleProcess} 
                disabled={(!inputText && !uploadedData.length) || isLoading}
                className="w-full"
              >
                {isLoading ? 'Analyzing Sentiment...' : 'Analyze Sentiment'}
              </Button>
            </CardContent>
          </Card>

          {results && results.results && (
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Analysis Results</CardTitle>
                {results.summary && (
                  <div className="flex gap-4 text-sm">
                    <span>Total: {results.summary.total_analyzed}</span>
                    <span className="text-green-600">Positive: {results.summary.positive}</span>
                    <span className="text-red-600">Negative: {results.summary.negative}</span>
                    <span className="text-gray-600">Neutral: {results.summary.neutral}</span>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {results.results.map((result, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={getSentimentColor(result.sentiment)}>
                          {result.sentiment}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {Math.round(result.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{result.text}</p>
                      {result.emotions && (
                        <div className="mt-2 flex gap-2 text-xs">
                          {Object.entries(result.emotions).map(([emotion, score]) => (
                            <Badge key={emotion} variant="outline">
                              {emotion}: {Math.round(score * 100)}%
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="keywords" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-blue-500" />
                Keyword Extraction
              </CardTitle>
              <CardDescription>
                Extract important keywords and phrases from text
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Max Keywords</label>
                <Select value={maxKeywords.toString()} onValueChange={(value) => setMaxKeywords(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 keywords</SelectItem>
                    <SelectItem value="10">10 keywords</SelectItem>
                    <SelectItem value="15">15 keywords</SelectItem>
                    <SelectItem value="20">20 keywords</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleProcess} 
                disabled={(!inputText && !uploadedData.length) || isLoading}
                className="w-full"
              >
                {isLoading ? 'Extracting Keywords...' : 'Extract Keywords'}
              </Button>
            </CardContent>
          </Card>

          {results && results.results && (
            <Card>
              <CardHeader>
                <CardTitle>Keywords Results</CardTitle>
                {results.summary && (
                  <div className="text-sm text-gray-600">
                    Found {results.summary.unique_keywords} unique keywords from {results.summary.total_texts_analyzed} texts
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {results.summary && results.summary.top_keywords && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Top Keywords Overall</h4>
                    <div className="flex flex-wrap gap-2">
                      {results.summary.top_keywords.map((item, index) => (
                        <Badge key={index} variant="secondary">
                          {item.keyword} ({item.frequency})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {results.results.map((result, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <p className="text-sm text-gray-700 mb-2">{result.text}</p>
                      <div className="flex flex-wrap gap-1">
                        {result.keywords.map((kw, kwIndex) => (
                          <Badge key={kwIndex} variant="outline" className="text-xs">
                            {kw.keyword} ({Math.round(kw.relevance * 100)}%)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="classify" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-500" />
                Text Classification
              </CardTitle>
              <CardDescription>
                Classify text into predefined categories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Categories</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {categories.map((category, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer">
                      {category}
                      <button 
                        onClick={() => removeCategory(category)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={addCategory}>
                  Add Category
                </Button>
              </div>
              
              <Button 
                onClick={handleProcess} 
                disabled={(!inputText && !uploadedData.length) || isLoading}
                className="w-full"
              >
                {isLoading ? 'Classifying Text...' : 'Classify Text'}
              </Button>
            </CardContent>
          </Card>

          {results && results.results && (
            <Card>
              <CardHeader>
                <CardTitle>Classification Results</CardTitle>
                {results.summary && (
                  <div className="text-sm text-gray-600">
                    Classified {results.summary.total_classified} texts • 
                    Avg confidence: {Math.round(results.summary.average_confidence * 100)}%
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {results.summary && results.summary.category_distribution && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Category Distribution</h4>
                    <div className="space-y-2">
                      {Object.entries(results.summary.category_distribution).map(([category, count]) => (
                        <div key={category} className="flex justify-between items-center">
                          <Badge variant="secondary">{category}</Badge>
                          <span className="text-sm text-gray-600">{count} texts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {results.results.map((result, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">{result.classification.category}</Badge>
                        <span className="text-sm text-gray-600">
                          {Math.round(result.classification.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{result.text}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="summarize" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-500" />
                Text Summarization
              </CardTitle>
              <CardDescription>
                Generate concise summaries of long text content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Summary Length</label>
                <Select value={summaryLength} onValueChange={setSummaryLength}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short (1-2 sentences)</SelectItem>
                    <SelectItem value="medium">Medium (2-4 sentences)</SelectItem>
                    <SelectItem value="long">Long (1-2 paragraphs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleProcess} 
                disabled={(!inputText && !uploadedData.length) || isLoading}
                className="w-full"
              >
                {isLoading ? 'Summarizing Text...' : 'Summarize Text'}
              </Button>
            </CardContent>
          </Card>

          {results && results.results && (
            <Card>
              <CardHeader>
                <CardTitle>Summarization Results</CardTitle>
                {results.summary && (
                  <div className="text-sm text-gray-600">
                    Summarized {results.summary.texts_summarized} texts • 
                    Compression: {Math.round(results.summary.compression_ratio)}%
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {results.results.map((result, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="mb-3">
                        <h4 className="font-medium text-sm text-gray-600 mb-1">Original ({result.original_length} chars)</h4>
                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{result.original_text}</p>
                      </div>
                      
                      <div className="mb-3">
                        <h4 className="font-medium text-sm text-gray-600 mb-1">Summary ({result.summary_length} chars)</h4>
                        <p className="text-sm font-medium">{result.summary}</p>
                      </div>
                      
                      {result.key_points && result.key_points.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-gray-600 mb-1">Key Points</h4>
                          <ul className="text-sm list-disc list-inside space-y-1">
                            {result.key_points.map((point, pointIndex) => (
                              <li key={pointIndex}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Custom Enrichment
              </CardTitle>
              <CardDescription>
                Use your own prompt to enrich data with AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Custom Prompt</label>
                <Textarea
                  placeholder="Enter your custom analysis prompt... (e.g., 'Extract product names and prices from this text', 'Identify customer complaints and suggestions')"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={handleProcess} 
                disabled={(!inputText && !uploadedData.length) || !customPrompt.trim() || isLoading}
                className="w-full"
              >
                {isLoading ? 'Processing...' : 'Apply Custom Enrichment'}
              </Button>
            </CardContent>
          </Card>

          {results && results.results && (
            <Card>
              <CardHeader>
                <CardTitle>Custom Enrichment Results</CardTitle>
                <div className="text-sm text-gray-600">
                  Prompt: {results.prompt_used}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {results.results.map((result, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="mb-2">
                        <h4 className="font-medium text-sm text-gray-600">Input:</h4>
                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{result.text}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-gray-600">Result:</h4>
                        <p className="text-sm font-medium">{result.result}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {results && (
        <div className="text-center">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
        </div>
      )}
    </div>
  )
}
