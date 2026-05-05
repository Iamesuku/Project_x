// ── NEXUS Formatting Utilities ────────────────────────────────────────────
// Single source of truth for all display formatting across the app.

/**
 * Format a monetary amount with the correct currency symbol.
 * @param {number} amount
 * @param {'NGN'|'USD'} currency
 * @param {{ compact?: boolean }} opts
 */
export function formatCurrency(amount, currency = 'NGN', { compact = false } = {}) {
  const num = Number(amount) || 0
  const sym = currency === 'NGN' ? '₦' : '$'
  if (compact && num >= 1_000_000) return `${sym}${(num / 1_000_000).toFixed(1)}M`
  if (compact && num >= 1_000)     return `${sym}${(num / 1_000).toFixed(1)}K`
  return `${sym}${num.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Return a human-readable "time ago" string from a timestamp.
 * @param {number|string} ts — ms epoch or ISO string
 */
export function timeAgo(ts) {
  const diff = Date.now() - (typeof ts === 'number' ? ts : new Date(ts).getTime())
  const secs  = Math.floor(diff / 1000)
  const mins  = Math.floor(secs / 60)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (secs < 60)   return 'just now'
  if (mins < 60)   return `${mins}m ago`
  if (hours < 24)  return `${hours}h ago`
  if (days < 7)    return `${days}d ago`
  return new Date(typeof ts === 'number' ? ts : ts)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Format a date string / timestamp to a readable date.
 * @param {string|number|Date} date
 */
export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

/**
 * Truncate text to a maximum length with an ellipsis.
 * @param {string} text
 * @param {number} max
 */
export function truncate(text, max = 120) {
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max).trim()}…` : text
}

/**
 * Derive up-to-2-char initials from a name or email.
 * @param {string} name
 */
export function initials(name) {
  if (!name) return 'U'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

/**
 * Return today's date as YYYY-MM-DD.
 */
export function today() {
  return new Date().toISOString().slice(0, 10)
}
