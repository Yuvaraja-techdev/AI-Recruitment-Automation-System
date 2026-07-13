import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sun, Moon, Palette, Check, X, Sparkles, Star, Search, 
  Shuffle, Clock, Download, Upload, Sliders 
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

// Color manipulation helper to automatically calculate borders for custom configurations
const lightenColor = (hex, percent) => {
  try {
    let num = parseInt(hex.replace("#", ""), 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) + amt,
        G = (num >> 8 & 0x00FF) + amt,
        B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 0 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 0 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 0 ? 0 : B : 255)).toString(16).slice(1);
  } catch {
    return hex;
  }
}

// Miniature Dashboard component to preview themes dynamically
const MiniatureDashboard = ({ preview }) => {
  return (
    <div 
      style={{ backgroundColor: preview.bg, borderColor: preview.border }}
      className="h-16 w-full rounded-xl border relative overflow-hidden flex flex-col transition-all duration-300"
    >
      {/* Top Browser Header */}
      <div 
        style={{ backgroundColor: preview.card, borderColor: preview.border }}
        className="h-3 w-full border-b flex items-center justify-between px-2"
      >
        <div className="flex gap-0.5">
          <div className="w-1 h-1 rounded-full bg-red-400/80" />
          <div className="w-1 h-1 rounded-full bg-yellow-400/80" />
          <div className="w-1 h-1 rounded-full bg-green-400/80" />
        </div>
        <div className="w-10 h-0.5 rounded-full opacity-20" style={{ backgroundColor: preview.text }} />
      </div>
      
      <div className="flex-grow flex overflow-hidden">
        {/* Sidebar */}
        <div 
          style={{ backgroundColor: preview.sidebar, borderColor: preview.border }}
          className="w-8 border-r p-1 space-y-0.5"
        >
          <div className="h-1 w-full rounded opacity-30" style={{ backgroundColor: preview.accent }} />
          <div className="h-0.5 w-full rounded opacity-20" style={{ backgroundColor: preview.text }} />
          <div className="h-0.5 w-2/3 rounded opacity-15" style={{ backgroundColor: preview.text }} />
          <div className="h-0.5 w-3/4 rounded opacity-15" style={{ backgroundColor: preview.text }} />
        </div>
        
        {/* Main Dashboard Area */}
        <div className="flex-grow p-1 flex flex-col justify-between overflow-hidden">
          <div className="flex gap-1">
            <div 
              style={{ backgroundColor: preview.card, borderColor: preview.border }}
              className="h-5 flex-grow rounded border p-0.5 flex flex-col justify-between"
            >
              <div className="h-0.5 w-3/4 rounded opacity-25" style={{ backgroundColor: preview.text }} />
              <div className="h-1.5 w-full flex items-end gap-0.5">
                <div className="w-0.5 h-1 opacity-70" style={{ backgroundColor: preview.accent }} />
                <div className="w-0.5 h-1.5 opacity-90" style={{ backgroundColor: preview.accent }} />
                <div className="w-0.5 h-0.5 opacity-50" style={{ backgroundColor: preview.accent }} />
              </div>
            </div>
            <div 
              style={{ backgroundColor: preview.card, borderColor: preview.border }}
              className="h-5 flex-grow rounded border p-0.5 flex flex-col justify-between"
            >
              <div className="h-0.5 w-2/3 rounded opacity-25" style={{ backgroundColor: preview.text }} />
              <div className="h-1 w-1/2 rounded opacity-40" style={{ backgroundColor: preview.accent }} />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="h-0.5 w-5 rounded opacity-20" style={{ backgroundColor: preview.text }} />
            <div 
              style={{ backgroundColor: preview.accent }}
              className="h-2.5 w-4 rounded-sm flex items-center justify-center"
            >
              <div className="h-0.5 w-2 bg-white opacity-80" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ThemeSwitcher = () => {
  const { theme, setTheme, darkVariant, setDarkVariant } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('themes') // 'themes' | 'custom'
  const [searchTerm, setSearchTerm] = useState('')
  const menuRef = useRef(null)

  // Custom theme configuration state
  const [customConfig, setCustomConfig] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('custom-theme-config')) || {
        bg: '#0f0f12',
        cardBg: '#181820',
        sidebarBg: '#181820',
        border: '#2e2e38',
        accent: '#8b5cf6'
      }
    } catch {
      return {
        bg: '#0f0f12',
        cardBg: '#181820',
        sidebarBg: '#181820',
        border: '#2e2e38',
        accent: '#8b5cf6'
      }
    }
  })

  // Favorites & Recently Used state
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('theme-favorites')) || []
    } catch {
      return []
    }
  })
  const [recentlyUsed, setRecentlyUsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('theme-recently-used')) || []
    } catch {
      return []
    }
  })

  // Time-based automatic switching
  const [autoTheme, setAutoTheme] = useState(() => {
    return localStorage.getItem('auto-theme-enabled') === 'true'
  })

  // Custom Theme config import/export helpers
  const [importText, setImportText] = useState('')
  const [importStatus, setImportStatus] = useState({ type: '', msg: '' })

  const themesList = [
    {
      id: 'light-mode',
      name: 'Light Mode',
      desc: 'Clean & minimal workspace',
      themeKey: 'light',
      variantKey: null,
      accentColor: '#4f46e5',
      isDark: false,
      preview: {
        bg: '#f8fafc',
        card: '#ffffff',
        sidebar: '#ffffff',
        border: '#e2e8f0',
        accent: '#4f46e5',
        text: '#0f172a'
      }
    },
    {
      id: 'classic-dark',
      name: 'Classic Navy',
      desc: 'Corporate & professional navy',
      themeKey: 'dark',
      variantKey: 'classic-dark',
      accentColor: '#6366f1',
      isDark: true,
      preview: {
        bg: '#0a0f1d',
        card: '#111827',
        sidebar: '#111827',
        border: '#1f2937',
        accent: '#6366f1',
        text: '#f3f4f6'
      }
    },
    {
      id: 'midnight',
      name: 'Midnight Blue',
      desc: 'Deep ocean sapphire vibes',
      themeKey: 'dark',
      variantKey: 'midnight',
      accentColor: '#3b82f6',
      isDark: true,
      preview: {
        bg: '#060b18',
        card: '#0d1527',
        sidebar: '#0d1527',
        border: '#1e293b',
        accent: '#3b82f6',
        text: '#e2e8f0'
      }
    },
    {
      id: 'charcoal',
      name: 'Charcoal Slate',
      desc: 'Neutral graphite slate gray',
      themeKey: 'dark',
      variantKey: 'charcoal',
      accentColor: '#71717a',
      isDark: true,
      preview: {
        bg: '#18181b',
        card: '#27272a',
        sidebar: '#27272a',
        border: '#3f3f46',
        accent: '#71717a',
        text: '#f4f4f5'
      }
    },
    {
      id: 'deep-space',
      name: 'Deep Space',
      desc: 'Premium contrast OLED black',
      themeKey: 'dark',
      variantKey: 'deep-space',
      accentColor: '#ffffff',
      isDark: true,
      preview: {
        bg: '#000000',
        card: '#09090b',
        sidebar: '#09090b',
        border: '#27272a',
        accent: '#ffffff',
        text: '#ffffff'
      }
    },
    {
      id: 'aurora-green',
      name: 'Aurora Green',
      desc: 'Northern lights dark emerald',
      themeKey: 'dark',
      variantKey: 'aurora-green',
      accentColor: '#10b981',
      isDark: true,
      preview: {
        bg: '#040c0a',
        card: '#0b1713',
        sidebar: '#0b1713',
        border: '#142e26',
        accent: '#10b981',
        text: '#e6f4f0'
      }
    },
    {
      id: 'cyber-blue',
      name: 'Cyber Blue',
      desc: 'Cyber dark neon cyan',
      themeKey: 'dark',
      variantKey: 'cyber-blue',
      accentColor: '#06b6d4',
      isDark: true,
      preview: {
        bg: '#020617',
        card: '#0f172a',
        sidebar: '#0f172a',
        border: '#1e293b',
        accent: '#06b6d4',
        text: '#e2e8f0'
      }
    },
    {
      id: 'royal-purple',
      name: 'Royal Purple',
      desc: 'Dark violet royal luxury',
      themeKey: 'dark',
      variantKey: 'royal-purple',
      accentColor: '#8b5cf6',
      isDark: true,
      preview: {
        bg: '#0c0714',
        card: '#160e25',
        sidebar: '#160e25',
        border: '#26193e',
        accent: '#8b5cf6',
        text: '#f1eef8'
      }
    },
    {
      id: 'crimson-night',
      name: 'Crimson Night',
      desc: 'Obsidian dark scarlet crimson',
      themeKey: 'dark',
      variantKey: 'crimson-night',
      accentColor: '#ef4444',
      isDark: true,
      preview: {
        bg: '#0f0507',
        card: '#1a0b0d',
        sidebar: '#1a0b0d',
        border: '#331518',
        accent: '#ef4444',
        text: '#fdf2f2'
      }
    },
    {
      id: 'deep-teal',
      name: 'Deep Teal',
      desc: 'Dark marine rich oceanic teal',
      themeKey: 'dark',
      variantKey: 'deep-teal',
      accentColor: '#0ea5e9',
      isDark: true,
      preview: {
        bg: '#020b0d',
        card: '#07171b',
        sidebar: '#07171b',
        border: '#0e2b31',
        accent: '#0ea5e9',
        text: '#e1f0f3'
      }
    },
    {
      id: 'forest-emerald',
      name: 'Forest Emerald',
      desc: 'Deep botanical emerald green',
      themeKey: 'dark',
      variantKey: 'forest-emerald',
      accentColor: '#22c55e',
      isDark: true,
      preview: {
        bg: '#020a03',
        card: '#06170a',
        sidebar: '#06170a',
        border: '#0d2b14',
        accent: '#22c55e',
        text: '#e2f2e5'
      }
    },
    {
      id: 'obsidian-gold',
      name: 'Obsidian Gold',
      desc: 'Onyx black with elegant gold',
      themeKey: 'dark',
      variantKey: 'obsidian-gold',
      accentColor: '#fbbf24',
      isDark: true,
      preview: {
        bg: '#080806',
        card: '#14130d',
        sidebar: '#14130d',
        border: '#28251b',
        accent: '#fbbf24',
        text: '#fbf5e5'
      }
    },
    {
      id: 'titanium-grey',
      name: 'Titanium Grey',
      desc: 'Slate metal titanium grey',
      themeKey: 'dark',
      variantKey: 'titanium-grey',
      accentColor: '#cbd5e1',
      isDark: true,
      preview: {
        bg: '#1a1c23',
        card: '#252833',
        sidebar: '#252833',
        border: '#353b4d',
        accent: '#cbd5e1',
        text: '#eef1f6'
      }
    },
    {
      id: 'graphite-silver',
      name: 'Graphite Silver',
      desc: 'Matte graphite with pure silver',
      themeKey: 'dark',
      variantKey: 'graphite-silver',
      accentColor: '#d1d5db',
      isDark: true,
      preview: {
        bg: '#1c1c1e',
        card: '#2c2c2e',
        sidebar: '#2c2c2e',
        border: '#3a3a3c',
        accent: '#d1d5db',
        text: '#f2f2f7'
      }
    },
    {
      id: 'arctic-frost',
      name: 'Arctic Frost',
      desc: 'Glacial freeze ice blue theme',
      themeKey: 'dark',
      variantKey: 'arctic-frost',
      accentColor: '#38bdf8',
      isDark: true,
      preview: {
        bg: '#09121f',
        card: '#111e31',
        sidebar: '#111e31',
        border: '#1a2f4a',
        accent: '#38bdf8',
        text: '#ecf3fc'
      }
    },
    {
      id: 'coffee-brown',
      name: 'Coffee Brown',
      desc: 'Espresso dark with warm caramel',
      themeKey: 'dark',
      variantKey: 'coffee-brown',
      accentColor: '#d97706',
      isDark: true,
      preview: {
        bg: '#0e0a08',
        card: '#19120f',
        sidebar: '#19120f',
        border: '#2d211a',
        accent: '#d97706',
        text: '#f7ede8'
      }
    },
    {
      id: 'rose-quartz',
      name: 'Rose Quartz',
      desc: 'Soft quartz pink workspace',
      themeKey: 'dark',
      variantKey: 'rose-quartz',
      accentColor: '#ec4899',
      isDark: true,
      preview: {
        bg: '#1a0f12',
        card: '#25161b',
        sidebar: '#25161b',
        border: '#3d242c',
        accent: '#ec4899',
        text: '#faebef'
      }
    },
    {
      id: 'sunset-orange',
      name: 'Sunset Orange',
      desc: 'Warm sunset charcoal orange',
      themeKey: 'dark',
      variantKey: 'sunset-orange',
      accentColor: '#f97316',
      isDark: true,
      preview: {
        bg: '#0f0704',
        card: '#1c0e08',
        sidebar: '#1c0e08',
        border: '#321b11',
        accent: '#f97316',
        text: '#fdf2ed'
      }
    },
    {
      id: 'sapphire-night',
      name: 'Sapphire Night',
      desc: 'Royal sapphire glowing night',
      themeKey: 'dark',
      variantKey: 'sapphire-night',
      accentColor: '#2563eb',
      isDark: true,
      preview: {
        bg: '#040817',
        card: '#0c1330',
        sidebar: '#0c1330',
        border: '#17234d',
        accent: '#2563eb',
        text: '#eef2ff'
      }
    },
    {
      id: 'violet-eclipse',
      name: 'Violet Eclipse',
      desc: 'Mystic purple eclipse vibes',
      themeKey: 'dark',
      variantKey: 'violet-eclipse',
      accentColor: '#a855f7',
      isDark: true,
      preview: {
        bg: '#080312',
        card: '#130925',
        sidebar: '#130925',
        border: '#23153d',
        accent: '#a855f7',
        text: '#f5f2fa'
      }
    },
    {
      id: 'neon-lime',
      name: 'Neon Lime',
      desc: 'Electric high voltage lime',
      themeKey: 'dark',
      variantKey: 'neon-lime',
      accentColor: '#84cc16',
      isDark: true,
      preview: {
        bg: '#040801',
        card: '#0a1405',
        sidebar: '#0a1405',
        border: '#14280b',
        accent: '#84cc16',
        text: '#f0f7ec'
      }
    },
    {
      id: 'hacker-terminal',
      name: 'Hacker Terminal',
      desc: 'Retro green terminal workspace',
      themeKey: 'dark',
      variantKey: 'hacker-terminal',
      accentColor: '#22c55e',
      isDark: true,
      preview: {
        bg: '#010402',
        card: '#030c05',
        sidebar: '#030c05',
        border: '#06240d',
        accent: '#22c55e',
        text: '#22c55e'
      }
    },
    {
      id: 'carbon-steel',
      name: 'Carbon Steel',
      desc: 'Metallic carbon steel blue',
      themeKey: 'dark',
      variantKey: 'carbon-steel',
      accentColor: '#64748b',
      isDark: true,
      preview: {
        bg: '#0f1115',
        card: '#191c21',
        sidebar: '#191c21',
        border: '#282e38',
        accent: '#64748b',
        text: '#e2e8f0'
      }
    }
  ]

  // Add the custom theme builder card representation
  const customTheme = {
    id: 'custom',
    name: 'Custom Theme',
    desc: 'Your custom configuration',
    themeKey: 'dark',
    variantKey: 'custom',
    accentColor: customConfig.accent,
    isDark: true,
    preview: {
      bg: customConfig.bg,
      card: customConfig.cardBg,
      sidebar: customConfig.sidebarBg,
      border: customConfig.border,
      accent: customConfig.accent,
      text: '#f3f4f6'
    }
  }

  const allThemes = [...themesList, customTheme]

  // Helper to dynamically apply Custom Builder variables on document root
  const applyCustomThemeVariables = (config) => {
    if (!config) return
    const root = document.documentElement
    root.style.setProperty('--custom-bg', config.bg)
    root.style.setProperty('--custom-card-bg', config.cardBg)
    root.style.setProperty('--custom-sidebar-bg', config.sidebarBg || config.cardBg)
    root.style.setProperty('--custom-navbar-bg', `${config.cardBg}d9`)
    root.style.setProperty('--custom-border', config.border)
    root.style.setProperty('--custom-accent', config.accent)
    root.style.setProperty('--custom-accent-hover', lightenColor(config.accent, 12))
    root.style.setProperty('--custom-accent-dark', lightenColor(config.accent, -15))
    root.style.setProperty('--custom-accent-glow', `${config.accent}26`)
  }

  // Handle outside click to close panel
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
        restoreActiveTheme() // ensure we restore in case mouse clicked outside from a hovered state
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isOpen, theme, darkVariant, customConfig])

  // Sync custom theme config to localStorage & apply if active
  useEffect(() => {
    localStorage.setItem('custom-theme-config', JSON.stringify(customConfig))
    if (theme === 'dark' && darkVariant === 'custom') {
      applyCustomThemeVariables(customConfig)
    }
  }, [customConfig, theme, darkVariant])

  // Handle automatic time-based switching
  const checkAutoTheme = () => {
    const hour = new Date().getHours()
    if (hour >= 7 && hour < 19) {
      // Light Mode (7 AM - 7 PM)
      if (theme !== 'light') {
        setTheme('light')
        setRecentlyUsedList('light-mode')
      }
    } else {
      // Dark Mode (7 PM - 7 AM)
      if (theme !== 'dark') {
        setTheme('dark')
        setDarkVariant('classic-dark')
        setRecentlyUsedList('classic-dark')
      }
    }
  }

  useEffect(() => {
    localStorage.setItem('auto-theme-enabled', String(autoTheme))
    if (autoTheme) {
      checkAutoTheme()
      const interval = setInterval(checkAutoTheme, 20000)
      return () => clearInterval(interval)
    }
  }, [autoTheme])

  // Restore active theme helper
  const restoreActiveTheme = () => {
    const root = document.documentElement
    if (theme === 'light') {
      root.classList.remove('dark')
      root.removeAttribute('data-theme')
    } else {
      root.classList.add('dark')
      root.setAttribute('data-theme', darkVariant)
      if (darkVariant === 'custom') {
        applyCustomThemeVariables(customConfig)
      }
    }
  }

  // Live hover preview handler
  const handleHoverTheme = (t) => {
    const root = document.documentElement
    if (t.themeKey === 'light') {
      root.classList.remove('dark')
      root.removeAttribute('data-theme')
    } else {
      root.classList.add('dark')
      root.setAttribute('data-theme', t.variantKey)
      if (t.variantKey === 'custom') {
        applyCustomThemeVariables(customConfig)
      }
    }
  }

  // Permanent selection handler
  const handleSelectTheme = (t) => {
    if (t.themeKey === 'light') {
      setTheme('light')
    } else {
      setTheme('dark')
      setDarkVariant(t.variantKey)
      if (t.variantKey === 'custom') {
        applyCustomThemeVariables(customConfig)
      }
    }
    setRecentlyUsedList(t.id)
  }

  const setRecentlyUsedList = (themeId) => {
    setRecentlyUsed(prev => {
      const filtered = prev.filter(id => id !== themeId)
      const next = [themeId, ...filtered].slice(0, 3)
      localStorage.setItem('theme-recently-used', JSON.stringify(next))
      return next
    })
  }

  const isThemeActive = (t) => {
    if (t.themeKey === 'light') {
      return theme === 'light'
    }
    return theme === 'dark' && darkVariant === t.variantKey
  }

  // Favorite handler
  const toggleFavorite = (themeId, e) => {
    e.stopPropagation()
    setFavorites(prev => {
      const next = prev.includes(themeId)
        ? prev.filter(id => id !== themeId)
        : [...prev, themeId]
      localStorage.setItem('theme-favorites', JSON.stringify(next))
      return next
    })
  }

  // Random theme "Surprise Me" selection
  const handleSurpriseMe = () => {
    const filterList = allThemes.filter(t => !isThemeActive(t))
    if (filterList.length === 0) return
    const random = filterList[Math.floor(Math.random() * filterList.length)]
    handleSelectTheme(random)
    
    // Add temporary glowing ring on switcher button
    const btn = document.getElementById('theme-switcher-btn')
    if (btn) {
      btn.classList.add('ring-4', 'ring-emerald-400', 'animate-pulse')
      setTimeout(() => {
        btn.classList.remove('ring-4', 'ring-emerald-400', 'animate-pulse')
      }, 1500)
    }
  }

  // Custom configuration update
  const updateCustomConfig = (field, color) => {
    const updated = { ...customConfig, [field]: color }
    if (field === 'bg') {
      updated.border = lightenColor(color, 12)
    }
    setCustomConfig(updated)
    // Instantly apply custom selection
    setTheme('dark')
    setDarkVariant('custom')
    applyCustomThemeVariables(updated)
  }

  // Config Import / Export handler
  const handleExportConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(customConfig, null, 2))
    setImportStatus({ type: 'success', msg: 'Copied custom configuration JSON to clipboard!' })
    setTimeout(() => setImportStatus({ type: '', msg: '' }), 3000)
  }

  const handleImportConfig = () => {
    try {
      const parsed = JSON.parse(importText)
      if (parsed.bg && parsed.cardBg && parsed.border && parsed.accent) {
        setCustomConfig(parsed)
        setTheme('dark')
        setDarkVariant('custom')
        applyCustomThemeVariables(parsed)
        setImportStatus({ type: 'success', msg: 'Theme configuration imported successfully!' })
        setImportText('')
        setActiveTab('themes')
      } else {
        setImportStatus({ type: 'error', msg: 'Missing required color properties (bg, cardBg, border, accent).' })
      }
    } catch {
      setImportStatus({ type: 'error', msg: 'Failed to parse text. Please enter valid JSON.' })
    }
    setTimeout(() => setImportStatus({ type: '', msg: '' }), 4000)
  }

  // Filtering themes for Search and Favorited sort
  const filteredThemes = allThemes.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.desc.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const favoriteThemes = filteredThemes.filter(t => favorites.includes(t.id))
  const regularThemes = filteredThemes.filter(t => !favorites.includes(t.id))

  const sortedThemes = [...favoriteThemes, ...regularThemes]

  // Animation panel variants
  const panelVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 30, filter: 'blur(10px)' },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0, 
      filter: 'blur(0px)',
      transition: { type: 'spring', stiffness: 350, damping: 26 } 
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      y: 20, 
      filter: 'blur(8px)',
      transition: { duration: 0.22, ease: 'easeInOut' } 
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999]" ref={menuRef}>
      {/* Floating Action Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-13 h-13 rounded-full bg-white/90 dark:bg-slate-900/90 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer group"
        title="Customize Theme & Workspace Layout"
        id="theme-switcher-btn"
      >
        <div className="relative w-6 h-6 flex items-center justify-center">
          <Palette className="w-5.5 h-5.5 transition-transform duration-500 group-hover:rotate-45 text-brand-600 dark:text-brand-400" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
        </div>
      </button>

      {/* Glassmorphism Deck Popover Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute bottom-16 right-0 w-[350px] sm:w-[460px] bg-white/80 dark:bg-slate-950/70 border border-slate-250/50 dark:border-slate-800/50 backdrop-blur-2xl rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_30px_70px_rgba(0,0,0,0.7)] space-y-4 text-left flex flex-col max-h-[580px] overflow-hidden"
          >
            {/* Header Title Section */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200/50 dark:border-slate-800/50 flex-shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-50 tracking-tight font-display">
                    HireFlow AI Premium
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-450 font-medium font-sans">
                  Customize your workspace appearance
                </p>
              </div>
              
              {/* Top Quick Actions bar */}
              <div className="flex items-center gap-1.5">
                {/* Auto Time Theme button */}
                <button
                  onClick={() => setAutoTheme(!autoTheme)}
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                    autoTheme 
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-600 dark:text-emerald-450' 
                      : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                  }`}
                  title="Toggle auto-switching based on morning/night"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[9px] font-bold">Auto</span>
                </button>

                {/* Surprise Me Dice */}
                <button
                  onClick={handleSurpriseMe}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all flex items-center gap-1"
                  title="Surprise Me (Apply random theme)"
                >
                  <Shuffle className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="hidden sm:inline text-[9px] font-bold">Random</span>
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-850"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b border-slate-150/40 dark:border-slate-850/40 pb-2.5 flex-shrink-0">
              <button
                onClick={() => setActiveTab('themes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'themes'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-450 dark:hover:text-slate-200'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                Themes ({sortedThemes.length})
              </button>
              <button
                onClick={() => setActiveTab('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'custom'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-450 dark:hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Custom Theme Builder
              </button>
            </div>

            {/* TAB CONTENT: THEME SELECTOR GRID */}
            {activeTab === 'themes' && (
              <>
                {/* Search Bar & Recently Used Ribbon */}
                <div className="space-y-2 flex-shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search themes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full text-xs pl-8.5 pr-4 py-2 bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  {/* Recently Used Theme ribbon */}
                  {recentlyUsed.length > 0 && (
                    <div className="flex items-center gap-2 px-0.5 py-1 overflow-x-auto scrollbar-none">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-0.5 whitespace-nowrap">
                        <Clock className="w-3 h-3" /> Recent:
                      </span>
                      <div className="flex gap-1.5">
                        {recentlyUsed.map(themeId => {
                          const matchingTheme = allThemes.find(t => t.id === themeId)
                          if (!matchingTheme) return null
                          return (
                            <button
                              key={themeId}
                              onClick={() => handleSelectTheme(matchingTheme)}
                              className="text-[9px] font-semibold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 transition-all"
                            >
                              {matchingTheme.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Theme Cards Grid with absolute layout containment */}
                <div className="flex-grow overflow-y-auto pr-1 grid grid-cols-2 gap-3 pb-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800">
                  {sortedThemes.map((t) => {
                    const active = isThemeActive(t)
                    const isFavorited = favorites.includes(t.id)
                    
                    return (
                      <div
                        key={t.id}
                        onMouseEnter={() => handleHoverTheme(t)}
                        onMouseLeave={restoreActiveTheme}
                        onClick={() => handleSelectTheme(t)}
                        className={`text-left rounded-2xl border p-2 flex flex-col gap-2 relative cursor-pointer group transition-all duration-300 select-none hover:-translate-y-0.5 ${
                          active
                            ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-brand-500 shadow-[0_0_15px_rgba(99,102,241,0.2)] ring-1 ring-brand-500/30 active-theme-card'
                            : 'bg-white dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/30 dark:hover:bg-slate-900/30 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
                        }`}
                      >
                        {/* Miniature Dashboard Preview */}
                        <MiniatureDashboard preview={t.preview} />

                        {/* Title block & Mini Palette details */}
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-1">
                            <div className="space-y-0.5 leading-none">
                              <span className="text-[10px] font-bold text-slate-850 dark:text-slate-200 tracking-tight block">
                                {t.name}
                              </span>
                              <span className="text-[8px] text-slate-400 dark:text-slate-500 font-medium block">
                                {t.desc}
                              </span>
                            </div>

                            {/* Favorite Star Icon toggle */}
                            <button
                              onClick={(e) => toggleFavorite(t.id, e)}
                              className="text-slate-350 dark:text-slate-650 hover:text-yellow-500 dark:hover:text-yellow-500 p-0.5 rounded transition-colors"
                            >
                              <Star className={`w-3.5 h-3.5 ${isFavorited ? 'fill-yellow-500 text-yellow-500' : 'text-slate-400 dark:text-slate-650 opacity-0 group-hover:opacity-100'}`} />
                            </button>
                          </div>

                          {/* Color palette bullets & indicators */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100/60 dark:border-slate-900/40">
                            {/* Color bullets */}
                            <div className="flex gap-0.5">
                              <span className="w-1.5 h-1.5 rounded-full border border-slate-200/50 dark:border-slate-800/50" style={{ backgroundColor: t.preview.bg }} />
                              <span className="w-1.5 h-1.5 rounded-full border border-slate-200/50 dark:border-slate-800/50" style={{ backgroundColor: t.preview.card }} />
                              <span className="w-1.5 h-1.5 rounded-full border border-slate-200/50 dark:border-slate-800/50" style={{ backgroundColor: t.preview.sidebar }} />
                              <span className="w-1.5 h-1.5 rounded-full border border-slate-200/50 dark:border-slate-800/50" style={{ backgroundColor: t.preview.accent }} />
                            </div>

                            {/* Selection check pill badge */}
                            {active && (
                              <div className="flex items-center gap-0.5 bg-emerald-500 text-white rounded-full px-1.5 py-0.5 text-[7px] font-black tracking-wider uppercase scale-95 shadow-sm">
                                <Check className="w-2 h-2" strokeWidth={4} />
                                Active
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {sortedThemes.length === 0 && (
                    <div className="col-span-2 text-center py-8 space-y-1">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">No matching themes found.</p>
                      <p className="text-[10px] text-slate-400">Try modifying your search term.</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* TAB CONTENT: CUSTOM THEME BUILDER & IMPORTS */}
            {activeTab === 'custom' && (
              <div className="flex-grow overflow-y-auto pr-1 space-y-4 pb-2 text-xs text-slate-700 dark:text-slate-350">
                <div className="space-y-3 p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
                  <h4 className="text-[11px] font-bold text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-indigo-500" />
                    Color Palette configuration
                  </h4>
                  
                  {/* Pickers grid */}
                  <div className="grid grid-cols-2 gap-3 text-[10px]">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-550 dark:text-slate-400">Workspace Background</span>
                      <div className="flex items-center gap-2 border border-slate-200/70 dark:border-slate-800/70 rounded-xl p-1.5 bg-white dark:bg-slate-950/50">
                        <input
                          type="color"
                          value={customConfig.bg}
                          onChange={(e) => updateCustomConfig('bg', e.target.value)}
                          className="w-6 h-6 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                        />
                        <span className="font-mono text-[9px] uppercase">{customConfig.bg}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-slate-550 dark:text-slate-400">Cards & Surface</span>
                      <div className="flex items-center gap-2 border border-slate-200/70 dark:border-slate-800/70 rounded-xl p-1.5 bg-white dark:bg-slate-950/50">
                        <input
                          type="color"
                          value={customConfig.cardBg}
                          onChange={(e) => updateCustomConfig('cardBg', e.target.value)}
                          className="w-6 h-6 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                        />
                        <span className="font-mono text-[9px] uppercase">{customConfig.cardBg}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-slate-550 dark:text-slate-400">Sidebar Background</span>
                      <div className="flex items-center gap-2 border border-slate-200/70 dark:border-slate-800/70 rounded-xl p-1.5 bg-white dark:bg-slate-950/50">
                        <input
                          type="color"
                          value={customConfig.sidebarBg || customConfig.cardBg}
                          onChange={(e) => updateCustomConfig('sidebarBg', e.target.value)}
                          className="w-6 h-6 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                        />
                        <span className="font-mono text-[9px] uppercase">{customConfig.sidebarBg || customConfig.cardBg}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-slate-550 dark:text-slate-400">Accent Highlights</span>
                      <div className="flex items-center gap-2 border border-slate-200/70 dark:border-slate-800/70 rounded-xl p-1.5 bg-white dark:bg-slate-950/50">
                        <input
                          type="color"
                          value={customConfig.accent}
                          onChange={(e) => updateCustomConfig('accent', e.target.value)}
                          className="w-6 h-6 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                        />
                        <span className="font-mono text-[9px] uppercase">{customConfig.accent}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Import / Export block */}
                <div className="space-y-2.5 p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                      Import / Export Profile
                    </h4>
                    <button
                      onClick={handleExportConfig}
                      className="px-2 py-0.5 text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-indigo-200/50 dark:border-indigo-900/50 rounded flex items-center gap-1 transition-all"
                    >
                      <Download className="w-3 h-3" />
                      Copy JSON
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-450 dark:text-slate-500">
                    Import customized palettes by pasting their JSON representations here:
                  </p>

                  <textarea
                    placeholder='e.g. {"bg":"#0f0f12","cardBg":"#181820","border":"#2e2e38","accent":"#8b5cf6"}'
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    className="w-full h-14 text-[9px] font-mono p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 rounded-xl focus:outline-none text-slate-800 dark:text-slate-200"
                  />

                  <button
                    onClick={handleImportConfig}
                    className="w-full py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Import Configuration
                  </button>
                </div>

                {/* Import Status Alert */}
                {importStatus.msg && (
                  <div className={`p-2 rounded-xl text-[10px] text-center font-semibold border ${
                    importStatus.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-450'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                  }`}>
                    {importStatus.msg}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ThemeSwitcher
