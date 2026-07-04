import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import EmptyState from './EmptyState'

/**
 * DataTable — Reusable sortable table component.
 *
 * Props:
 * - columns: Array of { key, label, align?, sortable?, render? }
 * - data: Array of row objects
 * - sortConfig: { key, direction } — current sort state
 * - onSort: (key) => void — callback when a header is clicked
 * - emptyMessage: string — shown when data is empty
 */
const DataTable = ({ columns, data, sortConfig, onSort, emptyMessage = 'No data found' }) => {
  const getSortIcon = (columnKey) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="w-3.5 h-3.5 text-surface-300" strokeWidth={2} />
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 text-brand-500" strokeWidth={2.5} />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-brand-500" strokeWidth={2.5} />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-surface-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-4 ${
                  col.align === 'right' ? 'text-right' : 'text-left'
                } ${col.sortable ? 'cursor-pointer select-none hover:text-surface-700 transition-colors' : ''}`}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <div className={`inline-flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : ''}`}>
                  {col.label}
                  {col.sortable && getSortIcon(col.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-50">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12">
                <EmptyState message={emptyMessage} />
              </td>
            </tr>
          ) : (
            <AnimatePresence initial={false}>
              {data.map((row, rowIndex) => (
                <motion.tr
                  key={row.candidate_id || row.id || rowIndex}
                  initial={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50, backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
                  transition={{ duration: 0.25 }}
                  className="group hover:bg-surface-50/50 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-6 py-4 ${col.align === 'right' ? 'text-right' : ''}`}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
