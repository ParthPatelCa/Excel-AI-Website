import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { useTheme } from '@/contexts/ThemeContext.jsx'

export function ThemeToggle({ variant = "ghost", size = "sm", className = "" }) {
  const { getCurrentTheme, setTheme } = useTheme()
  const currentTheme = getCurrentTheme()

  const toggleTheme = () => {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={`h-9 w-9 p-0 transition-all duration-300 hover:scale-110 hover:rotate-12 ${className}`}
      aria-label={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} theme`}
    >
      <div className="relative">
        <Sun className={`h-4 w-4 transition-all duration-500 ${
          currentTheme === 'dark' ? 'scale-0 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'
        }`} />
        <Moon className={`absolute inset-0 h-4 w-4 transition-all duration-500 ${
          currentTheme === 'dark' ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-90 opacity-0'
        }`} />
      </div>
    </Button>
  )
}

// Simple toggle without dropdown - keeping for compatibility
export function SimpleThemeToggle({ className = "" }) {
  return <ThemeToggle className={className} />
}

export default ThemeToggle
