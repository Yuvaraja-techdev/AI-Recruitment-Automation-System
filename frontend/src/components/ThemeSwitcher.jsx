import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Palette, Check, Settings, X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const ThemeSwitcher = () => {
  const { theme, setTheme, darkVariant, setDarkVariant, toggleTheme } = useTheme()
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

  const darkModels = [
    {
      id: 'classic-dark',
      name: 'Classic Navy',
      bgClass: 'bg-[#0f172a]',
      borderClass: 'border-[#334155]',
      accentColor: '#3b82f6',
    },
    {
      id: 'midnight',
      name: 'Midnight Blue',
      bgClass: 'bg-[#0b132b]',
      borderClass: 'border-[#3a506b]',
      accentColor: '#4f46e5',
    },
    {
      id: 'charcoal',
      name: 'Charcoal Slate',
      bgClass: 'bg-[#121212]',
      borderClass: 'border-[#2d2d2d]',
      accentColor: '#94a3b8',
    },
    {
      id: 'deep-space',
      name: 'Deep Space',
      bgClass: 'bg-[#000000]',
      borderClass: 'border-[#1a1a1a]',
      accentColor: '#ffffff',
    }
  ]

  return (
    <div className="fixed bottom-6 right-6 z-[9999]" ref={menuRef}>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 transition-all hover:scale-110 active:scale-95"
        title="Customize Theme & Palette"
        id="theme-switcher-btn"
      >
        {theme === 'light' ? (
          <Sun className="w-5 h-5 animate-spin-slow text-amber-500" />
        ) : (
          <Moon className="w-5 h-5 text-indigo-400" />
        )}
      </button>

      {/* Popover Customizer Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: 'spring', duration: 0.35 }}
            className="absolute bottom-16 right-0 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Palette className="w-4.5 h-4.5 text-brand-600 dark:text-brand-400" />
                <h3 className="text-xs font-bold text-slate-850 dark:text-slate-100 uppercase tracking-wider">
                  Theme Customizer
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode selection (Light vs Dark) */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide block">
                Select Mode
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    theme === 'light'
                      ? 'bg-amber-50/50 border-amber-200 text-amber-600 shadow-sm'
                      : 'bg-transparent border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    theme === 'dark'
                      ? 'bg-indigo-950/20 border-indigo-500/35 text-indigo-400 shadow-sm'
                      : 'bg-transparent border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  Dark
                </button>
              </div>
            </div>

            {/* Dark Variant Selection (only shown when dark mode is enabled) */}
            <AnimatePresence>
              {theme === 'dark' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-2.5 overflow-hidden"
                >
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide block pt-1">
                    Dark Color Schemes
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {darkModels.map((model) => {
                      const isSelected = darkVariant === model.id
                      return (
                        <button
                          key={model.id}
                          onClick={() => setDarkVariant(model.id)}
                          className={`flex flex-col items-start gap-1 p-2.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-slate-50 dark:bg-slate-800 border-indigo-500'
                              : 'bg-transparent border-slate-200 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span
                              className={`w-3.5 h-3.5 rounded-full ${model.bgClass} border ${model.borderClass} flex items-center justify-center`}
                            >
                              {isSelected && (
                                <Check className="w-2.5 h-2.5 text-emerald-500" strokeWidth={3} />
                              )}
                            </span>
                            {isSelected && (
                              <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">Active</span>
                            )}
                          </div>
                          <span className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 mt-1 leading-none">
                            {model.name}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ThemeSwitcher
