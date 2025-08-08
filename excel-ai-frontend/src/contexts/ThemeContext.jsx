import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Check for saved theme preference or default to light
    const saved = localStorage.getItem('theme')
    return saved || 'light'
  })

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement
    
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    
    // Save preference
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark'
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
