import { supabase } from '@/lib/supabaseClient'

class SupabaseService {
  constructor() {
    this.tables = {
      users: 'users',
      analyses: 'analyses',
      connectors: 'data_connectors',
      files: 'uploaded_files',
      chat_conversations: 'chat_conversations',
      chat_messages: 'chat_messages'
    }
  }

  // Authentication helpers
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  }

  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  }

  // User operations
  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from(this.tables.users)
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  }

  async updateUserProfile(userId, updates) {
    const { data, error } = await supabase
      .from(this.tables.users)
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Analysis operations
  async createAnalysis(analysisData) {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from(this.tables.analyses)
      .insert([{
        user_id: user.id,
        ...analysisData
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async getUserAnalyses(userId, limit = 10) {
    const { data, error } = await supabase
      .from(this.tables.analyses)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  }

  async getAnalysis(id) {
    const { data, error } = await supabase
      .from(this.tables.analyses)
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  async deleteAnalysis(id) {
    const { error } = await supabase
      .from(this.tables.analyses)
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // File operations
  async uploadFile(file, bucket = 'uploads') {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file)

    if (uploadError) throw uploadError

    // Create file record in database
    const { data: fileRecord, error: dbError } = await supabase
      .from(this.tables.files)
      .insert([{
        user_id: user.id,
        file_name: file.name,
        file_path: uploadData.path,
        file_size: file.size,
        file_type: file.type,
        bucket_name: bucket
      }])
      .select()
      .single()

    if (dbError) throw dbError

    return { uploadData, fileRecord }
  }

  async getFileUrl(path, bucket = 'uploads') {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    
    return data.publicUrl
  }

  async deleteFile(id) {
    // Get file record first
    const { data: fileRecord, error: getError } = await supabase
      .from(this.tables.files)
      .select('*')
      .eq('id', id)
      .single()

    if (getError) throw getError

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(fileRecord.bucket_name)
      .remove([fileRecord.file_path])

    if (storageError) throw storageError

    // Delete database record
    const { error: dbError } = await supabase
      .from(this.tables.files)
      .delete()
      .eq('id', id)

    if (dbError) throw dbError
  }

  // Data connector operations
  async createConnector(connectorData) {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from(this.tables.connectors)
      .insert([{
        user_id: user.id,
        ...connectorData
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async getUserConnectors(userId) {
    const { data, error } = await supabase
      .from(this.tables.connectors)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  async updateConnector(id, updates) {
    const { data, error } = await supabase
      .from(this.tables.connectors)
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async deleteConnector(id) {
    const { error } = await supabase
      .from(this.tables.connectors)
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Chat operations
  async createChatConversation(title = 'New Conversation') {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from(this.tables.chat_conversations)
      .insert([{
        user_id: user.id,
        title
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async getChatConversations(userId) {
    const { data, error } = await supabase
      .from(this.tables.chat_conversations)
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  async createChatMessage(conversationId, message, role = 'user') {
    const { data, error } = await supabase
      .from(this.tables.chat_messages)
      .insert([{
        conversation_id: conversationId,
        message,
        role
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async getChatMessages(conversationId) {
    const { data, error } = await supabase
      .from(this.tables.chat_messages)
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data
  }

  // Real-time subscriptions
  subscribeToUserAnalyses(userId, callback) {
    return supabase
      .channel('user-analyses')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: this.tables.analyses,
          filter: `user_id=eq.${userId}`
        }, 
        callback
      )
      .subscribe()
  }

  subscribeToChatMessages(conversationId, callback) {
    return supabase
      .channel('chat-messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: this.tables.chat_messages,
          filter: `conversation_id=eq.${conversationId}`
        }, 
        callback
      )
      .subscribe()
  }

  // Unsubscribe from channel
  unsubscribe(subscription) {
    return supabase.removeChannel(subscription)
  }
}

export default new SupabaseService()
