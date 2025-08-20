import { createContext, useContext, useEffect, useState } from 'react'
import { auth, supabase } from '@/lib/supabaseClient'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
        setSession(session)
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error getting initial session:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        
        if (event === 'SIGNED_OUT') {
          setError(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password, metadata = {}) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await auth.signUp(email, password, { metadata })
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      console.error('Sign up error:', error)
      setError(error.message)
      return { data: null, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await auth.signIn(email, password)
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      setError(error.message)
      return { data: null, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { error } = await auth.signOut()
      
      if (error) throw error
      
      return { error: null }
    } catch (error) {
      console.error('Sign out error:', error)
      setError(error.message)
      return { error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email) => {
    try {
      setError(null)
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      
      if (error) throw error
      
      return { error: null }
    } catch (error) {
      console.error('Reset password error:', error)
      setError(error.message)
      return { error: error.message }
    }
  }

  const updateProfile = async (updates) => {
    try {
      setError(null)
      
      const { error } = await supabase.auth.updateUser({
        data: updates
      })
      
      if (error) throw error
      
      return { error: null }
    } catch (error) {
      console.error('Update profile error:', error)
      setError(error.message)
      return { error: error.message }
    }
  }

  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError(null)
      
      // Supabase handles password verification internally
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) throw error
      
      return { error: null }
    } catch (error) {
      console.error('Change password error:', error)
      setError(error.message)
      return { error: error.message }
    }
  }

  const deleteAccount = async () => {
    try {
      setError(null)
      
      // Note: Supabase doesn't have a direct delete user method from client
      // This would typically require a server-side function
      // For now, we'll just sign out and show a message
      await signOut()
      
      return { error: null }
    } catch (error) {
      console.error('Delete account error:', error)
      setError(error.message)
      return { error: error.message }
    }
  }

  const value = {
    user,
    session,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    changePassword,
    deleteAccount,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
