import styles from './TrustBadge.module.css'
import { computeTrustScore, getTrustLabel } from '../utils/trustScore'

/**
 * TrustBadge — NEXUS verified student + trust score badge.
 *
 * Props:
 *   user          — freelancer / user object (used to compute score internally)
 *   score         — override: pass a pre-computed score instead
 *   emailVerified — override: explicit emailVerified boolean
 *   compact       — if true, renders only the score chip + label (for cards)
 */
export default function TrustBadge({ user = {}, score: scoreProp, emailVerified: evProp, compact = false }) {
  const emailVerified = evProp !== undefined ? evProp : user.emailVerified
  const score = scoreProp !== undefined ? scoreProp : computeTrustScore({ ...user, emailVerified })
  const { label, color } = getTrustLabel(score)

  // Compact variant — one inline line for Browse cards
  if (compact) {
    return (
      <div className={styles.compact}>
        {emailVerified && (
          <span className={styles.verifiedPillSmall}>✓ Verified</span>
        )}
        <span className={styles.compactChip} style={{ '--score-color': color }}>
          {score}
        </span>
        <span className={styles.compactLabel} style={{ color }}>
          {label}
        </span>
      </div>
    )
  }

  // Full badge variant — for profile headers
  return (
    <div className={styles.badge}>
      {emailVerified && (
        <div className={styles.verifiedPill}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>Verified Student</span>
        </div>
      )}

      <div className={styles.scoreSection}>
        {/* Circular score chip with colour-coded ring */}
        <div className={styles.scoreChip} style={{ '--score-color': color, '--score-pct': `${score}%` }}>
          <svg className={styles.scoreRing} viewBox="0 0 44 44">
            {/* Track */}
            <circle cx="22" cy="22" r="18" className={styles.ringTrack} />
            {/* Progress */}
            <circle
              cx="22" cy="22" r="18"
              className={styles.ringProgress}
              style={{
                stroke: color,
                strokeDasharray: `${score * 1.131} 113.1`,
              }}
            />
          </svg>
          <span className={styles.scoreNum}>{score}</span>
        </div>

        <div className={styles.scoreInfo}>
          <p className={styles.scoreLabel} style={{ color }}>{label}</p>
          <p className={styles.scoreSub}>Trust Score · out of 100</p>
        </div>
      </div>
    </div>
  )
}
