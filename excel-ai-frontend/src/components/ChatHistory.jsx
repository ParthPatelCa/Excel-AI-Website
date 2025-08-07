import { useState } from 'react'
import { History, MessageSquare, Bot, User, Trash2, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { ScrollArea } from '@/components/ui/scroll-area.jsx'
import { Badge } from '@/components/ui/badge.jsx'

export const ChatHistory = ({ onLoadConversation, onError }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [conversations, setConversations] = useState([])

  // Load conversations from localStorage on component mount
  useState(() => {
    const savedConversations = localStorage.getItem('excel-ai-chat-history')
    if (savedConversations) {
      try {
        setConversations(JSON.parse(savedConversations))
      } catch (error) {
        console.error('Failed to load chat history:', error)
      }
    }
  }, [])

  const saveConversation = (messages, fileName) => {
    if (messages.length < 2) return // Don't save if no actual conversation

    const conversation = {
      id: Date.now(),
      fileName: fileName || 'Unknown File',
      messages: messages,
      timestamp: new Date(),
      messageCount: messages.length,
      lastQuestion: messages.filter(m => m.type === 'user').pop()?.content || 'No question'
    }

    const updatedConversations = [conversation, ...conversations.slice(0, 49)] // Keep last 50
    setConversations(updatedConversations)
    localStorage.setItem('excel-ai-chat-history', JSON.stringify(updatedConversations))
  }

  const deleteConversation = (conversationId) => {
    const updatedConversations = conversations.filter(c => c.id !== conversationId)
    setConversations(updatedConversations)
    localStorage.setItem('excel-ai-chat-history', JSON.stringify(updatedConversations))
  }

  const clearAllHistory = () => {
    setConversations([])
    localStorage.removeItem('excel-ai-chat-history')
  }

  const filteredConversations = conversations.filter(conversation =>
    conversation.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.lastQuestion.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now - time) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return time.toLocaleDateString()
  }

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardTitle className="flex items-center justify-between text-gray-800">
          <div className="flex items-center">
            <div className="bg-indigo-500 p-2 rounded-lg mr-3 shadow-sm">
              <History className="h-5 w-5 text-white" />
            </div>
            <div>
              <span>Chat History</span>
              <p className="text-sm text-gray-600 font-normal mt-1">
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''} saved
              </p>
            </div>
          </div>
          {conversations.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllHistory}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {/* Search */}
        {conversations.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Conversations List */}
        {filteredConversations.length > 0 ? (
          <ScrollArea className="h-96 w-full">
            <div className="space-y-3 pr-4">
              {filteredConversations.map((conversation) => (
                <Card key={conversation.id} className="cursor-pointer hover:shadow-md transition-all duration-200 border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                          <h3 className="font-medium text-gray-800 truncate">
                            {conversation.fileName}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {conversation.messageCount} messages
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          Last question: "{conversation.lastQuestion}"
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(conversation.timestamp)}
                          </span>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (onLoadConversation) {
                                  onLoadConversation(conversation.messages)
                                }
                              }}
                              className="h-7 px-2 text-xs"
                            >
                              Load
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteConversation(conversation.id)
                              }}
                              className="h-7 w-7 p-0 text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-medium text-gray-700 mb-2">No conversation history</h3>
            <p className="text-sm">Start asking questions about your data to build up your chat history.</p>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-medium text-gray-700 mb-2">No matching conversations</h3>
            <p className="text-sm">Try adjusting your search terms.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  // Expose the saveConversation method to parent components
  ChatHistory.saveConversation = saveConversation
}
