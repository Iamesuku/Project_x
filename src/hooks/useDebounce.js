import { useState, useEffect } from 'react'

/**
 * useDebounce — delays updating a value until the user stops typing.
 *
 * @param {*}      value  — the raw value (e.g. a search string)
 * @param {number} delay  — ms to wait after the last change (default 300)
 * @returns debounced value
 *
 * Usage:
 *   const [search, setSearch] = useState('')
 *   const debouncedSearch = useDebounce(search, 300)
 *   // use debouncedSearch in useMemo / useEffect
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
