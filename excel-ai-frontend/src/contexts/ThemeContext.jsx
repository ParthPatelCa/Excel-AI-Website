import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Check for saved theme preference or default to system
    const saved = localStorage.getItem('datasense-ui-theme')
    return saved || 'system'
  })

  useEffect(() => {
    const root = document.documentElement
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark')
    
    if (theme === 'system') {
      // Use system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      // Use explicit theme
      root.classList.add(theme)
    }
    
    // Save preference
    localStorage.setItem('datasense-ui-theme', theme)
  }, [theme])

  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      const handleChange = () => {
        const root = document.documentElement
        root.classList.remove('light', 'dark')
        root.classList.add(mediaQuery.matches ? 'dark' : 'light')
      }
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'light') return 'dark'
      if (prev === 'dark') return 'system'
      return 'light'
    })
  }

  const getCurrentTheme = () => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme
  }

  const value = {
    theme,
    setTheme,
    toggleTheme,
    getCurrentTheme,
    isDark: getCurrentTheme() === 'dark',
    isSystem: theme === 'system'
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Theme-aware component styles
export const themeStyles = {
  card: {
    light: 'bg-white border-gray-200 shadow-sm',
    dark: 'bg-gray-800 border-gray-700 shadow-lg'
  },
  text: {
    light: 'text-gray-900',
    dark: 'text-gray-100'
  },
  textSecondary: {
    light: 'text-gray-600',
    dark: 'text-gray-400'
  },
  background: {
    light: 'bg-gray-50',
    dark: 'bg-gray-900'
  },
  border: {
    light: 'border-gray-200',
    dark: 'border-gray-700'
  }
}
