// PWA utilities for offline functionality and app-like features
import React from 'react'
import { useToast } from '@/hooks/useToast.js'

class PWAService {
  constructor() {
    this.isOnline = navigator.onLine
    this.installPrompt = null
    this.toast = null
    
    this.initializeEventListeners()
  }

  initializeEventListeners() {
    // Online/Offline detection
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))
    
    // PWA install prompt
    window.addEventListener('beforeinstallprompt', this.handleInstallPrompt.bind(this))
    
    // Service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', this.handleSWUpdate.bind(this))
    }
  }

  setToast(toastFunction) {
    this.toast = toastFunction
  }

  handleOnline() {
    this.isOnline = true
    if (this.toast) {
      this.toast.showSuccess('Back online! All features restored.')
    }
    this.syncPendingData()
  }

  handleOffline() {
    this.isOnline = false
    if (this.toast) {
      this.toast.showWarning('You\'re offline. Some features may be limited.')
    }
  }

  handleInstallPrompt(e) {
    e.preventDefault()
    this.installPrompt = e
  }

  handleSWUpdate() {
    if (this.toast) {
      this.toast.showInfo('App updated! Please refresh to get the latest version.')
    }
  }

  // Check if app can be installed
  canInstall() {
    return this.installPrompt !== null
  }

  // Prompt user to install PWA
  async promptInstall() {
    if (!this.installPrompt) return false

    const result = await this.installPrompt.prompt()
    const outcome = await result.userChoice
    
    if (outcome === 'accepted') {
      this.installPrompt = null
      return true
    }
    return false
  }

  // Cache management
  async clearCache() {
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
    }
  }

  // Offline storage for form data
  saveOfflineData(key, data) {
    try {
      const offlineData = JSON.parse(localStorage.getItem('offlineData') || '{}')
      offlineData[key] = {
        data,
        timestamp: Date.now()
      }
      localStorage.setItem('offlineData', JSON.stringify(offlineData))
    } catch (error) {
      console.error('Failed to save offline data:', error)
    }
  }

  getOfflineData(key) {
    try {
      const offlineData = JSON.parse(localStorage.getItem('offlineData') || '{}')
      return offlineData[key]?.data || null
    } catch (error) {
      console.error('Failed to get offline data:', error)
      return null
    }
  }

  // Sync pending data when back online
  async syncPendingData() {
    try {
      const offlineData = JSON.parse(localStorage.getItem('offlineData') || '{}')
      const pendingKeys = Object.keys(offlineData)
      
      if (pendingKeys.length > 0) {
        // Sync logic here - send pending data to server
        console.log('Syncing pending data:', pendingKeys)
        
        // Clear synced data
        localStorage.removeItem('offlineData')
      }
    } catch (error) {
      console.error('Failed to sync offline data:', error)
    }
  }

  // Network status
  getNetworkStatus() {
    return {
      online: this.isOnline,
      connectionType: navigator.connection?.effectiveType || 'unknown',
      downlink: navigator.connection?.downlink || 0
    }
  }
}

export const pwaService = new PWAService()

// React hook for PWA features
export function usePWA() {
  const { showSuccess, showWarning, showInfo } = useToast()
  
  React.useEffect(() => {
    pwaService.setToast({ showSuccess, showWarning, showInfo })
  }, [showSuccess, showWarning, showInfo])

  return {
    isOnline: pwaService.isOnline,
    canInstall: pwaService.canInstall(),
    promptInstall: pwaService.promptInstall.bind(pwaService),
    clearCache: pwaService.clearCache.bind(pwaService),
    saveOfflineData: pwaService.saveOfflineData.bind(pwaService),
    getOfflineData: pwaService.getOfflineData.bind(pwaService),
    networkStatus: pwaService.getNetworkStatus()
  }
}

export default PWAService
