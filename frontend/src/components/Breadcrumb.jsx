import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

/**
 * Breadcrumb — Reusable breadcrumb navigation.
 *
 * Props:
 * - items: Array of { label, path? }
 *   Last item (no path) is treated as the current page.
 */
const Breadcrumb = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      {/* Home icon */}
      <Link
        to="/"
        className="p-1 rounded-md text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
        aria-label="Dashboard"
      >
        <Home className="w-4 h-4" strokeWidth={2} />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <div key={index} className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-surface-300" strokeWidth={2} />
            {isLast || !item.path ? (
              <span className="font-medium text-surface-800 truncate max-w-[200px]">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.path}
                className="font-medium text-surface-500 hover:text-brand-600 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}

export default Breadcrumb
