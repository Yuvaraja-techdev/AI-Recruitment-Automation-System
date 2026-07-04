import { useState, useRef, useEffect } from 'react'
import { Filter, ChevronDown } from 'lucide-react'

/**
 * FilterDropdown — Reusable dropdown filter.
 *
 * Props:
 * - options: Array of { value, label, count? }
 * - value: currently selected value
 * - onChange: (value) => void
 */
const FilterDropdown = ({ options, value, onChange }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const activeOption = options.find((o) => o.value === value)

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-surface-200 text-sm font-medium text-surface-700 hover:bg-surface-50 transition-all shadow-card min-w-[180px]"
        id="filter-dropdown-btn"
      >
        <Filter className="w-4 h-4 text-surface-400" strokeWidth={2} />
        <span>{activeOption?.label || 'Filter'}</span>
        <ChevronDown
          className={`w-4 h-4 text-surface-400 ml-auto transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-surface-200 rounded-xl shadow-lg z-30 py-1.5 animate-fade-in">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                value === option.value
                  ? 'bg-brand-50 text-brand-700 font-semibold'
                  : 'text-surface-700 hover:bg-surface-50'
              }`}
            >
              <span>{option.label}</span>
              {option.count !== undefined && (
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    value === option.value
                      ? 'bg-brand-100 text-brand-700'
                      : 'bg-surface-100 text-surface-500'
                  }`}
                >
                  {option.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default FilterDropdown
