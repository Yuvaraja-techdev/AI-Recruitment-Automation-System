import { useState, useEffect } from 'react'

/**
 * useDebounce — Delays updating a value until after a specified delay.
 * Useful for search inputs to avoid filtering on every keystroke.
 *
 * @param {*} value — The value to debounce
 * @param {number} delay — Delay in milliseconds (default: 300)
 * @returns The debounced value
 */
const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

export default useDebounce
