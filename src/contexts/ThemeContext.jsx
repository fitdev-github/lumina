import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('app_settings')
      if (saved) return JSON.parse(saved).darkMode || false
    } catch { /* ignore */ }
    return false
  })

  // Apply dark class to <html> whenever darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const toggleDarkMode = (value) => {
    const next = typeof value === 'boolean' ? value : !darkMode
    setDarkMode(next)
    // Persist into existing app_settings object
    try {
      const existing = JSON.parse(localStorage.getItem('app_settings') || '{}')
      localStorage.setItem('app_settings', JSON.stringify({ ...existing, darkMode: next }))
    } catch { /* ignore */ }
  }

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
