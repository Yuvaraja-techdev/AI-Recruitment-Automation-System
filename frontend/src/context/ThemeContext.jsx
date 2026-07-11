import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme-mode') || 'light'
  })
  
  const [darkVariant, setDarkVariant] = useState(() => {
    return localStorage.getItem('dark-theme-variant') || 'classic-dark'
  })

  useEffect(() => {
    const root = document.documentElement
    
    // Clean up classes
    root.classList.remove('dark')
    root.removeAttribute('data-theme')

    if (theme === 'dark') {
      root.classList.add('dark')
      root.setAttribute('data-theme', darkVariant)
      localStorage.setItem('theme-mode', 'dark')
      localStorage.setItem('dark-theme-variant', darkVariant)
    } else {
      localStorage.setItem('theme-mode', 'light')
    }
  }, [theme, darkVariant])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      darkVariant,
      setDarkVariant,
      toggleTheme
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
