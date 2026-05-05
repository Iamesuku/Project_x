import { useState, useEffect } from 'react'

/**
 * useLocalStorage — syncs a state value with localStorage.
 *
 * @param {string} key       — localStorage key
 * @param {*}      initial   — initial / default value
 */
export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage full or blocked — fail silently
    }
  }, [key, value])

  return [value, setValue]
}
