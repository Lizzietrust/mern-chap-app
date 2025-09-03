import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'
type Accent = 'blue' | 'emerald' | 'violet' | 'rose' | 'amber'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  isDark: boolean
  accent: Accent
  setAccent: (accent: Accent) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  defaultAccent?: Accent
}

export function ThemeProvider({ children, defaultTheme = 'light', defaultAccent = 'blue' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage first, then system preference, then default
    const saved = localStorage.getItem('theme') as Theme
    if (saved && (saved === 'light' || saved === 'dark')) {
      return saved
    }
    
    if (defaultTheme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    
    return defaultTheme
  })

  const [accent, setAccentState] = useState<Accent>(() => {
    const saved = localStorage.getItem('accent') as Accent
    if (saved && ['blue','emerald','violet','rose','amber'].includes(saved)) {
      return saved
    }
    return defaultAccent
  })

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const setAccent = (newAccent: Accent) => {
    setAccentState(newAccent)
    localStorage.setItem('accent', newAccent)
  }

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        theme === 'dark' ? '#1f2937' : '#ffffff'
      )
    }
  }, [theme])

  // Apply accent class to document
  useEffect(() => {
    const root = document.documentElement
    const accents: Accent[] = ['blue','emerald','violet','rose','amber']
    root.classList.remove(...accents.map(a => `accent-${a}`))
    root.classList.add(`accent-${accent}`)
  }, [accent])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      const savedTheme = localStorage.getItem('theme')
      // Only auto-switch if user hasn't manually set a preference
      if (!savedTheme) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
    accent,
    setAccent,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
} 