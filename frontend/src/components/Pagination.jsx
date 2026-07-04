import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Pagination — Reusable pagination controls.
 *
 * Props:
 * - currentPage: number (1-indexed)
 * - totalPages: number
 * - totalItems: number
 * - pageSize: number
 * - onPageChange: (page) => void
 * - onPageSizeChange: (size) => void
 */
const pageSizeOptions = [5, 10, 20, 50]

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)

      if (currentPage > 3) pages.push('...')

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) pages.push(i)

      if (currentPage < totalPages - 2) pages.push('...')

      pages.push(totalPages)
    }

    return pages
  }

  if (totalItems === 0) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-surface-100">
      {/* Left — Info + Page Size */}
      <div className="flex items-center gap-4 text-sm text-surface-500">
        <span>
          Showing <span className="font-semibold text-surface-700">{startItem}</span>–
          <span className="font-semibold text-surface-700">{endItem}</span> of{' '}
          <span className="font-semibold text-surface-700">{totalItems}</span>
        </span>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-surface-400">|</span>
          <label htmlFor="page-size" className="text-surface-400">
            Rows:
          </label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2 py-1 rounded-lg bg-surface-50 border border-surface-200 text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right — Page buttons */}
      <div className="flex items-center gap-1">
        {/* Previous */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 hover:text-surface-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2} />
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((page, idx) =>
          page === '...' ? (
            <span key={`dots-${idx}`} className="px-2 text-surface-400 text-sm">
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
                page === currentPage
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-surface-600 hover:bg-surface-100'
              }`}
            >
              {page}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 hover:text-surface-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

export default Pagination
