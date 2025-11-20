import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark'

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  success: string
  warning: string
  error: string
  info: string
}

export interface ThemeConfig {
  mode: ThemeMode
  colors: ThemeColors
}

const DEFAULT_THEME: ThemeConfig = {
  mode: 'dark',
  colors: {
    primary: '#3b82f6', // blue-500
    secondary: '#8b5cf6', // purple-500
    accent: '#10b981', // green-500
    success: '#10b981', // green-500
    warning: '#f59e0b', // amber-500
    error: '#ef4444', // red-500
    info: '#06b6d4', // cyan-500
  },
}

interface ThemeContextType {
  theme: ThemeConfig
  toggleTheme: () => void
  setThemeMode: (mode: ThemeMode) => void
  updateColor: (colorKey: keyof ThemeColors, value: string) => void
  resetColors: () => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    // Carregar tema salvo do localStorage ou usar padrão
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme)
        // Aplicar tema imediatamente no carregamento
        if (parsed.mode === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        return parsed
      } catch {
        // Tema padrão é dark
        document.documentElement.classList.add('dark')
        return DEFAULT_THEME
      }
    }
    // Tema padrão é dark
    document.documentElement.classList.add('dark')
    return DEFAULT_THEME
  })

  // Aplicar tema ao documento
  useEffect(() => {
    const root = document.documentElement
    
    // Aplicar modo claro/escuro
    if (theme.mode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // Aplicar cores customizadas como variáveis CSS
    root.style.setProperty('--color-primary', theme.colors.primary)
    root.style.setProperty('--color-secondary', theme.colors.secondary)
    root.style.setProperty('--color-accent', theme.colors.accent)
    root.style.setProperty('--color-success', theme.colors.success)
    root.style.setProperty('--color-warning', theme.colors.warning)
    root.style.setProperty('--color-error', theme.colors.error)
    root.style.setProperty('--color-info', theme.colors.info)
  }, [theme])

  // Salvar tema no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('theme', JSON.stringify(theme))
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => ({
      ...prev,
      mode: prev.mode === 'dark' ? 'light' : 'dark',
    }))
  }, [])

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setTheme((prev) => ({ ...prev, mode }))
  }, [])

  const updateColor = useCallback((colorKey: keyof ThemeColors, value: string) => {
    setTheme((prev) => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value,
      },
    }))
  }, [])

  const resetColors = useCallback(() => {
    setTheme((prev) => ({
      ...prev,
      colors: DEFAULT_THEME.colors,
    }))
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemeMode, updateColor, resetColors }}>
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

