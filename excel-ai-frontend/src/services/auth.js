// Authentication service for API calls
import apiService from './api.js'
import { api } from '../lib/api'

class AuthService {
  constructor() {
    this.token = localStorage.getItem('auth_token')
    this.user = JSON.parse(localStorage.getItem('user_data') || 'null')
  }

  // Set authorization header for API calls
  setAuthHeader() {
    if (this.token) {
      return {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    }
    return {
      'Content-Type': 'application/json'
    }
  }

  // Register new user
  async register(userData) {
    try {
      const data = await api.post('/v1/auth/register', userData);

      if (data.success) {
        this.token = data.token
        this.user = data.user
        localStorage.setItem('auth_token', this.token)
        localStorage.setItem('user_data', JSON.stringify(this.user))
        return { success: true, user: this.user }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'Registration failed. Please try again.' }
    }
  }

  // Login user
  async login(email, password) {
    try {
      const data = await api.post('/v1/auth/login', { email, password });

      if (data.success) {
        this.token = data.token
        this.user = data.user
        localStorage.setItem('auth_token', this.token)
        localStorage.setItem('user_data', JSON.stringify(this.user))
        return { success: true, user: this.user }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Login failed. Please try again.' }
    }
  }

  // Logout user
  async logout() {
    try {
      // Call logout endpoint to invalidate token on server if needed
      await api.post('/v1/auth/logout', {});
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local storage regardless of API call success
      this.token = null
      this.user = null
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
    }
  }

  // Get current user
  async getCurrentUser() {
    if (!this.token) {
      return { success: false, error: 'No authentication token' }
    }

    try {
      const data = await api.get('/v1/auth/me');

      if (data.success) {
        this.user = data.user
        localStorage.setItem('user_data', JSON.stringify(this.user))
        return { success: true, user: this.user }
      } else {
        // Token might be expired
        this.logout()
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Get current user error:', error)
      return { success: false, error: 'Failed to get user data' }
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    if (!this.token) {
      return { success: false, error: 'Authentication required' }
    }

    try {
      const data = await api.post('/v1/auth/update-profile', profileData);

      if (data.success) {
        this.user = data.user
        localStorage.setItem('user_data', JSON.stringify(this.user))
        return { success: true, user: this.user }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Update profile error:', error)
      return { success: false, error: 'Failed to update profile' }
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    if (!this.token) {
      return { success: false, error: 'Authentication required' }
    }

    try {
      const data = await api.post('/v1/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      return data;
    } catch (error) {
      console.error('Change password error:', error)
      return { success: false, error: 'Failed to change password' }
    }
  }

  // Get usage statistics
  async getUsageStats() {
    if (!this.token) {
      return { success: false, error: 'Authentication required' }
    }

    try {
      const data = await api.get('/v1/auth/usage');
      return data;
    } catch (error) {
      console.error('Get usage stats error:', error)
      return { success: false, error: 'Failed to get usage statistics' }
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!(this.token && this.user)
  }

  // Get current user data
  getUser() {
    return this.user
  }

  // Get auth token
  getToken() {
    return this.token
  }

  // Validate password strength
  validatePassword(password) {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)

    const errors = []
    
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`)
    }
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter')
    }
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter')
    }
    if (!hasNumbers) {
      errors.push('Password must contain at least one number')
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    }
  }

  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
}

// Create singleton instance
const authService = new AuthService()
export default authService
