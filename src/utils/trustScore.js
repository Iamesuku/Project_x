// ── NEXUS Trust Score System ──────────────────────────────────────────────
// Computes a 0–100 trust score from a user/freelancer object.
// This is the key differentiator: campus-verified identity + earned reputation.

/**
 * computeTrustScore — calculates a 0–100 integer trust score.
 *
 * Scoring breakdown (total = 100):
 *   +25  Email verified (Firebase emailVerified === true)
 *   +20  Profile complete (name + bio + location all filled)
 *   +20  At least 1 completed contract (completedJobs >= 1)
 *   +20  Average rating quality (>= 4.5 → 20pts, >= 3.5 → 10pts)
 *   +15  Member for > 30 days (memberSince date)
 *
 * @param {Object} user
 * @param {boolean} [user.emailVerified]
 * @param {string}  [user.name]
 * @param {string}  [user.bio]
 * @param {string}  [user.location]
 * @param {number}  [user.completedJobs]
 * @param {number}  [user.rating]
 * @param {string}  [user.memberSince]  — ISO date string e.g. '2025-09-01'
 * @returns {number} integer 0–100
 */
export function computeTrustScore(user = {}) {
  let score = 0

  // ── +25: University email verified ──
  if (user.emailVerified === true) score += 25

  // ── +20: Profile complete ──
  const hasName     = typeof user.name === 'string' && user.name.trim().length > 0
  const hasBio      = typeof user.bio  === 'string' && user.bio.trim().length  > 0
  const hasLocation = typeof user.location === 'string' && user.location.trim().length > 0
  if (hasName && hasBio && hasLocation) score += 20

  // ── +20: Has at least 1 completed contract ──
  const jobs = Number(user.completedJobs) || 0
  if (jobs >= 1) score += 20

  // ── +20: Rating quality ──
  const rating = Number(user.rating) || 0
  if (rating >= 4.5) score += 20
  else if (rating >= 3.5) score += 10

  // ── +15: Member for > 30 days ──
  if (user.memberSince) {
    try {
      const since = new Date(user.memberSince)
      const now   = new Date()
      const days  = (now - since) / (1000 * 60 * 60 * 24)
      if (days > 30) score += 15
    } catch {}
  }

  return Math.min(100, Math.max(0, Math.round(score)))
}

/**
 * getTrustLabel — returns a tier label and colour for a given score.
 *
 * @param {number} score
 * @returns {{ label: string, color: string }}
 */
export function getTrustLabel(score) {
  if (score >= 80) return { label: 'Highly Trusted', color: '#1a7f4e' }
  if (score >= 60) return { label: 'Trusted',        color: '#2563eb' }
  if (score >= 40) return { label: 'Building Trust', color: '#d97706' }
  return              { label: 'New Member',         color: '#6b7280' }
}

/**
 * Deterministic hue from a string (for gradient avatar fallbacks).
 * @param {string} str
 * @returns {number} hue 0–360
 */
export function nameToHue(str = '') {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 360
}
