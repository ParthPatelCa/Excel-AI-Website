// Enhanced API service with caching, retry logic, and performance optimizations
import { LoadingSpinner } from '@/components/ui/alerts.jsx'

class EnhancedApiService {
  constructor() {
    this.cache = new Map()
    this.pendingRequests = new Map()
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'
  }

  // Response caching for GET requests
  getCacheKey(url, options = {}) {
    return `${url}_${JSON.stringify(options.params || {})}`
  }

  // Debounced requests to prevent rapid duplicate calls
  debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  // Request deduplication
  async makeRequest(url, options = {}) {
    const cacheKey = this.getCacheKey(url, options)
    
    // Return cached response if available and fresh
    if (options.cache !== false && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < (options.cacheTime || 300000)) { // 5 min default
        return cached.data
      }
    }

    // Deduplicate pending requests
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)
    }

    const requestPromise = this._executeRequest(url, options)
    this.pendingRequests.set(cacheKey, requestPromise)

    try {
      const result = await requestPromise
      
      // Cache successful GET requests
      if (options.method === 'GET' || !options.method) {
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        })
      }

      return result
    } finally {
      this.pendingRequests.delete(cacheKey)
    }
  }

  // Core request execution with retry logic
  async _executeRequest(url, options = {}) {
    const maxRetries = options.retries || 3
    const retryDelay = options.retryDelay || 1000

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000)

        const response = await fetch(`${this.baseURL}${url}`, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            ...options.headers
          }
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        return await response.json()
      } catch (error) {
        if (attempt === maxRetries - 1) throw error
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)))
      }
    }
  }

  // Optimized file upload with progress and compression
  async uploadFile(file, onProgress, options = {}) {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      
      // Compress large files if needed
      if (file.size > 5 * 1024 * 1024 && file.type.includes('image')) { // 5MB+
        this.compressImage(file).then(compressedFile => {
          formData.append('file', compressedFile)
          this._performUpload(formData, onProgress, options, resolve, reject)
        })
      } else {
        formData.append('file', file)
        this._performUpload(formData, onProgress, options, resolve, reject)
      }
    })
  }

  _performUpload(formData, onProgress, options, resolve, reject) {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = (event.loaded / event.total) * 100
        onProgress(Math.round(percentComplete))
      }
    })

    xhr.addEventListener('load', () => {
      try {
        const response = JSON.parse(xhr.responseText)
        resolve(response)
      } catch (error) {
        reject(new Error('Invalid response format'))
      }
    })

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'))
    })

    xhr.open('POST', `${this.baseURL}${options.endpoint || '/v1/excel/upload'}`)
    xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('auth_token')}`)
    xhr.send(formData)
  }

  // Image compression for better performance
  async compressImage(file, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        const maxWidth = 1920
        const maxHeight = 1080
        let { width, height } = img

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(resolve, file.type, quality)
      }

      img.src = URL.createObjectURL(file)
    })
  }

  // Clear cache when needed
  clearCache() {
    this.cache.clear()
  }

  // Preload critical data
  async preloadCriticalData() {
    try {
      await Promise.all([
        this.makeRequest('/v1/health'),
        this.makeRequest('/v1/user/profile', { cache: true })
      ])
    } catch (error) {
      console.warn('Failed to preload critical data:', error)
    }
  }
}

export const enhancedApiService = new EnhancedApiService()
export default enhancedApiService
