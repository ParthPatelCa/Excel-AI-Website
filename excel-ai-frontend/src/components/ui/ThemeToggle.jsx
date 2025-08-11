import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu.jsx'
import { useTheme } from '@/contexts/ThemeContext.jsx'

export function ThemeToggle({ variant = "ghost", size = "sm" }) {
  const { theme, setTheme, getCurrentTheme } = useTheme()

  const currentTheme = getCurrentTheme()
  
  const getIcon = () => {
    if (theme === 'system') return <Monitor className="h-4 w-4" />
    if (currentTheme === 'dark') return <Moon className="h-4 w-4" />
    return <Sun className="h-4 w-4" />
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className="h-9 w-9 p-0 transition-all duration-200 hover:scale-105 hover:rotate-12"
          aria-label="Toggle theme"
        >
          <div className="relative transition-transform duration-300">
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute inset-0 h-4 w-4 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
          </div>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className={`hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
            theme === 'light' ? 'bg-gray-100 dark:bg-gray-700' : ''
          }`}
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className={`hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
            theme === 'dark' ? 'bg-gray-100 dark:bg-gray-700' : ''
          }`}
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className={`hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
            theme === 'system' ? 'bg-gray-100 dark:bg-gray-700' : ''
          }`}
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Simple toggle without dropdown
export function SimpleThemeToggle({ className = "" }) {
  const { toggleTheme, getCurrentTheme } = useTheme()
  const currentTheme = getCurrentTheme()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className={`transition-all duration-300 hover:scale-110 hover:rotate-12 ${className}`}
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
        >
          <Sun className="h-4 w-4 mr-2" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className={theme === 'dark' ? 'bg-gray-100 dark:bg-gray-800' : ''}
        >
          <Moon className="h-4 w-4 mr-2" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className={theme === 'system' ? 'bg-gray-100 dark:bg-gray-800' : ''}
        >
          <Monitor className="h-4 w-4 mr-2" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ThemeToggle
