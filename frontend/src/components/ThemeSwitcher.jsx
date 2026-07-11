import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Palette, Check, X, Sparkles } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

// Miniature Dashboard component to preview themes dynamically
const MiniatureDashboard = ({ themeKey, variantKey, isWide = false }) => {
  let bgClass = 'bg-slate-50'
  let cardClass = 'bg-white'
  let sidebarClass = 'bg-slate-100'
  let headerClass = 'bg-white'
  let borderClass = 'border-slate-150'
  let accentClass = 'bg-indigo-600'

  if (themeKey === 'dark') {
    if (variantKey === 'classic-dark') {
      bgClass = 'bg-[#0f172a]'
      cardClass = 'bg-[#1e293b]'
      sidebarClass = 'bg-[#1e293b]'
      headerClass = 'bg-[#1e293b]'
      borderClass = 'border-[#334155]'
      accentClass = 'bg-blue-500'
    } else if (variantKey === 'midnight') {
      bgClass = 'bg-[#0b132b]'
      cardClass = 'bg-[#0d1b2a]'
      sidebarClass = 'bg-[#0d1b2a]'
      headerClass = 'bg-[#0d1b2a]'
      borderClass = 'border-[#1b263b]'
      accentClass = 'bg-[#4f46e5]'
    } else if (variantKey === 'charcoal') {
      bgClass = 'bg-[#121212]'
      cardClass = 'bg-[#1e1e1e]'
      sidebarClass = 'bg-[#1e1e1e]'
      headerClass = 'bg-[#1e1e1e]'
      borderClass = 'border-[#2d2d2d]'
      accentClass = 'bg-[#94a3b8]'
    } else if (variantKey === 'deep-space') {
      bgClass = 'bg-[#000000]'
      cardClass = 'bg-[#0d0d0d]'
      sidebarClass = 'bg-[#0d0d0d]'
      headerClass = 'bg-[#0d0d0d]'
      borderClass = 'border-[#1a1a1a]'
      accentClass = 'bg-white'
    }
  }

  return (
    <div className={`h-16 w-full rounded-xl ${bgClass} border ${borderClass} relative overflow-hidden flex flex-col transition-all duration-300`}>
      {/* Top Browser Header */}
      <div className={`h-3 w-full border-b ${borderClass} ${headerClass} flex items-center justify-between px-2`}>
        <div className="flex gap-0.5">
          <div className="w-1 h-1 rounded-full bg-red-400/80" />
          <div className="w-1 h-1 rounded-full bg-yellow-400/80" />
          <div className="w-1 h-1 rounded-full bg-green-400/80" />
        </div>
        <div className="w-10 h-1 rounded bg-slate-400/20" />
      </div>
      
      <div className="flex-grow flex">
        {/* Sidebar */}
        <div className={`w-8 border-r ${borderClass} ${sidebarClass} p-1 space-y-0.5`}>
          <div className="h-0.5 w-full rounded bg-slate-400/30" />
          <div className="h-0.5 w-5 rounded bg-slate-400/20" />
          <div className="h-0.5 w-6 rounded bg-slate-400/20" />
        </div>
        
        {/* Main Area */}
        <div className="flex-grow p-1.5 flex flex-col justify-between">
          <div className="flex gap-1">
            <div className={`h-5 flex-grow rounded ${cardClass} border ${borderClass} p-0.5 flex flex-col justify-between`}>
              <div className="h-0.5 w-3/4 rounded bg-slate-400/15" />
              <div className="h-0.5 w-1/2 rounded bg-slate-400/15" />
            </div>
            {isWide && (
              <div className={`h-5 flex-grow rounded ${cardClass} border ${borderClass} p-0.5 flex flex-col justify-between`}>
                <div className="h-0.5 w-3/4 rounded bg-slate-400/15" />
                <div className="h-0.5 w-1/2 rounded bg-slate-400/15" />
              </div>
            )}
            <div className={`h-5 flex-grow rounded ${cardClass} border ${borderClass} p-0.5 flex flex-col justify-between`}>
              <div className="h-0.5 w-3/4 rounded bg-slate-400/15" />
              <div className="h-0.5 w-1/2 rounded bg-slate-400/15" />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="h-0.5 w-6 rounded bg-slate-400/20" />
            <div className={`h-1.5 w-5 rounded-sm ${accentClass}`} />
          </div>
        </div>
      </div>
    </div>
  )
}

const ThemeSwitcher = () => {
  const { theme, setTheme, darkVariant, setDarkVariant } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  // Close popup on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isOpen])

  const themesList = [
    {
      id: 'light-mode',
      name: 'Light Mode',
      desc: 'Clean & minimal workspace',
      themeKey: 'light',
      variantKey: null,
      accentColor: 'bg-indigo-600',
      isWide: false
    },
    {
      id: 'classic-dark',
      name: 'Classic Navy',
      desc: 'Corporate & professional dark',
      themeKey: 'dark',
      variantKey: 'classic-dark',
      accentColor: 'bg-blue-500',
      isWide: false
    },
    {
      id: 'midnight',
      name: 'Midnight Blue',
      desc: 'Deep ocean sapphire vibes',
      themeKey: 'dark',
      variantKey: 'midnight',
      accentColor: 'bg-indigo-500',
      isWide: false
    },
    {
      id: 'charcoal',
      name: 'Charcoal Slate',
      desc: 'Neutral graphite slate gray',
      themeKey: 'dark',
      variantKey: 'charcoal',
      accentColor: 'bg-slate-400',
      isWide: false
    },
    {
      id: 'deep-space',
      name: 'Deep Space',
      desc: 'Premium contrast OLED black',
      themeKey: 'dark',
      variantKey: 'deep-space',
      accentColor: 'bg-white',
      isWide: true
    }
  ]

  const handleSelectTheme = (t) => {
    if (t.themeKey === 'light') {
      setTheme('light')
    } else {
      setTheme('dark')
      setDarkVariant(t.variantKey)
    }
  }

  const isThemeActive = (t) => {
    if (t.themeKey === 'light') {
      return theme === 'light'
    }
    return theme === 'dark' && darkVariant === t.variantKey
  }

  // Animation variants
  const panelVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 350, damping: 25 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: 10,
      transition: { duration: 0.2, ease: 'easeInOut' }
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999]" ref={menuRef}>
      {/* Floating Toggle Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.4)] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer group"
        title="Customize Theme & Palette"
        id="theme-switcher-btn"
      >
        <div className="relative w-6 h-6 flex items-center justify-center">
          <Palette className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12 text-brand-600 dark:text-brand-400" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border border-white dark:border-slate-800" />
        </div>
      </button>

      {/* Popover Customizer Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute bottom-16 right-0 w-80 sm:w-[420px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_15px_50px_-10px_rgba(0,0,0,0.6)] space-y-4 text-left"
          >
            {/* Header Ribbon */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                  <h3 className="text-xs font-black text-slate-900 dark:text-slate-50 uppercase tracking-wider font-display">
                    HireFlow AI Premium
                  </h3>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold font-sans">
                  Customize your workspace theme
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-650 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Themes Cards Grid */}
            <div className="grid grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {themesList.map((t) => {
                const active = isThemeActive(t)
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTheme(t)}
                    className={`col-span-${t.isWide ? '2' : '1'} text-left rounded-2xl border p-2.5 transition-all duration-300 ease-in-out cursor-pointer flex flex-col gap-2 relative group hover:-translate-y-0.5 ${
                      active
                        ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                        : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/30 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    {/* Miniature Dashboard Preview */}
                    <MiniatureDashboard themeKey={t.themeKey} variantKey={t.variantKey} isWide={t.isWide} />

                    {/* Metadata block */}
                    <div className="flex items-start justify-between gap-2 px-0.5">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-850 dark:text-slate-200 font-display block leading-none">
                          {t.name}
                        </span>
                        <span className="text-[8px] text-slate-400 dark:text-slate-500 leading-none">
                          {t.desc}
                        </span>
                      </div>
                      
                      {/* Accent Dot indicator */}
                      <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${t.accentColor}`} />
                        {active && (
                          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                            <Check className="w-2.5 h-2.5" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ThemeSwitcher
