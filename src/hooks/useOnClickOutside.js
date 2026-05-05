import { useEffect } from 'react'

/**
 * useOnClickOutside — calls handler when a click occurs outside the ref element.
 *
 * @param {React.RefObject} ref
 * @param {Function}        handler
 */
export function useOnClickOutside(ref, handler) {
  useEffect(() => {
    function listener(event) {
      if (!ref.current || ref.current.contains(event.target)) return
      handler(event)
    }
    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler])
}
