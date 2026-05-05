import { useEffect } from 'react'
import { useApp } from '../context/AppContext'
import styles from './Toast.module.css'

// ── Enhanced Toast Container ───────────────────────────────────────────────
// Supports: success | error | warning | info
// Each toast has a dismiss button and an animated progress bar.

const ICONS = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
}

function Toast({ id, message, type = 'success', onDismiss }) {
  return (
    <div
      className={`${styles.toast} ${styles[type] || styles.success}`}
      role="alert"
      aria-live="polite"
    >
      <span className={styles.icon} aria-hidden="true">
        {ICONS[type] || ICONS.success}
      </span>
      <span className={styles.message}>{message}</span>
      <button
        className={styles.dismiss}
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
      >
        ✕
      </button>
      <div className={styles.progress} />
    </div>
  )
}

export default function ToastContainer() {
  const { toasts, dismissToast } = useApp()

  // Keyboard: allow dismissing by pressing Escape when focused
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && toasts.length > 0) {
        dismissToast(toasts[toasts.length - 1].id)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [toasts, dismissToast])

  if (toasts.length === 0) return null

  return (
    <div className={styles.container} aria-label="Notifications">
      {toasts.map(t => (
        <Toast key={t.id} {...t} onDismiss={dismissToast} />
      ))}
    </div>
  )
}
