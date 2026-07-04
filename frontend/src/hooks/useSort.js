import { useState, useMemo } from 'react'

/**
 * useSort — Custom hook for sorting an array of objects.
 *
 * @param {Array} data — The array to sort
 * @param {Object} defaultSort — { key, direction: 'asc' | 'desc' }
 * @returns {{ sortedData, sortConfig, requestSort }}
 */
const useSort = (data, defaultSort = null) => {
  const [sortConfig, setSortConfig] = useState(defaultSort)

  const sortedData = useMemo(() => {
    if (!sortConfig || !sortConfig.key) return data

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]

      // Handle nulls
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1

      // String comparison
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const cmp = aVal.localeCompare(bVal, undefined, { sensitivity: 'base' })
        return sortConfig.direction === 'asc' ? cmp : -cmp
      }

      // Numeric comparison
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortConfig])

  const requestSort = (key) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        // Toggle direction, then reset
        if (prev.direction === 'asc') return { key, direction: 'desc' }
        if (prev.direction === 'desc') return null // Reset sort
      }
      return { key, direction: 'asc' }
    })
  }

  return { sortedData, sortConfig, requestSort }
}

export default useSort
