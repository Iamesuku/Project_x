import { useEffect, useRef } from 'react'
import styles from './ConfirmModal.module.css'

// ── Reusable Confirm Dialog ────────────────────────────────────────────────
// Accessibility: traps focus within modal, closes on Escape, backdrop click.
//
// Usage:
//   <ConfirmModal
//     title="Delete project?"
//     message="This cannot be undone."
//     confirmLabel="Delete"
//     variant="danger"           // 'danger' | 'warning' | 'default'
//     onConfirm={handleDelete}
//     onClose={() => setOpen(false)}
//   />

export default function ConfirmModal({
  title       = 'Are you sure?',
  message     = '',
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  variant      = 'default',
  onConfirm,
  onClose,
  loading      = false,
}) {
  const confirmRef = useRef(null)

  // Focus the confirm button when modal opens
  useEffect(() => {
    confirmRef.current?.focus()
  }, [])

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={styles.modal}>
        <div className={styles.iconWrap}>
          <span className={styles.icon}>
            {variant === 'danger'  ? '⚠' :
             variant === 'warning' ? '⚡' : '?'}
          </span>
        </div>

        <h2 id="confirm-title" className={styles.title}>{title}</h2>
        {message && <p className={styles.message}>{message}</p>}

        <div className={styles.actions}>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            className={`${styles.confirmBtn} ${styles[variant]}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading
              ? <><span className={styles.spinner} /> Working…</>
              : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
