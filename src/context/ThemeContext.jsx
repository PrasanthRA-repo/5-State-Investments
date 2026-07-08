import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const ThemeContext = createContext(null)
const STORAGE_KEY = '5sg-theme'

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light'
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch (e) {
    // localStorage unavailable (private browsing etc) -- fall through
  }
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Light/dark mode for the whole app. Applies/removes the `dark` class on
// <html> (Tailwind's darkMode: 'class' strategy) and persists the choice so
// it survives a reload. index.html also inlines a tiny pre-paint script that
// reads the same localStorage key, so there's no light-mode flash before
// React mounts.
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch (e) {
      // ignore -- non-fatal if storage is unavailable
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = { theme, isDark: theme === 'dark', toggleTheme, setTheme }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
