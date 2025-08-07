import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, Bot, User, Loader2, Copy, CheckCircle, Sparkles, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { ScrollArea } from '@/components/ui/scroll-area.jsx'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip.jsx'
import apiService from '@/services/api.js'

export const ChatInterface = ({ data, onError, messages: externalMessages, onMessagesChange }) => {
  const [internalMessages, setInternalMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hi! I'm your AI data analyst. Ask me anything about your data - trends, patterns, specific calculations, or insights you'd like to explore.",
      timestamp: new Date()
    }
  ])
  
  // Use external messages if provided, otherwise use internal state
  const messages = externalMessages || internalMessages
  const setMessages = onMessagesChange || setInternalMessages
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState(null)
  const scrollAreaRef = useRef(null)
  const textareaRef = useRef(null)

  const suggestedQuestions = [
    "What are the main trends in this data?",
    "Show me the top performing categories",
    "Are there any outliers or anomalies?",
    "What patterns do you see over time?",
    "Calculate the correlation between columns",
    "Summarize the key insights"
  ]

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages, isLoading])

  // Focus textarea when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  const regenerateResponse = async (originalQuestion) => {
    if (!originalQuestion || isLoading) return

    setIsLoading(true)

    try {
      const response = await apiService.queryData(data, originalQuestion)
      
      if (response.success) {
        const botMessage = {
          id: Date.now(),
          type: 'bot',
          content: response.response,
          timestamp: new Date(),
          originalQuestion: originalQuestion
        }
        setMessages(prev => [...prev, botMessage])
      } else {
        throw new Error('Failed to regenerate AI response')
      }
    } catch (error) {
      console.error('Regenerate error:', error)
      const errorMessage = {
        id: Date.now(),
        type: 'bot',
        content: "I'm sorry, I encountered an error while regenerating the response. Please try asking your question again.",
        timestamp: new Date(),
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
      
      if (onError) {
        onError(`Failed to regenerate response: ${error.message}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const handleSendMessage = async () => {
    if (!currentQuestion.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: currentQuestion,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setCurrentQuestion('')
    setIsLoading(true)

    try {
      const response = await apiService.queryData(data, currentQuestion)
      
      if (response.success) {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: response.response,
          timestamp: new Date(),
          originalQuestion: currentQuestion
        }
        setMessages(prev => [...prev, botMessage])
      } else {
        throw new Error('Failed to get AI response')
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: "I'm sorry, I encountered an error while processing your question. Please try again with a different question.",
        timestamp: new Date(),
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
      
      if (onError) {
        onError(`Chat error: ${error.message}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestedQuestion = (question) => {
    setCurrentQuestion(question)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center text-gray-800">
          <div className="bg-blue-500 p-2 rounded-lg mr-3 shadow-sm">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span>AI Data Chat</span>
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-600/10 text-blue-700 border border-blue-200 uppercase tracking-wide">
                {import.meta.env.VITE_OPENAI_MODEL || 'gpt-5-preview'}
              </span>
            </div>
            <p className="text-sm text-gray-600 font-normal mt-1">
              Powered by advanced AI • {messages.length - 1} {messages.length === 2 ? 'message' : 'messages'}
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {/* Chat Messages */}
        <ScrollArea ref={scrollAreaRef} className="h-96 w-full rounded-lg border border-gray-200 bg-white shadow-inner">
          <div className="space-y-4 p-4">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 shadow-sm transition-all duration-200 hover:shadow-md ${
                    message.type === 'user'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                      : message.isError
                      ? 'bg-gradient-to-br from-red-50 to-red-100 border border-red-200'
                      : 'bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {message.type === 'bot' && (
                      <div className={`p-1.5 rounded-full flex-shrink-0 ${
                        message.isError ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        <Bot className={`h-4 w-4 ${
                          message.isError ? 'text-red-500' : 'text-blue-500'
                        }`} />
                      </div>
                    )}
                    {message.type === 'user' && (
                      <div className="p-1.5 rounded-full bg-blue-400 flex-shrink-0">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className={`text-sm leading-relaxed ${
                          message.type === 'user' ? 'text-white' : 
                          message.isError ? 'text-red-700' : 'text-gray-800'
                        }`}>
                          {message.content}
                        </p>
                        {message.type === 'bot' && !message.isError && (
                          <div className="flex items-center space-x-1 ml-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => regenerateResponse(message.originalQuestion)}
                                  >
                                    <RefreshCw className="h-3 w-3 text-gray-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Regenerate response</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => copyToClipboard(message.content, message.id)}
                                  >
                                    {copiedMessageId === message.id ? (
                                      <CheckCircle className="h-3 w-3 text-green-500" />
                                    ) : (
                                      <Copy className="h-3 w-3 text-gray-500" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{copiedMessageId === message.id ? 'Copied!' : 'Copy response'}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )}
                      </div>
                      <p className={`text-xs mt-2 flex items-center space-x-1 ${
                        message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <span>{message.timestamp.toLocaleTimeString()}</span>
                        {message.type === 'bot' && !message.isError && (
                          <>
                            <span>•</span>
                            <span>AI Response</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading message with enhanced animation */}
            {isLoading && (
              <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-4 max-w-[85%] shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 rounded-full bg-blue-100">
                      <Bot className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">Analyzing your question...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Suggested Questions */}
        {messages.length <= 1 && (
          <div className="space-y-3 animate-in fade-in-50 duration-500">
            <p className="text-sm font-medium text-gray-700 flex items-center">
              <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
              Suggested questions to get started:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {suggestedQuestions.map((question, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 p-3 text-left justify-start h-auto whitespace-normal hover:shadow-sm"
                  onClick={() => handleSuggestedQuestion(question)}
                >
                  <div className="flex items-start space-x-2 w-full">
                    <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0 opacity-60" />
                    <span className="text-xs">{question}</span>
                  </div>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="space-y-3">
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={currentQuestion}
                onChange={(e) => setCurrentQuestion(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything about your data..."
                className="min-h-12 max-h-32 resize-none pr-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl shadow-sm transition-all duration-200"
                disabled={isLoading}
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                {currentQuestion.length}/500
              </div>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!currentQuestion.trim() || isLoading || currentQuestion.length > 500}
              size="icon"
              className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200 self-end"
            >
              {isLoading ? (
                <div className="flex space-x-0.5">
                  <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          
          {/* Character limit warning */}
          {currentQuestion.length > 400 && (
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
              ⚠️ Keep questions under 500 characters for best results
            </p>
          )}
        </div>

        {/* Enhanced Help Text */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
          <div className="flex items-start space-x-3">
            <div className="p-1 bg-blue-100 rounded-full">
              <Sparkles className="h-4 w-4 text-blue-600" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-800">Pro Tips for Better Insights:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Be specific: "What's the average revenue by region?" vs "Tell me about revenue"</li>
                <li>• Ask about trends: "Show me sales growth over the last 6 months"</li>
                <li>• Request comparisons: "Compare Q1 vs Q2 performance"</li>
                <li>• Identify patterns: "Are there any seasonal trends in the data?"</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
